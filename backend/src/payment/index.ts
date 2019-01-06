import order = require('../order');
import express = require('express');

/*
 * Module implements abstract payment provider
 * 
 * Usage:
 *
 *   //Importing payment module
 *   import payment = require('./payment');
 *
 *   //create new checkout-v3 payment provider
 *   const checkout = payment('checkout-v3');
 *   
 *   //create new payment from order
 *   const resp = checkout.create(order, args);
 * 
 * Provider implementations can be found from folder ./providers
 */

export interface ICreateArgs {
  successCallback: string;
  errorCallback: string;
  successRedirect: string;
  errorRedirect: string;
}

export interface ICreateResponse {
  payment_id: string;
  redirect_url?: string;
  payment_url: string;
  payment_provider: string;
  payload?: any;
}

export interface ISuccessResponse {
  payment_id: string;
  payment_provider: string;
}

export interface ICancelResponse {
  payment_id: string;
  payment_provider: string;
}

export interface IStatusResponse {
  payment_id: string;
  payment_url: string;
  status: 'paid' | 'cancelled' | 'payment-pendig' | 'expired';
}

// Common payment provider interface
export interface IPayment {
  create: (order: order.IOrder, args: ICreateArgs) => Promise<ICreateResponse>;
  handleSuccessCallback: (req: express.Request) => Promise<ISuccessResponse>;
  handleErrorCallback: (req: express.Request) => Promise<IErrorResponse>;
  checkStatus:  (payment_id: string, payment_url: string) => Promise<IStatusResponse>;
}

//Wrapper class for creating different payment providers
class Payment {

  private provider: IPayment;

  constructor(provider: string) {
    this.provider = require('./providers/' + provider);
  }

  create(order: order.IOrder, args: ICreateArgs): Promise<ICreateResponse> {
    return this.provider.create(order, args);
  }

  handleSuccessCallback(req: express.Request): Promise<ISuccessResponse> {
    return this.provider.handleSuccessCallback(req);
  }

  handleCancelCallback(req: express.Request): Promise<ICancelResponse> {
    return this.provider.handleCancelCallback(req);
  }

  checkStatus(payment_id: string, payment_url: string): Promise<IStatusResponse> {
    return this.provider.checkStatus(payment_id, payment_url);
  }
}

// factory for creating payment providers
export default function(provider: string): Payment {
  return new Payment(provider);
}