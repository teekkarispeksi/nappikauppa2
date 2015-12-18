'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var discountCode = require('./discountCode.js');
var order = require('./order.js');
var show = require('./show.js');
var ticket = require('./ticket.js');
var venue = require('./venue.js');

var log = require('./log.js');

var config = require('../config/config.js');

var jsonParser = bodyParser.json();

var callback = function(res, data) {
  if (data.err) {
    res.status(404);
  }
  res.json(data);
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/log', jsonParser, function(req, res) {
  if (req.body.meta) {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg, req.body.meta);
  } else {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg);
  }
  res.end();
});

router.get('/discountCode/:code', function(req, res) {
  discountCode.check(req.params.code, function(data) { res.json(data); });
});

router.get('/shows/', function(req, res) {
  show.getAll(function(data) { res.json(data); });
});

router.get('/shows/:showid', function(req, res) {
  show.get(req.params.showid, function(data) { res.json(data); });
});

router.get('/shows/:showid/reservedSeats', function(req, res) {
  show.getReservedSeats(req.params.showid, function(data) { res.json(data); });
});

router.post('/shows/:showid/reserveSeats', jsonParser, function(req, res) {
  order.reserveSeats(req.params.showid, req.body, function(data) {
    if (data.error) {
      res.status(409);
    }
    res.json(data);
  });
});

router.patch('/orders/:orderid', jsonParser, function(req, res) {
  order.updateContact(req.body.id, req.body, callback.bind(null,res));
});

router.post('/orders/:orderid/preparePayment', function(req, res) {
  order.preparePayment(req.params.orderid, function(data) { res.json(data); });
});

router.get('/orders/:orderid/success', function(req, res) {
  order.paymentDone(req.params.orderid, req.query, function(order) {
    res.redirect(config.public_url + '#ok/' + order.order_id + '/' + order.order_hash);
  });
});

router.get('/orders/:orderid/failure', function(req, res) {
  order.paymentCancelled(req.params.orderid, req.query, function() { res.redirect(config.public_url + '#fail'); });
});

router.get('/orders/:orderid/:orderhash/tickets', function(req, res) {
  order.get(req.params.orderid, function(order) {
    if (order.order_hash === req.params.orderhash) {
      var pdf = ticket.generatePdf(order.tickets);
      res.type('application/pdf');
      pdf.pipe(res);
    } else {
      res.sendStatus(403);
    }
  });
});

router.get('/venues/:venueid', function(req, res) {
  venue.get(req.params.venueid, function(data) { res.json(data); });
});

module.exports = router;
