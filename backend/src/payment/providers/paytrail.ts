import payment = require('../index');
import {ICreateArgs, ICreateResponse, IStatusResponse } from '../index';
const config = require('../../../config/config').payment['paytrail'];
import order = require('../../order');
import ticket = require('../../ticket');
import log = require('../../log');
import { Request } from 'express';

import axios from 'axios';
import _ = require('underscore');
import request = require('request');
import jsdom = require('jsdom');
import fs = require('fs');
import { md5 } from '../../utils';

const PROVIDER = 'paytrail';

// Creating https client with custom configuration
const CLIENT = axios.create({
  baseURL: 'https://payment.paytrail.com/api-payment/',
  headers: { 'X-Verkkomaksut-Api-Version': '1' },
  auth: {
    username: config.user,
    password: config.password,
  },
});

export async function create(order: order.IOrder, args: ICreateArgs): Promise<ICreateResponse> {

  try {
    const resp = await CLIENT({
      url: '/create',
      method: 'post',
      data: orderToCreateBody(order, args),
    });

    return {
      payment_id: resp.data.token,
      redirect_url: resp.data.url,
      payment_url: resp.data.url,
      payment_provider: PROVIDER,
    };

  } catch (err) {
    log.error('Create payment failed', {error: err.response.data, order_id: order.order_id});
    throw err;
  }

}

export async function verifySuccess(req: Request): Promise<void> {
  try {
    const fields = [
      req.query.ORDER_NUMBER,
      req.query.TIMESTAMP,
      req.query.PAID,
      req.query.METHOD,
      config.password,
    ];

    if(!verifySignature(fields, req.query.RETURN_AUTHCODE)) {
      throw {name: 'Verification error', message: 'Signature verification failed'};
    }
  } catch (err) {
    log.error('Verify cancel failed', {error: err});
    throw err;
  }
}

export async function verifyCancel(req: Request): Promise<void> {
  try {
    const fields = [
      req.query.ORDER_NUMBER,
      req.query.TIMESTAMP,
      config.password,
    ];

    if ( !verifySignature(fields, req.query.RETURN_AUTHCODE) ) {
      throw {name: 'Verification error', message: 'Signature verification failed'};
    }
  } catch (err) {
    log.error('Verify cancel failed', {error: err});
    throw err;
  }
}

export async function checkStatus(order_id: number, payment_id: string, payment_url: string): Promise<IStatusResponse> {
  try {

    const body = await getStatusPage(order_id);
    const status = await parseStatusPage(body, order_id);
    return {
      payment_id,
      payment_url,
      status
    }
  } catch (err) {
    log.error('Failed to check payment status', {error: err, order_id});
    throw err;
  }
}

function getStatusPage(order_id: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const jar = request.jar();
    const authcode = md5([config.password, config.user, payment.orderIdToName(order_id)].join('&')).toUpperCase();
    request.post({
      url: 'https://payment.paytrail.com/check-payment',
      form: {
        MERCHANT_ID: config.user,
        ORDER_NUMBER: payment.orderIdToName(order_id),
        AUTHCODE: authcode,
        VERSION: '2',
        CULTURE: 'fi_FI',
      },
      followAllRedirects: true, // Really paytrail, this is sad.
      jar: jar,
    }, (err, response, body: string) => {
      err ? reject(err) : resolve(body);
    });
  })
}

function parseStatusPage(body: string, order_id: number): Promise<'paid' | 'cancelled' | 'payment-pending'> {
  return new Promise((resolve, reject) => {
    jsdom.env({
      html: body,
      src: [fs.readFileSync('./node_modules/jquery/dist/jquery.js', 'utf-8')],
      done: (err, window: any) => {
        if (err) reject(err);

        var $ = window.$;
        var rows = $('table tr');
        if (rows.length !== 2) {
            return reject('Row count doesnt match for order ' + order_id + ': got ' + rows.length + ' - expected only' +
              ' headers ' + 'and one other');
        }

        var cells = $(rows[1]).find('td');
        if (cells.length !== 4) {
          return reject('Column count doesnt match for order ' + order_id + ': got ' + cells.length + ', expected ' +
            'four');
        }

        var text = cells[3].innerHTML;
        var possible_status = {
          'Maksettu (Maksu vahvistettu)': 'paid',
          'Maksettu (Suoritettu)': 'paid',
          'Peruuntunut': 'cancelled',
          'Peruuntunut (Ei maksettu)': 'cancelled',
          'Odottaa maksua': 'payment-pending'
        };

        if (_.has(possible_status, text)) {
          return resolve(possible_status[text]);
        } else {
          return reject('Unknown status for order ' + order_id + ': "' + text + '"');
        }
      }
    });
  });
}

function verifySignature(fields: string[], expectedHash: string): boolean {
  return expectedHash === md5(fields.join('|')).toUpperCase();
}

function orderToCreateBody(order: order.IOrder, args: ICreateArgs) {
  var ticket_rows = _.map(order.tickets, (ticket: ticket.ITicket) => {
    return {
      title: payment.getTicketTitle(ticket),
      code: ticket.ticket_id,
      amount: '1.00',
      price: ticket.ticket_price,
      vat: '0.00',
      discount: '0.00',
      type: '1',
    }
  });

  if(order.discount_code && (order.tickets_total_price > order.order_price)) {
    var discount = order.tickets_total_price - order.order_price;
    log.info('Using discount code', {discount_code: order.discount_code, discount_amount: discount, order_id: order.order_id});
    ticket_rows.push({
      title: 'Alennuskoodi: ' + order.discount_code,
      code: order.discount_code.replace(/[^\w]/gi, '').substr(0, 16), // paytrail API restriction
      amount: '1.00',
      price: -discount,
      vat: '0.00',
      discount: '0.00',
      type: '1'
    });
  }

  return {
    orderNumber: payment.orderIdToName(order.order_id),
    currency: 'EUR',
    locale: 'fi_FI',
    urlSet: {
      success: args.successRedirect,
      failure: args.errorRedirect,
      notification: args.successCallback,
    },
    orderDetails: {
      includeVat: '1',
      contact: {
        email: order.email,
        firstName: order.name,
        lastName: ' ',
        address: {
          street: ' ',
          postalCode: ' ',
          postalOffice: ' ',
          country: 'FI'
        },
      },
      products: ticket_rows,
    },
  }
}
