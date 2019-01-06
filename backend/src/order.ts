'use strict';

import btoa = require('btoa');

var config = require('../config/config.js');
import db = require('./db');
import log = require('./log');
import mail = require('./mail');
import request = require('request');
import uuidv4 = require('uuid/v4');
import _ = require('underscore');
import ticket =  require('./ticket');
import md5 = require('md5');
import auth = require('./auth');
import jsdom = require('jsdom');
import fs = require('fs');

import {to, reject, resolve} from './util';
import payment from './payment';
import { ICreateArgs, ISuccessResponse, ICancelResponse, IStatusResponse, ICreateResponse, IPayment } from './payment';
import { IConnection } from 'mysql';
import { Request } from 'express';

const MIN_PAYMENT = 0.65;
const DEFAULT_PROVIDER = config.payment.provider ? config.payment.provider : 'null-provider';

export interface IReservedSeat {
  seat_id: number;
  discount_group_id: number;
}

export interface IContact {
  discount_code?: string;
  name: string;
  email: string;
  wants_email: boolean;
  is_admin?: boolean;
}

export interface IOrder {
  discount_code: string;
  email: string;
  name: string;
  wants_email: boolean;
  order_hash: string;
  order_id: number;
  order_price: number;
  payment_id: string;
  payment_url: string;
  payment_provider: string;
  show_id: number;
  status: 'seats-reserved' | 'payment-pending' | 'paid' | 'cancelled' | 'expired';
  time: string;
  tickets: ticket.ITicket[];
  tickets_total_price: number;
  venue_id: number;
}

export interface IAdminOrderListItem {
  id: number;
  name: string;
  email: string;
  price: number;
  discount_code: string;
  hash: string;
  payment_url: string;
  payment_id: string;
  payment_provider: string;
  status: string;
  tickets_count: number;
  tickets_used_count: number;
  time: string;
}

export function checkExpired(): Promise<any> {
  return db.query('delete from nk2_orders \
    where status = "seats-reserved" \
      and timestampdiff(minute, time, now()) > :expire_minutes',
    {expire_minutes: config.expire_minutes});
}

export async function checkPaymentStatus(order_id: number): Promise<string> {

  let resp: IStatusResponse, err: Error, res: any, handler: IPayment;

  log.debug('Check payment status', {order_id});

  log.debug('Acquiring payment_id and payment_url', {order_id});
  [res, err] = await to(db.query('select payment_id, payment_url from nk2_orders where id = :order_id', {order_id}));
  if (err) {
    log.error('Check payment status failed', {error: err, order_id});
    return reject(err);
  }

  log.debug('Create payment handler', {order_id});
  [handler, err] = await to(getPaymentHandler(order_id));
  if (err) {
    return reject(err);
  }

  [resp, err] = await to(handler.checkStatus(res[0].payment_id, res[0].payment_url))
  if (err) {
    log.error('Check payment status failed', {error: err, order_id});
    return reject(err);
  }

  log.info('Payment status checked', {order_id});

  return resolve(resp.status);
}

export async function checkAndUpdateStatus(order_id: number): Promise<any> {

  let status: string,  err: Error, res;

  [status, err] = await to(checkPaymentStatus(order_id));
  if (err) {
    return reject(err);
  }

  log.info('ADMIN: checked order payment status', {order_id: order_id, status: status});

  if (status === 'paid') {
   [res, err] = await to(updatePaymentStatusToPaid(order_id));
    if (err) {
      return reject(err);
    }
  }

  else if (status === 'cancelled') {
    [res, err] = await to(deleteCancelledOrder(order_id));
    if (err) {
      return reject(err);
    }
  }

  return resolve({status: status});
}

