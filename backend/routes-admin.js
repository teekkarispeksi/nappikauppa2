'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var discountCode = require('./discountCode.js');
var order = require('./order.js');
var show = require('./show.js');
var ticket = require('./ticket.js');
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

router.get('/orders/:orderid/tickets', function(req, res) {
  order.get(req.params.orderid, function(order) {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

module.exports = router;
