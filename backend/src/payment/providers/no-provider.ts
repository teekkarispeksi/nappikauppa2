import payment = require('../index');
import order = require('../../order');
import express = require('express');

import { sha256 } from '../../utils';


const PROVIDER = 'no-provider';

export async function create(order: order.IOrder, args: payment.ICreateArgs): Promise<payment.ICreateResponse> {

  const timestamp = Date.now();
  const order_name = payment.orderIdToName(order.order_id)
  const signature = sha256([order_name, timestamp, PROVIDER].join('|')); //simple signature
  return {
    payment_id: 'no-provider',
    redirect_url: args.successRedirect + '?order=' + order_name + '&timestamp=' + timestamp + '&signature=' + signature,
    payment_url: 'no-provider',
    payment_provider: PROVIDER,
  }
}

export async function verifySuccess(req: express.Request): Promise<void> {
  if(req.query.signature !== sha256([req.query.order,req.query.timestamp, PROVIDER].join('|'))) {
    throw {name: 'Verification error', message: 'Signature verification failed'};
  }
}

export async function verifyCancel(req: express.Request): Promise<void> {
  throw {name: 'Not Implemented', message: 'Cancel verification is not implemented'}
}

export async function checkStatus(order_id: number, payment_id: string, payment_url: string): Promise<payment.IStatusResponse> {
  return {
    payment_id,
    payment_url,
    status: 'paid',
  };
}