export function reserveSeats(show_id: number, seats: IReservedSeat[], user: string): Promise<IOrder> {
  log.info('Reserving seats', {show_id: show_id, seats: seats, user: user});

  var order_id;
  return checkExpired()
  .then(db.beginTransaction, (err) => {
    log.error('Failed to start a database transaction', {error: err});
    throw err;
  })
  .then((connection) => {
    return db.query('insert into nk2_orders (time, status, hash) values (now(), "seats-reserved", :hash)', {hash: uuidv4()}, connection)
    .then((res) => {
      order_id = res.insertId;
      log.info('Order created - creating tickets', {order_id: order_id});

      // Blargh. We want to do multiple inserts in a single query AND have one value resolved
      // within the query, so need to hack a bit
      var query_start = 'insert into nk2_tickets \
        (order_id, show_id, seat_id, discount_group_id, hash, price) \
        values ';

      // db.format() escapes everything properly
      var insert_values = seats.map( (e) => {
        return db.format('(:order_id, :show_id, :seat_id, :discount_group_id, :hash, \
      (select if(p.price >= d.eur, p.price-d.eur, 0) from nk2_prices p \
        join nk2_discount_groups d on d.id = :discount_group_id\
          and (d.show_id = :show_id or d.show_id is null) \
          and (:is_admin or d.admin_only = false) \
          and d.active = true \
        where p.show_id = :show_id \
          and p.section_id = (select section_id from nk2_seats where id = :seat_id)) \
        )', {
          order_id: order_id,
          show_id: show_id,
          seat_id: e.seat_id,
          discount_group_id: e.discount_group_id,
          hash: uuidv4(),
          is_admin: auth.isAdmin(user)
        });
      });

      // Actually fire what we generated above
      return db.query(query_start + insert_values.join(','), {}, connection);
    })
    .then((res) => {
      log.info('Created tickets', {order_id: order_id});
      return db.commit(connection);
    })
    .then((res) => get(order_id))
    .catch((err) => {
      log.error('Creating tickets failed - rolling back', {order_id: order_id, error: err});
      return db.rollback(connection).then(() => Promise.reject(err));
    });
  });
}

export function updateContact(order_id: number, data: IContact, user): Promise<any> {
  // TODO: the check below assumes that all tickets in a order are related to same production, which is not enforced by db schema
  var discountCheck = 'select (:is_admin | ((dc.use_max - count(*)) > 0)) as valid from nk2_orders o \
    join nk2_discount_codes dc on dc.code = o.discount_code \
      and dc.production_id = (select production_id from nk2_shows ss \
                                join nk2_tickets tt on tt.show_id = ss.id \
                                join nk2_orders oo on oo.id = tt.order_id \
                                where oo.id = :order_id \
                                group by production_id) \
    where o.discount_code = :discount_code';
  // make falsy to be a real NULL
  if (!data.discount_code) {
    data.discount_code = null;
    discountCheck = 'select 1 as valid';
  }
  data.is_admin = auth.isAdmin(user);
  log.info('Updating contact details', {order_id: order_id, contact: data, user: user});

  return db.query(discountCheck, data)
    .then( (rows) => {
      if (!(/* is admin || */ rows[0].valid)) {
        log.error('Discount code not valid and user is not admin', {order_id: order_id, contact: data});
        throw 'Discount code not valid and user is not admin';
      }

      return db.query('update nk2_orders set \
        name = :name, \
        email = :email, \
        discount_code = :discount_code, \
        wants_email = :wants_email, \
        price = (select if(sum(price) - ifnull(d.eur,0) >= 0, sum(price)-ifnull(d.eur,0), 0) \
          from nk2_tickets t \
          left join nk2_discount_codes d on d.code = :discount_code \
          where t.order_id = :order_id) \
      where id = :order_id and hash = :order_hash',
        data);
    }).then((res) => {
      if (res.changedRows !== 1) {
        var errmsg = 'Should have updated one row, updated really ' + res.changedRows + ' rows';
        log.error(errmsg);
        throw errmsg;
      }
      log.info('Updated contact details successfully');
      return get(order_id);
    }).catch((err) => {
      log.error('Updating contact details failed: ' + err);
  });
}

