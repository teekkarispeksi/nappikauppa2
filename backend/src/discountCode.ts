'use strict';

import db = require('./db');
import log = require('./log');
import mail = require('./mail');
import auth = require('./auth');
var config = require('../config/config.js');

export interface IDiscountCode {
  code: string;
  eur: number;
  production_id: number;
  use_max: number;
  used?: number;
  email: string;
  code_group: string;
  email_subject?: string;
  email_text?: string;
}

export function check(code: string, production_id: number, user: string): Promise<any> {
  return db.query('select (:is_admin or ((dc.use_max - count(*)) > 0)) as valid from nk2_orders o \
    join nk2_discount_codes dc on dc.code = o.discount_code and dc.production_id = :production_id \
    where o.discount_code = :discount_code',
  {discount_code: code, production_id: production_id, is_admin: auth.isAdmin(user)})
  .then((rows) => {
    var ok = (rows[0].valid) === 1;
    log.info('Pre-order validation, discount code "' + code + '" is ' + (ok ? 'valid' : 'invalid') + ' for user ' + user + ' and production ' + production_id);
    return {ok: ok};
  });
}

export function getAll(): Promise<IDiscountCode[]> {
  return db.query('select code, eur, production_id, use_max, if(o.used is null, 0, o.used) as used, email, code_group from nk2_discount_codes dc \
   left join \
   (select count(id) as used, discount_code from nk2_orders group by discount_code) as o \
   on o.discount_code = dc.code');
}

export function createOrUpdate(codes: IDiscountCode[], send: boolean): Promise<IDiscountCode[]> {
  log.info('ADMIN: creating or updating ' + codes.length + ' discount codes');
  var query_start = 'insert into nk2_discount_codes (code, eur, production_id, use_max, email, code_group) values ';
  var insert_values = codes.map((code) => db.format('(:code, :eur, :production_id, :use_max, :email, :code_group)', code));
  var query_end = ' on duplicate key update eur = values(eur), use_max = values(use_max), email = values(email), code_group = values(code_group)';
  return db.query(query_start + insert_values.join(',') + query_end)
  .then((res) => {
    log.info('ADMIN: discount codes created or updated');
    if (send) {
      codes.forEach((code) => {
        mail.sendMail({
          from: config.email.from,
          to: code.email,
          subject: code.email_subject,
          text: code.email_text.replace('$CODE$', code.code).replace('$EUR$', code.eur.toString()).replace('$URL$', config.public_url)
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
