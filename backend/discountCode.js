'use strict';

var config = require('../config/config.js');
var db = require('./db.js');
var log = require('./log.js');
var _ = require('underscore');

var discountCode = {

  check: function(code, cb) {
    db.query('select (dc.use_max - count(*)) > 0 as valid from nk2_orders o \
      join nk2_discount_codes dc on dc.code = o.discount_code \
      where o.discount_code = :discount_code',
    {discount_code: code},
    function(err, rows) {
      var ok = (/* is admin || */ rows[0].valid) === 1;
      log.info('Pre-order validation, discount code "' + code + '" is ' + (ok ? 'valid' : 'invalid'));
      cb({ok: ok});
    });
  }

};
module.exports = discountCode;
