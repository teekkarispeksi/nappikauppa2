'use strict';

import db = require('./db');
import log = require('./log');
import mail = require('./mail');
import auth = require('./confluenceAuth');
var config = require('../config/config.js');

export interface IDiscountCode {
  code: string;
  eur: number;
  use_max: number;
  used?: number;
  email: string;
  code_group: string;
  email_subject?: string;
  email_text?: string;
}

export function check(code: string, user: string): Promise<any> {
  return db.query('select (:is_admin or ((dc.use_max - count(*)) > 0)) as valid from nk2_orders o \
    join nk2_discount_codes dc on dc.code = o.discount_code \
    where o.discount_code = :discount_code',
  {discount_code: code, is_admin: auth.isAdmin(user)})
  .then((rows) => {
    var ok = (rows[0].valid) === 1;
    log.info('Pre-order validation, discount code "' + code + '" is ' + (ok ? 'valid' : 'invalid') + ' for user ' + user);
    if (!ok) {
      throw 'Discount code validation failed';
    }
    return {ok: true};
  });
}

export function getAll(): Promise<IDiscountCode[]> {
  return db.query('select code, eur, use_max, if(o.id is null, 0, count(*)) as used, dc.email, code_group from nk2_discount_codes dc \
    left join nk2_orders o on o.discount_code = dc.code \
    group by code');
}

export function create(codes: IDiscountCode[], send: boolean): Promise<IDiscountCode[]> {
  log.info('ADMIN: creating ' + codes.length + ' discount codes');
  var query_start = 'insert into nk2_discount_codes (code, eur, use_max, email, code_group) values ';
  var insert_values = codes.map((code) => db.format('(:code, :eur, :use_max, :email, :code_group)', code));
  return db.query(query_start + insert_values)
  .then((res) => {
    log.info('ADMIN: discount codes created');
    if (send) {
      codes.forEach((code) => {
        mail.sendMail({
          from: config.email.from,
          to: code.email,
          subject: code.email_subject,
          text: code.email_text.replace('$CODE$', code.code)
        }, (error, info) => {
          if (error) {
            log.error('ADMIN: Sending code failed', {error: error, code: code});
          }
        });
      });
      log.info('ADMIN: Codes sent');
    }
    return getAll();
  });
}
