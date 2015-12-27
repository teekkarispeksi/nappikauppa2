'use strict';

var config = require('../config/config.js');
import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export function check(code: string): Promise<any> {
  return db.query('select (dc.use_max - count(*)) > 0 as valid from nk2_orders o \
    join nk2_discount_codes dc on dc.code = o.discount_code \
    where o.discount_code = :discount_code',
  {discount_code: code})
  .then((rows) => {
    var ok = (/* is admin || */ rows[0].valid) === 1;
    log.info('Pre-order validation, discount code "' + code + '" is ' + (ok ? 'valid' : 'invalid'));
    if(!ok) throw 'Discount code validation failed';
    return {ok: true};
  });
}
