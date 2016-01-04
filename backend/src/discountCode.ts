'use strict';

import db = require('./db');
import log = require('./log');

import auth = require('./confluenceAuth');

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