export function cancel(order_id: number, order_hash: string): Promise<any> {
  return db.query('delete from nk2_orders where id = :id and hash = :hash and status = "seats-reserved" and payment_id is null', {id: order_id, hash: order_hash})
  .then(() => {
    log.info('Cancelled order', {order_id: order_id});
  });
}

export function get(order_id: number): Promise<IOrder> {
  return checkExpired().then(() =>
    db.query('select \
      tickets.id ticket_id,  \
      tickets.show_id,\
      tickets.seat_id,\
      tickets.discount_group_id, \
      tickets.hash ticket_hash, \
      tickets.price ticket_price, \
      tickets.used_time,\
      \
      orders.id order_id,\
      orders.hash order_hash,\
      orders.name,\
      orders.email,\
      orders.discount_code,\
      orders.wants_email, \
      orders.time,\
      orders.price order_price,\
      orders.payment_url, \
      orders.payment_id,\
      orders.payment_provider, \
      orders.status, \
      \
      shows.title show_title, \
      date_format(shows.time, "%e.%c.%Y") show_date,  \
      time_format(shows.time, "%k:%i") show_time, \
      \
      productions.ticket_image_src ticket_image_src, \
      productions.performer production_performer, \
      productions.title production_title, \
      \
      seats.row row, \
      seats.number seat_number, \
      \
      sections.id section_id, \
      sections.title section_title, \
      sections.row_name row_name, \
      \
      venues.id venue_id, \
      venues.title venue_title, \
      venues.description venue_description, \
      \
      discount_groups.title discount_group_title \
    from nk2_orders orders \
    left join nk2_tickets tickets on orders.id = tickets.order_id \
    left join nk2_shows shows on tickets.show_id = shows.id \
    left join nk2_productions productions on shows.production_id = productions.id \
    left join nk2_seats seats on tickets.seat_id = seats.id \
    left join nk2_sections sections on seats.section_id = sections.id \
    left join nk2_venues venues on sections.venue_id = venues.id \
    left join nk2_discount_groups discount_groups on tickets.discount_group_id = discount_groups.id \
    where orders.id = :id',
    {id: order_id}))
  .then( (rows) => {
    if (rows.length === 0) {
      return Promise.reject('No orders found for given id!');
    }
    var first = rows[0];
    var res: IOrder = _.pick(first, ['order_id', 'order_hash', 'name', 'email', 'discount_code', 'wants_email',
    'time', 'order_price', 'payment_url', 'payment_id', 'status', 'show_id', 'venue_id', 'payment_provider']);

    res.tickets = _.filter(_.map(rows, function(row) {
      return _.pick(row,
        ['ticket_id', 'show_id', 'show_title', 'show_date', 'show_time', 'venue_title', 'venue_description', 'seat_id', 'discount_group_id',
          'discount_group_title', 'ticket_hash', 'ticket_price', 'used_time', 'row', 'seat_number', 'section_id', 'section_title', 'row_name',
          'production_performer', 'production_title', 'ticket_image_src']);
    }), (ticket) => ticket.ticket_id !== null); // filter out the null ticket possibly produced by the left-join

    res.tickets_total_price = _.reduce(res.tickets, (r, ticket: any) => r + parseFloat(ticket.ticket_price), 0);
    return res;
  });
}

export function getAll(): Promise<IAdminOrderListItem[]> {
  return checkExpired().then(() => db.query('select * from nk2_orders orders', null));
}

export function getAllForShow(show_id: number): Promise<IAdminOrderListItem[]> {
  return checkExpired().then(() => db.query('select orders.*, count(*) as tickets_count, count(tickets.used_time) as tickets_used_count \
    from nk2_orders orders \
      join nk2_tickets tickets on tickets.order_id = orders.id \
    where tickets.show_id = :show_id \
    group by orders.id',
    {show_id: show_id}));
}

