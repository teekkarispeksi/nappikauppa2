var config = require('../../config/config');

import order = require('../order');
import express = require('express');


export interface ICreateArgs {
  successCallback: string;
  errorCallback: string;
  successRedirect: string;
  errorRedirect: string;
}

export interface ICreateResponse {
  payment_id: string;
  redirect_url: string;
}

export interface ISuccessResponse {
  payment_id: string;
}

export interface IErrorResponse {
  payment_id: string;
}

// Common payment provider interface
export interface IPayment {
  create: (order: order.IOrder, args: ICreateArgs) => Promise<ICreateResponse>;
  handleSuccessCallback: (req: express.Request) => Promise<ISuccessResponse>;
  handleErrorCallback: (req: express.Request) => Promise<IErrorResponse>;
}

var provider = config.payment.provider
var payment: IPayment = require('./providers/' + provider)

export function create(order: order.IOrder, args: ICreateArgs): Promise<ICreateResponse> {
  return payment.create(order, args);
}

export function handleSuccessCallback(req: express.Request): Promise<ISuccessResponse> {
  return payment.handleSuccessCallback(req);
}

export function handleErrorCallback(req: express.Request): Promise<IErrorResponse> {
  return payment.handleErrorCallback(req);
}