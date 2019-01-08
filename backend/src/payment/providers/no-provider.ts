import payment = require('../index');
import order = require('../../order');
import log = require('../../log');
import express = require('express');
import btoa = require('btoa');

const PROVIDER = 'no-provider';

export async function create(order: order.IOrder, args: payment.ICreateArgs): Promise<payment.ICreateResponse> {
  return {
    payment_id: 'no-provider',
    redirect_url: '#ok/' + order.order_id + '/' + order.order_hash + '/' + btoa('' + order.order_price),
    payment_url: 'no-provider',
    payment_provider: PROVIDER,
  }
}

export async function verifySuccess(req: express.Request): Promise<void> {
  throw {name: 'Not Implemented', message: 'Success verification is not implemented'}
}

export async function verifyCancel(req: express.Request): Promise<void> {
  throw {name: 'Not Implemented', message: 'Cancel verification is not implemented'}
}

export async function checkStatus(payment_id: string, payment_url: string): Promise<payment.IStatusResponse> {
  return {
    payment_id,
    payment_url,
    status: 'paid',
  };
}