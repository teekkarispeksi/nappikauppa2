import payment = require('../index');
import order = require('../../order');
import log = require('../../log');
import { to, reject, resolve } from '../../util';

import uuidv4 = require('uuid/v4'); //used for nonce generation
import express = require('express');

const PROVIDER = 'null-provider';

log.info('Loaded provider: ' + PROVIDER);
log.warn('USING NULL PROVIDER TO HANDLE PAYMENTS, ALL ORDERS ARE AUTOPAID OR REJECTED AND ON MEMORY CACHED');

const cache: {[key: string]: Payment} = {}

let lastCreated;

let id_counter = 1

interface Payment {
  order_id: number;
  payment_id: string;
  status: 'paid' | 'cancelled' | 'payment-pendig' | 'expired' | 'not-implemented';
}

export async function create(order: order.IOrder, args: payment.ICreateArgs): Promise<payment.ICreateResponse> {
log.warn('USING NULL PROVIDER TO HANDLE PAYMENTS, ALL ORDERS ARE AUTOPAID AND ON MEMORY CACHED');

  let id: any = id_counter;
  id = id.toString();
  id_counter = id_counter + 1;

  lastCreated = id;

  cache[id] = {
    order_id: order.order_id,
    payment_id: id,
    status: "payment-pendig",
  };
  
  const createResp: payment.ICreateResponse = {
    payment_id: id,
    payment_url: 'http://localhost:3000/null',
    payment_provider: PROVIDER,
  };

  log.info('ORDER ID: ' + order.order_id);

  return resolve(createResp);

}


export function handleSuccessCallback(req: express.Request): Promise<payment.ISuccessResponse> {
  log.warn('USING NULL PROVIDER TO HANDLE PAYMENTS, ALL ORDERS ARE AUTOPAID OR REJECTED AND ON MEMORY CACHED');

  const p = cache[lastCreated];

  cache[lastCreated].status = "paid";

  return resolve({
    payment_id: p.payment_id,
    payment_provider: PROVIDER,
  });
}

export function handleCancelCallback(req: express.Request): Promise<payment.ICancelResponse> {
  log.warn('USING NULL PROVIDER TO HANDLE PAYMENTS, ALL ORDERS ARE PAID OR REJECTED AND ON MEMORY CACHED');

  const payment_id = req.query.id;
  const p = cache[lastCreated];

  cache[lastCreated].status = "cancelled";

  return resolve({
    payment_id: p.payment_id,
    payment_provider: PROVIDER,
  });
}


export function checkStatus(payment_id: string, payment_url: string): Promise<payment.IStatusResponse> {
  log.warn('USING NULL PROVIDER TO HANDLE PAYMENTS, ALL ORDERS ARE AUTOPAID OR REJECTED AND ON MEMORY CACHED');
  const p = cache[payment_id];

  return resolve({
    payment_id,
    payment_url,
    status: p.status,
  });
}