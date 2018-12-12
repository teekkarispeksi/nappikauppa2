import payment = require('../index');
const config = require('../../../config/config').payment.checkout;
import order = require('../../order');
import ticket = require('../../ticket');

import _ = require('underscore');
import moment = require('moment');
import uuidv4 = require('uuid/v4'); //used for nonce generation
import crypto = require('crypto');
import axios from 'axios';
import express = require('express');

const PROVIDER = 'checkout-v3';

export function create(order: order.IOrder, args: payment.ICreateArgs): Promise<payment.ICreateResponse> {

  var nonce = uuidv4();
  var body = orderToCreateRequestBody(order, args);
  var headers: CheckoutHeaders = {
    'checkout-account': config.user,
    'checkout-algorithm': 'sha256',
    'checkout-method': 'POST',
    'checkout-nonce': nonce,
    'checkout-timestamp': moment().format()
  }

  var signature = sign(headers, body);

  var httpHeaders = {
    'content-type': 'application/json',
    'charset': 'utf-8',
    'signature': signature
  }

  return axios.request({
    baseURL: 'https://api.checkout.fi',
    method: 'post',
    url: '/payments',
    headers: httpHeaders,
    data: body,
    params: headers
  }).then( (resp: any) => {

    //TODO: Verify response signature
    var createResp: payment.ICreateResponse = {
      payment_id: resp.data.transactionId,
      redirect_url: resp.data.href,
      payment_url: resp.data.href,
      payment_provider: PROVIDER
    }
    return createResp;
  });

}
/*
// TODO: implement callback handlers
export function handleSuccessCallback(req: express.Request): Promise<payment.ISuccessResponse> {

  return
}

export function handleErrorCallback(req: express.Request): Promise<payment.IErrorResponse> {

  return
}

export function checkStatus(payment_id: string, payment_url: string): Promise<payment.IStatusResponse> {
  
}
*/
function sign(headers: CheckoutHeaders, body?: CreateRequestBody): string {
  var payloadArray =
    Object.keys(headers)
      .sort()
      .map((key) => [ key, headers[key] ].join(':'))

  var payload: string;
  if(body) payload = payloadArray.concat(JSON.stringify(body)).join("\n");
  else payload = payloadArray.concat('').join("\n");

  var hmac = crypto
    .createHmac('sha256', config.password)
    .update(payload)
    .digest('hex');

    return hmac;
  }

function verify(expectedSignature: string, headers: CheckoutHeaders, body?: CreateRequestBody): boolean {
  var signature = sign(headers, body);
  return signature == expectedSignature
}

function ticketToRequestBodyItem(ticket: ticket.ITicket): RequestBodyItem {
  
  var item: RequestBodyItem = {
    unitPrice: ticket.ticket_price,
    units: 1,
    vatPercentage: 0,
    productCode: ticket.production_title + '-' + ticket.show_title + '-' + ticket.seat_number,
    deliveryDate: moment().format('YYYY-MM-dd')
  }

  return item;
}

function orderToCreateRequestBody(order: order.IOrder, args: payment.ICreateArgs): CreateRequestBody {

  var requestBody: CreateRequestBody = {
    stamp: order.order_id.toString(),
    reference: order.order_hash,
    amount: order.order_price * 100,
    currency: 'EUR',
    language: 'FI',
    customer: {
      email: order.email
    },
    redirectUrls: {
      success: args.successRedirect,
      cancel: args.errorRedirect
    },
    callbackUrls: {
      success: args.successCallback,
      cancel: args.errorCallback
    },
    items: _.map(order.tickets, ticketToRequestBodyItem)
  }

  return requestBody;
}

interface CreateRequestBody {
  stamp: string;
  reference: string;
  amount: number;
  currency: 'EUR';
  language: 'FI' | 'SV' | 'EN';
  items: RequestBodyItem[];
  customer: {
    email: string;
  };
  redirectUrls: {
    success: string;
    cancel: string;
  };
  callbackUrls: {
    success: string;
    cancel: string;
  }
}

interface RequestBodyItem {
  unitPrice: number;
  units: number;
  vatPercentage: number;
  productCode: string;
  deliveryDate: string; // format yyyy-mm-dd
}

interface CheckoutHeaders{
  'checkout-account': number;
  'checkout-algorithm': 'sha256' | 'sha512';
  'checkout-method': 'GET' | 'POST';
  'checkout-nonce': string;
  'checkout-timestamp': string;
  'checkout-transaction_id'?: string;
}