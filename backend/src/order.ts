'use strict';

var config = require('../config/config.js');
import db = require('./db');
import log = require('./log');
import mail = require('./mail');
import request = require('request');
import uuid = require('node-uuid');
import _ = require('underscore');
import ticket =  require('./ticket');
import md5 = require('md5');
import auth = require('./confluenceAuth');

// Paytrail wants to charge something, so they don't support minimal payments
const PAYTRAIL_MIN_PAYMENT = 0.65;
const PAYTRAIL_PREFIX = 'LIPPUKAUPPA';

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
  reserved_session_id: string;
  reserved_until: Date;
  status: string;
  time: Date;
  tickets: ticket.ITicket[];
  tickets_total_price: number;
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
  reserved_session_id: string;
  reserved_until: Date;
  status: string;
  time: Date;
}

export function checkExpired(): Promise<any> {
  return db.query('delete from nk2_orders \
    where status = "seats-reserved" \
      and timestampdiff(minute, time, now()) > :expire_minutes',
    {expire_minutes: config.expire_minutes});
}

export function reserveSeats(show_id: number, seats: IReservedSeat[], user: string): Promise<any> {
  log.info('Reserving seats', {show_id: show_id, seats: seats, user: user});

  var order_id;
  return checkExpired()
    .then(db.beginTransaction, (err) => {
      log.error('Failed to start a database transaction', {error: err});
      throw err;
    })
    .then(() =>
      db.query('insert into nk2_orders (time, status, hash) values (now(), "seats-reserved", :hash)',
      {hash: uuid.v4()}))
    .then((res) => {
      order_id = res.insertId;
      log.info('Order created - creating tickets', {order_id: order_id});

      // Blargh. We want to do multiple inserts in a single query AND have one value resolved
      // within the query, so need to hack a bit
      var query_start = 'insert into nk2_tickets \
        (order_id, show_id, seat_id, discount_group_id, hash, price) \
        values ';

      // db.format() escapes everything properly
      var insert_values = seats.map(function (e) {
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
          hash: uuid.v4(),
          is_admin: auth.isAdmin(user)
        });
      });

      // Actually fire what we generated above
      return db.query(query_start + insert_values.join(','));
    })
    .then((res) => {
      log.info('Created tickets', {order_id: order_id});
      return db.commit();
    })
    .then((res) => get(order_id))
    .catch((err) => {
      log.error('Creating tickets failed - rolling back', {order_id: order_id, error: err});
      db.rollback()
      .then(() => {
        throw err;
      });
    });
}