async function getPaymentHandler(order_id: number): Promise<IPayment> {

  let res: any, err: Error, conn: IConnection;

  [conn, err] = await to(db.beginTransaction());
  if (err) {
    log.error('Failed to get payment provider', {error: err, order_id});
    return reject(err);
  }

  [res, err] = await to(db.query('select payment_provider from nk2_orders where id = :order_id', {order_id}, conn));
  if (err) {
    log.error('Failed to get payment provider', {error: err, order_id});
    await db.rollback(conn);
    return reject(err);
  }

  const provider = res[0].payment_provider;

  if (!provider) {
    log.info('No provider found, using default provider', {order_id});
    [res, err] = await to(db.query('update nk2_orders set payment_provider = :provider where id = :order_id', {provider: DEFAULT_PROVIDER, order_id}, conn));
    if (err) {
      log.error('Failed to update payment provider', {error: err, order_id});
      await db.rollback(conn);
      return reject(err);
    }

    [res, err] = await to(db.commit(conn));
    if (err) {
      log.error('Failed to update payment provider', {error: err, order_id});
      await db.rollback(conn);
      return reject(err);
    }
  }

  const handler: IPayment = payment(provider ? provider : DEFAULT_PROVIDER);

  return resolve(handler);

}

export async function preparePayment(order_id: number): Promise<any> {

  log.info('Preparing payment', {order_id: order_id});

  let conn: IConnection, res: any, err: Error, order: IOrder, createResp: ICreateResponse, handler: IPayment;

  [conn, err] = await to<IConnection>(db.beginTransaction());
  if(err) {
    log.error('Failed to prepare payment -- could not acquire database connection', {error: err, order_id: order_id});
    return reject(err);
  }

  log.debug('Check order payment status', {order_id});
  [res, err] = await to(db.query('select status from nk2_orders where id = :order_id', {order_id}, conn));
  if (err) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    await db.rollback(conn);
    return reject(err);
  }

  log.debug('Reject if status is not seats-reserved', {order_id});
  if (res[0]['status'] !== 'seats-reserved'){
    err = {name: "Validation error", message: "Invalid order status"}
    log.error('Failed to prepare payment', {error: err, order_id:order_id})
    await db.rollback(conn);
    return reject(err);
  }

  log.debug('Set order status to payment-pending', {order_id});
  [res, err] = await to(db.query('update nk2_orders set status = "payment-pending" where id = :order_id', {order_id}, conn));
  if (err) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    await db.rollback(conn);
    return reject(err);
  }

  log.debug('Commit payment status', {order_id});
  [res, err] = await to(db.commit(conn));
  if(err) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    return reject(err);
  }

  [order, err] = await to<IOrder>(get(order_id));
  if (err) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    return reject(err);
  }

  const args: ICreateArgs = {
    successRedirect: config.public_url + 'api/orders/' + order_id + '/success',
    errorRedirect: config.public_url + 'api/orders/' + order_id + '/failure',
    successCallback: config.public_url + 'api/orders/' + order_id + '/notify/success',
    errorCallback: config.public_url + 'api/orders/' + order_id + '/notify/failure',
  };

  log.debug('Creating payment with handler', {order_id});

  [handler, err] = await to(getPaymentHandler(order_id));
  if (err) {
    return reject(err);
  }

  [createResp, err] = await to<ICreateResponse>(handler.create(order, args));
  if (err) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    return reject(err);
  }

  log.debug('Update payment handler', {order_id})
  let arr = await to(db.query('update nk2_orders set payment_id = :payment_id, payment_url = :payment_url where id = :order_id', {payment_id: createResp.payment_id, payment_url: createResp.payment_url, order_id}));
  //Hack here a little bit, we are only interested in error, not result value
  if (arr[1]) {
    log.error('Failed to prepare payment', {error: err, order_id: order_id});
    return reject(err);
  }

  log.debug('Updated payment info successfully', {order_id, res})


  log.info('Created payment for order', {order_id});

  return resolve({url: createResp.payment_url});
}

