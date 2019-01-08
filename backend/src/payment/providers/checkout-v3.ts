import payment = require('../index');
const config = require('../../../config/config').payment['checkout-v3'];
import order = require('../../order');
import ticket = require('../../ticket');
import log = require('../../log');

import _ = require('underscore');
import moment = require('moment');
import uuidv4 = require('uuid/v4'); //used for nonce generation
import crypto = require('crypto');
import axios from 'axios';
import express = require('express');

const PROVIDER = 'checkout-v3';
const SIGNATURE_ALGORITHM = 'sha256';

//Our database is using int type euros ,but checkout is using cents as value type so we need to do some conversion
const EUR_TO_CENTS = 100

interface CreateRequestBody {
  stamp: string;
  reference: string;
  amount: number;
  currency: 'EUR';
  language: 'FI' | 'SV' | 'EN';
  items: RequestBodyItem[];
  customer: {
    firstName: string;
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

log.info('Loaded provider: ' + PROVIDER);

export async function create(order: order.IOrder, args: payment.ICreateArgs): Promise<payment.ICreateResponse> {
  const nonce = uuidv4();
  const body = orderToCreateRequestBody(order, args);
  const headers: CheckoutHeaders = {
    'checkout-account': config.user,
    'checkout-algorithm': SIGNATURE_ALGORITHM,
    'checkout-method': 'POST',
    'checkout-nonce': nonce,
    'checkout-timestamp': moment().format()
  };

  const signature = sign(headers, body);

  const httpHeaders = {
    'content-type': 'application/json',
    'charset': 'utf-8',
    'signature': signature
  };

  const verify = (resp: any) => {

    //logging of conf-request-id is recommended in checkouts documentation
    log.info('Checkout conf-request-id for order', {order_id: order.order_id, 'conf-request-id': resp.headers['conf-request-id']})

    //verifying response signature
    if (!verifySignature(resp.headers.signature, resp.headers, resp.data)) {
      throw {name: 'Verification error', message: 'Signature verification failed'};
    }
  }

  try {
    const resp = await axios({
      baseURL: 'https://api.checkout.fi',
      method: 'post',
      url: '/payments',
      headers: httpHeaders,
      data: body,
      params: headers
    });

    verify(resp);

    return {
      payment_id: resp.data.transactionId,
      redirect_url: resp.data.href,
      payment_url: resp.data.href,
      payment_provider: PROVIDER,
    }
  } catch (err) {
    verify(err.response);
    log.error('Create payment failed', {error: err.response.data, order_id: order.order_id});
    throw err.response.data;
  }
}

export async function verifySuccess(req: express.Request): Promise<void> {
  if (! verifySignature(req.query.signature, req.query)) {
    throw {name: 'Verification error', message: 'Signature verification failed'};
  }
}

export async function verifyCancel(req: express.Request): Promise<void> {
  if (! verifySignature(req.query.signature, req.query)) {
    throw {name: 'Verification error', message: 'Signature verification failed'};
  }
}

export async function checkStatus(order_id: number, payment_id: string, payment_url: string): Promise<payment.IStatusResponse> {
  log.warn("Check status is not implemented", {provider: PROVIDER});
  return {
    payment_id,
    payment_url,
    status: 'not-implemented',
  };
}

function sign(headers: {[key: string]: any}, body?: CreateRequestBody): string {
  const payloadArray = Object.keys(headers)
    .filter((value: string) => {
      return /^checkout-/.test(value);
    })
    .sort()
    .map((key) => [ key, headers[key] ].join(':'));

  const payload =  payloadArray.concat(body ? JSON.stringify(body) : '').join("\n");
  const alg = headers['checkout-algorithm'] || SIGNATURE_ALGORITHM;
  return crypto
    .createHmac(alg, config.password)
    .update(payload)
    .digest('hex');
}

function verifySignature(expectedSignature: string, headers: {[key: string]: any}, body?: CreateRequestBody): boolean {
  var signature = sign(headers, body);
  return signature === expectedSignature;
}

function orderToCreateRequestBody(order: order.IOrder, args: payment.ICreateArgs): CreateRequestBody {
  return {
    stamp: payment.getOrderId(order.order_id),
    reference: order.order_hash,
    amount: order.order_price * EUR_TO_CENTS,
    currency: 'EUR',
    language: 'FI',
    customer: {
      firstName: order.name,
      email: order.email,
    },
    redirectUrls: {
      success: args.successRedirect,
      cancel: args.errorRedirect
    },
    callbackUrls: {
      success: args.successCallback,
      cancel: args.errorCallback
    },
    items: [{
      unitPrice: order.order_price * EUR_TO_CENTS,
      units: 1,
      vatPercentage: 0,
      productCode: payment.getOrderId(order.order_id),
      deliveryDate: moment().format('YYYY-MM-DD'),
    }],
  }
}