export function updateContact(order_id: number, data: IContact, user): Promise<any> {
  var discountCheck = 'select (:is_admin | ((dc.use_max - count(*)) > 0)) as valid from nk2_orders o \
    join nk2_discount_codes dc on dc.code = o.discount_code \
    where o.discount_code = :discount_code';
  // make falsy to be a real NULL
  if (!data.discount_code) {
    data.discount_code = null;
    discountCheck = 'select 1 as valid';
  }
  data.is_admin = auth.isAdmin(user);
  log.info('Updating contact details', {order_id: order_id, contact: data, user: user});

  return db.query(discountCheck, data)
    .then(function(rows) {
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

export function get(order_id: number): Promise<IOrder> {
  return db.query('select \
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
      orders.reserved_until,\
      orders.reserved_session_id,\
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
      sections.title section_title, \
      sections.row_name row_name, \
      \
      venues.title venue_title, \
      venues.description venue_description, \
      \
      discount_groups.title discount_group_title \
    from nk2_orders orders \
    join nk2_tickets tickets on orders.id = tickets.order_id \
    join nk2_shows shows on tickets.show_id = shows.id \
    join nk2_productions productions on shows.production_id = productions.id \
    join nk2_seats seats on tickets.seat_id = seats.id \
    join nk2_sections sections on seats.section_id = sections.id \
    join nk2_venues venues on sections.venue_id = venues.id \
    join nk2_discount_groups discount_groups on tickets.discount_group_id = discount_groups.id \
    where orders.id = :id',
    {id: order_id})
  .then(function(rows) {
      var first = rows[0];
      var res: IOrder = _.pick(first, ['order_id', 'order_hash', 'name', 'email', 'discount_code', 'wants_email', 'time', 'order_price', 'payment_url', 'payment_id',
        'reserved_until', 'reserved_session_id', 'status']);

      res.tickets = _.map(rows, function(row) {
        return _.pick(row,
          ['ticket_id', 'show_id', 'show_title', 'show_date', 'show_time', 'venue_title', 'venue_description', 'seat_id', 'discount_group_id',
            'discount_group_title', 'ticket_hash', 'ticket_price', 'used_time', 'row', 'seat_number', 'section_title', 'row_name',
            'production_performer', 'production_title', 'ticket_image_src']);
      });

      res.tickets_total_price = _.reduce(res.tickets, (r, ticket: any) => r + parseFloat(ticket.ticket_price), 0);
      return res;
    })
  .catch((err) => {
    log.error('Failed to get order', {order_id: order_id, error: err});
    throw err;
    return null;
  });
}

export function getAll(): Promise<IAdminOrderListItem> {
  return db.query('select * from nk2_orders orders', null);
}

export function getAllForShow(show_id: number): Promise<IAdminOrderListItem> {
  return db.query('select distinct orders.* \
    from nk2_orders orders \
      join nk2_tickets tickets on tickets.order_id = orders.id \
    where tickets.show_id = :show_id',
    {show_id: show_id});
}

export function preparePayment(order_id: number): Promise<any> {
  log.info('Preparing payment', {order_id: order_id});

  return db.query('update nk2_orders set status = "payment-pending" where id = :order_id',
    {order_id: order_id})
    .then(() => get(order_id))
    .then(function(order: IOrder) {
      if (order.order_price < PAYTRAIL_MIN_PAYMENT) {
        // as we skip Paytrail, we don't get their hash, but we can fake it
        // TIMESTAMP and METHOD are only used for calculating the hash
        log.info('Payment would have been smaller than minimum amount - giving for free',
          {amount: order.order_price, minimum_amount: PAYTRAIL_MIN_PAYMENT, order_id: order_id});

        var params = {PAID: 'free', TIMESTAMP: '',  METHOD: '', RETURN_AUTHCODE: null};
        var verification = [PAYTRAIL_PREFIX + order_id, params.TIMESTAMP, params.PAID, params.METHOD, config.paytrail.password].join('|');
        params.RETURN_AUTHCODE = md5(verification).toUpperCase();

        return paymentDone(order_id, params).then((res) => { return {url: '#ok/' + order.order_id + '/' + order.order_hash}; });
      }

      var ticket_rows = _.map(order.tickets, (ticket: ticket.ITicket) => {
        return {
          'title': 'Pääsylippu: ' + ticket.production_performer + ' / ' + ticket.production_title + ' / ' + ticket.show_title,
          'code': ticket.ticket_id,
          'amount': '1.00',
          'price': ticket.ticket_price,
          'vat': '0.00',
          'discount': '0.00', // No discounts here. Price includes everything.
          'type': '1'
        };
      });

      if (order.discount_code && (order.tickets_total_price - order.order_price) > 0) {
        var discount_amount = (order.tickets_total_price - order.order_price);
        log.info('Using discount code', {discount_code: order.discount_code, discount_amount: discount_amount, order_id: order_id});
        var discount_row = {
          'title': 'Alennuskoodi: ' + order.discount_code,
          'code': order.discount_code,
          'amount': '1.00',
          'price': -discount_amount,
          'vat': '0.00',
          'discount': '0.00',
          'type': '1'
        };
        ticket_rows.push(discount_row);
      }

      var payment = {
        'orderNumber': PAYTRAIL_PREFIX + order_id,
        'currency': 'EUR',
        'locale': 'fi_FI',
        'urlSet': {
          'success': config.public_url + 'api/orders/' + order_id + '/success',
          'failure': config.public_url + 'api/orders/' + order_id + '/failure',
          'notification': config.public_url + 'api/orders/' + order_id + '/notification'
        },
        'orderDetails': {
          'includeVat': '1',
          'contact': {
            'email': order.email,
            'firstName': order.name,
            'lastName': ' ', // these one-space-only fields are required by Paytrail, must be non-empty
            'address': {
              'street': ' ',
              'postalCode': ' ',
              'postalOffice': ' ',
              'country': 'FI'
            }
          },
          'products': ticket_rows
        }
      };

      log.info('Sending order details to Paytrail', {order_id: order_id});
      return new Promise((resolve, reject) => {
        request({
          uri: 'https://payment.paytrail.com/api-payment/create',
          method: 'POST',
          json: true,
          body: payment,
          headers: {
            'X-Verkkomaksut-Api-Version': '1'
          },
          auth: {
            'user': config.paytrail.user,
            'password': config.paytrail.password,
            'sendImmediately': true
          }
        }, function(err, response: any, body) {
          if (err || response.statusCode >= 400 || response.body.errorCode || response.body.errorMessage) {
            log.error('Got an error from Paytrail', {error: err, responseBody: body, statusCode: response.statusCode, statusMessage: response.statusMessage,
              requestHeaders: response.request.headers, requestBody: response.request.body, requestUri: response.request.uri, order_id: order_id});
            reject(err);
          }
          var url = body.url;
          db.query('update nk2_orders set payment_url = :url where id = :order_id',
            {order_id: order_id, url: url});

          resolve({url: url});
        });
      });
    })
    .catch((err) => {
      log.error('Failed to prepare payment', {error: err, order_id: order_id});
      throw err;
    });
}

export function paymentCancelled(order_id: number, params): Promise<any> {
  log.info('Payment was cancelled', {order_id: order_id});

  var verification = [PAYTRAIL_PREFIX + order_id, params.TIMESTAMP, config.paytrail.password].join('|');
  var verification_hash = md5(verification).toUpperCase();

  if (verification_hash === params.RETURN_AUTHCODE) {
    log.info('Verification hash matches - deleting order', {order_id: order_id});
    return db.query('delete from nk2_orders where id = :order_id',
      {order_id: order_id});
  } else {
    log.error('Hash verification failed!',
      {order_id: order_id, verification_hash: verification_hash, return_authcode: params.RETURN_AUTHCODE});
    throw 'Hash verification failed';
  }
}

export function paymentDone(order_id: number, params): Promise<any> {
  log.info('Payment done - verifying', {order_id: order_id});

  var verification = [PAYTRAIL_PREFIX + order_id, params.TIMESTAMP, params.PAID, params.METHOD, config.paytrail.password].join('|');
  var verification_hash = md5(verification).toUpperCase();

  if (verification_hash === params.RETURN_AUTHCODE) {
    log.info('Verification ok', {order_id: order_id});

    return db.beginTransaction()
    .then(function() {
      return db.query('update nk2_orders set \
        status = "paid", \
        payment_id = :payment_id \
      where id = :order_id',
        {
          order_id: order_id,
          payment_id: params.PAID
        });
    })
    .then(() => {
      db.commit();
      sendTickets(order_id);
      return get(order_id);
    })
    .catch((err) => {
      log.error('Updating payment status failed - rolling back', {error: err, order_id: order_id});
      db.rollback();
      throw 'Updating payment status failed - rolling back';
    });
  } else {
    log.error('Hash verification failed!',
      {order_id: order_id, verification_hash: verification_hash, return_authcode: params.RETURN_AUTHCODE});
    throw 'Hash verification failed!';
  }
}

export function sendTickets(order_id: number): Promise<any> {
  log.info('Sending tickets', {order_id: order_id});
  var order;
  return get(order_id)
  .then((order_: IOrder) => {
    order = order_;
    return ticket.generatePdfBuffer(order.tickets);
  })
  .then(function(pdf: Buffer) {
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
    }, function(error, info) {
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

export function removeTicket(order_id: number, ticket_id: number): Promise<IOrder> {
  log.info('ADMIN: removing ticket ', {ticket_id: ticket_id, order_id: order_id});
  return db.query('delete from nk2_tickets where id = :ticket_id and order_id = :order_id', {ticket_id: ticket_id, order_id: order_id})
  .then((rows) => {
    log.info('ADMIN: ticket removed');
    return get(order_id);
  })
  .catch((err) => {
    log.error('ADMIN: Failed to remove ticket ', ticket_id);
    return null;
  });
}