export async function paymentDone(order_id: number, req: Request): Promise<any> {

  let res, err: Error, successResp: ISuccessResponse, conn: IConnection, order: IOrder, handler: IPayment;
  
  log.debug('Create payment handler', {order_id});
    [handler, err] = await to(getPaymentHandler(order_id));
  if (err) {
    return reject(err);
  }

  log.debug('Handle success request', {order_id});
  [successResp, err] = await to(handler.handleSuccessCallback(req));
  if (err) {
    log.error('Payment succes handling failed', {error: err,order_id});
    return reject(err);
  }

  log.info('Payment success handling succeeded', {order_id});


  [res, err] = await to(updatePaymentStatusToPaid(order_id));
  if (err) {
    return reject(err);
  }

  log.debug('Sending tickets', {order_id});
  [res, err] = await to(sendTickets(order_id));
  if (err) {
    return reject(err);
  }

  log.debug('Getting updated order', {order_id});
  [order, err] = await to<IOrder>(get(order_id));
  if (err) {
    return reject(err);
  }

  return resolve(order);
}

async function updatePaymentStatusToPaid(order_id: number): Promise<any> {

  let res, err: Error, conn: IConnection;

  [conn, err] = await to(db.beginTransaction());
  if (err) {
    log.error('Payment done failed', {error: err, order_id});
    return reject(err);
  }

  [res, err] = await to(db.query('select status from nk2_orders where id = :order_id', {order_id}, conn));
  if (err) {
    log.error('Payment done failed', {error: err, order_id});
  }

  if(res[0].status === 'paid') {
    log.info('Order was already paid', {order_id: order_id});
    await db.rollback(conn);
    return resolve(null);
  }

  log.debug('Updating order payment status', {order_id});
  [res, err] = await to(db.query('update nk2_orders set status = "paid" where id = :order_id',{order_id}, conn));
  if (err) {
    log.error('Updating payment status failed', {error: err, order_id});
    await db.rollback(conn);
    return reject(err);
  }

  [res, err] = await to(db.commit(conn));
  if (err) {
    log.error('Updating payment status failed', {error: err, order_id});
    return reject(err);
    }

  log.debug('Order payment status updated', {order_id});

  return resolve({order_id});
}

export async function paymentCancelled(order_id: number, req: Request): Promise<any> {

  let res, err: Error, cancelResp: ICancelResponse, handler: IPayment;

  log.debug('Cancelling payment', {order_id});

  log.debug('Create payment handler');
  [handler, err] = await to(getPaymentHandler(order_id));
  if (err) {
    return reject(err);
  }

  log.debug('Handle payment cancel callback');
  [cancelResp, err] = await to(handler.handleCancelCallback(req));

    if (err) {
    log.error('Payment cancel handling failed', {error: err,order_id});
    return reject(err);
  }

  log.info('Payment cancel handling succeeded', {order_id});

  return await to(deleteCancelledOrder(order_id));

}

async function deleteCancelledOrder(order_id: number): Promise<any> {

  let res, err: Error;

  log.info('Deleting order', {order_id});

  [res, err] = await to(db.query('delete from nk2_orders where id = :order_id', {order_id: order_id}));
  if (err) {
    log.error('Payment cancelled failed', {error: err, order_id});
    return reject(err);
  }

  return resolve({});
}

export function sendTickets(order_id: number): Promise<any> {
  log.info('Sending tickets', {order_id: order_id});
  var order;
  return get(order_id)
  .then((order_: IOrder) => {
    order = order_;
    return ticket.generatePdfBuffer(order.tickets);
  })
  .then((pdf: Buffer) => {
    // If we ever allow to have tickets for more than one show in an order, this will be wrong.
    var order_datetime = order.tickets[0].show_date + ' klo ' + order.tickets[0].show_time;
    var order_showtitle = order.tickets[0].show_title;
    var order_production_title = order.tickets[0].production_title;
    var order_production_performer = order.tickets[0].production_performer;
    var filename = 'lippu_' + order_production_performer.toLowerCase().replace(/[\W]+/g, '') + '.pdf';
    mail.sendMail({
      from: config.email.from,
      to: order.email,
      subject: 'Kiitos tilauksestasi - ' + order_production_performer + ' / ' + order_production_title + ' / ' + order_showtitle,
      text: 'Kiitos tilauksestasi!\n\n' +
        'Tilaamasi liput ovat tämän viestin liitteenä pdf-muodossa. Esitäthän teatterilla liput joko tulostettuna tai mobiililaitteestasi. Voit kysyä lisätietoja vastaamalla tähän viestiin.\n\n' +
        'Esitys alkaa ' + order_datetime + '. Saavuthan paikalle ajoissa ruuhkien välttämiseksi. Nähdään näytöksessä!\n\n' +
        'Ystävällisin terveisin,\nTeekkarispeksi\n',
      attachment: new mail.mailer.Attachment({
        filename: filename,
        data: pdf,
        contentType: 'application/pdf'
      })
    }, (error, info) => {
      if (error) {
        log.error('Sending tickets failed', {error: error, order_id: order_id});
        return;
      }
      log.info('Tickets sent', {order_id: order_id});
    });
  });
}

