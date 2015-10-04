'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var discountCode = require('./discountCode.js');
var order = require('./order.js');
var show = require('./show.js');
var venue = require('./venue.js');

var jsonParser = bodyParser.json();

router.get('/orders', function(req, res) {
  var responseFunc = function(data) { res.json(data); };
  if (req.query.showid) {
    order.getAllForShow(req.query.showid, responseFunc);
  } else {
    order.getAll(responseFunc);
  }
});

module.exports = router;
