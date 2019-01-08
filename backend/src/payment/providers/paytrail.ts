import {ICreateArgs, ICreateResponse, IStatusResponse } from '../index';
const config = require('../../../config/config').payment['paytrail'];
import order = require('../../order');
import ticket = require('../../ticket');
import log = require('../../log');
import { Request } from 'express';

import axios from 'axios';
import md5 = require('md5');

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

  const data = {
    orderNumber: order.order_id,
    currency: "EUR",
    locale: "fi_FI",
    urlSet: {
      success: args.successRedirect,
      failure: args.errorRedirect,
      notification: args.successCallback,
    },
    price: order.order_price + '.00',
  }

  try {
    const resp = await CLIENT({
      url: '/create',
      method: 'post',
      data,
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