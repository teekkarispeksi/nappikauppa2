import payment = require('../index');
import {ICreateArgs, ICreateResponse, IStatusResponse } from '../index';
const config = require('../../../config/config').payment['paytrail'];
import order = require('../../order');
import ticket = require('../../ticket');
import log = require('../../log');
import { Request } from 'express';

import axios from 'axios';
import md5 = require('md5');
import _ = require('underscore');

const PROVIDER = 'paytrail';

//Creating https client with custom configuration
const CLIENT = axios.create({
  baseURL: 'https://payment.paytrail.com/api-payment/',
  headers: { 'X-Verkkomaksut-Api-Version': 1 },
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

    if(!verify(fields, req.query.RETURN_AUTHCODE)) {
      throw {name: 'Verification error', message: 'Signature verification failed'}; 
    }
  } catch (err) {
    log.error('Verify cancel failed', {error: err})
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

    if(!verify(fields, req.query.RETURN_AUTHCODE)) {
      throw {name: 'Verification error', message: 'Signature verification failed'};
    }
  } catch (err) {
    log.error('Verify cancel failed', {error: err})
    throw err;
  }
}

export async function checkStatus(payment_id: string, payment_url: string): Promise<IStatusResponse> {
  log.warn("Check status is not implemented", {provider: PROVIDER});
  return {
    payment_id,
    payment_url,
    status: 'not-implemented',
  };
}

function verify(fields: string[], expectedHash: string): boolean {
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
    orderNumber: payment.getOrderId(order),
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