export function update(order_id: number, order: IOrder): Promise<IOrder> {
  log.info('ADMIN: Updating order details', order);
  return db.query('update nk2_orders set name = :name, email = :email where id = :order_id', order)
  .then((res) => {
    if (res.changedRows !== 1) {
      var errmsg = 'ADMIN: Should have updated one row, updated really ' + res.changedRows + ' rows';
      log.error(errmsg);
      throw errmsg;
    }
    log.info('ADMIN: Updated order successfully');
    return get(order_id);
  }).catch((err) => {
    log.error('ADMIN: Failed to update order', {error: err});
    return null;
  });
}

export function removeTicket(order_id: number, ticket_id: number, ticket_hash: string): Promise<IOrder> {
  log.info('ADMIN: removing ticket ', {ticket_id: ticket_id, order_id: order_id});
  return db.query('delete from nk2_tickets where id = :ticket_id and hash = :ticket_hash and order_id = :order_id', {ticket_id: ticket_id, ticket_hash: ticket_hash, order_id: order_id})
  .then((rows) => {
    if (rows.affectedRows !== 1) {
      throw 'ADMIN: Removing a ticket failed - ' + rows.affectedRows + ' were affected instead of 1!';
    }
    log.info('ADMIN: ticket removed');
    return get(order_id);
  });
}

export function useTicket(order_id: number, ticket_id: number, ticket_hash: string): Promise<IOrder> {
  log.info('ADMIN: using ticket manually', {ticket_id: ticket_id, order_id: order_id});
  return db.query('update nk2_tickets set used_time = now() \
      where id = :ticket_id and hash = :ticket_hash and order_id = :order_id', {ticket_id: ticket_id, ticket_hash: ticket_hash, order_id: order_id})
  .then((rows) => {
    if (rows.affectedRows !== 1) {
      throw 'ADMIN: Using a ticket failed - ' + rows.affectedRows + ' were affected instead of 1!';
    }
    log.info('ADMIN: ticket used');
    return get(order_id);
  });
}

export function kirjaaja(): Promise<any> {
  log.info('Fetching info for Kirjaaja');
  // some order might not have tickets, if the seats have been changed (i.e. removed from the order that was paid and a new order was created using discount code or something similar)
  // => left outer join for tickets
  return db.query('select o.id as order_id, p.performer, v.description, o.price \
    from nk2_orders o \
    left outer join nk2_tickets t on o.id = t.order_id \
    join nk2_shows s on s.id = t.show_id \
    join nk2_productions p on s.production_id = p.id \
    join nk2_venues v on v.id = s.venue_id \
    group by s.id, o.id') // direct insertion is safe due to parseInt and filter
    .then((rows: any[]) => {
      var grouped = _.indexBy(rows, (row) => 'LIPPUKAUPPA_' + row.order_id); // assumes an order has only tickets for a single show, maybe wrong in the future!
      return _.mapObject(grouped, (x) => ({price: x.price, performer: x.performer, city: x.description.split(' ').pop()})); // assumes description ends with the city name, as they should do!
    });
}
