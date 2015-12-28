'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

import discountCode = require('./discountCode');
import order = require('./order');
import show = require('./show');
import ticket = require('./ticket');
import venue = require('./venue');

var jsonParser = bodyParser.json();

router.get('/orders', function(req, res) {
  var responseFunc = function(data) { res.json(data); };
  if (req.query.showid) {
    order.getAllForShow(req.query.showid).then(responseFunc);
  } else {
    order.getAll().then(responseFunc);
  }
});

router.get('/orders/:orderid', function(req, res) {
  order.get(req.params.orderid).then(function(order) { res.json(order); });
});

router.delete('/orders/:orderid', function(req, res) {
  order.remove(req.params.orderid).then(function(data) { res.json(data); });
});

router.patch('/orders/:orderid', jsonParser, function(req, res) {
  order.updateNameOrEmail(req.params.orderid, req.body).then(function(data) { res.json(data); });
});

router.get('/orders/:orderid/tickets', function(req, res) {
  order.get(req.params.orderid).then(function(order) {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

export = router;
