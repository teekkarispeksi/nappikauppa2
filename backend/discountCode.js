'use strict';

var config = require('../config/config.js');
var db = require('./db.js');
var _ = require('underscore');

var discountCode = {

  check: function(code, cb) {
    db.query('select * from nk2_discount_codes \
      where code = :code and used < use_max',
    {code: code},
    function(err, res) {
      var ok = (res.length === 1);
      cb({ok: ok});
    });
  }

};
module.exports = discountCode;

