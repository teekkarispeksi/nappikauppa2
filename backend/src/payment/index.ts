import order = require('../order');
import ticket = require('../ticket');
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

 const PAYMENT_PREFIX = 'NAPPIKAUPPA2_';

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

export interface IStatusResponse {
  payment_id: string;
  payment_url: string;
  status: 'paid' | 'cancelled' | 'payment-pending' | 'expired' | 'not-implemented';
}

// Common payment provider interface
export interface IPayment {
  create: (order: order.IOrder, args: ICreateArgs) => Promise<ICreateResponse>;
  verifySuccess: (req: express.Request) => Promise<void>;
  verifyCancel: (req: express.Request) => Promise<void>;
  checkStatus:  (order_id: number, payment_id: string, payment_url: string) => Promise<IStatusResponse>;
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

  verifySuccess(req: express.Request): Promise<void> {
    return this.provider.verifySuccess(req);
  }

  verifyCancel(req: express.Request): Promise<void> {
    return this.provider.verifyCancel(req);
  }

  checkStatus(order_id: number, payment_id: string, payment_url: string): Promise<IStatusResponse> {
    return this.provider.checkStatus(order_id, payment_id, payment_url);
  }
}

// factory for creating payment providers
export default function(provider: string): Payment {
  return new Payment(provider);
}

//helper functions for payment provider implementations
export function getOrderId(order_id: number): string {
  return PAYMENT_PREFIX + order_id;
}

export function getTicketTitle(ticket: ticket.ITicket): string {
  return 'Pääsylippu: ' + ticket.production_performer + ' / ' + ticket.production_title + ' / ' + ticket.show_title;
}