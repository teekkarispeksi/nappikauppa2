'use strict';

import express = require('express');
import bodyParser = require('body-parser');
var router = express.Router();

import discountCode = require('./discountCode');
import order = require('./order');
import show = require('./show');
import ticket = require('./ticket');
import venue = require('./venue');
import log = require('./log');

var config = require('../config/config.js');

var jsonParser = bodyParser.json();

var callback = function(res, data) {
  if (data.err) {
    res.status(404);
  }
  res.json(data);
};

type Request = express.Request;
type Response = express.Response;

router.post('/log', jsonParser, function(req: Request, res: Response) {
  if (req.body.meta) {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg, req.body.meta);
  } else {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg);
  }
  res.end();
});

router.get('/discountCode/:code', function(req: Request, res: Response) {
  discountCode.check(req.params.code).then(function(data) { res.json(data); });
});

router.get('/shows/', function(req: Request, res: Response) {
  show.getAll().then(function(data) { res.json(data); });
});

router.get('/shows/:showid', function(req: Request, res: Response) {
  show.get(req.params.showid).then(function(data) { res.json(data); });
});

router.get('/shows/:showid/reservedSeats', function(req: Request, res: Response) {
  show.getReservedSeats(req.params.showid).then(function(data) { res.json(data); }, (err) => {console.error("ERR", err)});
});

router.post('/shows/:showid/reserveSeats', jsonParser, function(req: Request, res: Response) {
  order.reserveSeats(req.params.showid, req.body)
    .then((data) => { res.json(data)})
    .catch((err) => { res.status(409); res.json(err); });
});

router.patch('/orders/:orderid', jsonParser, function(req: Request, res: Response) {
  order.updateContact(req.body.id, req.body).then((data) => callback(res, data)); // TODO wrong
});

router.post('/orders/:orderid/preparePayment', function(req: Request, res: Response) {
  order.preparePayment(req.params.orderid).then(function(data) { res.json(data); });
});

router.get('/orders/:orderid/success', function(req: Request, res: Response) {
  order.paymentDone(req.params.orderid, req.query).then(function(order) {
    res.redirect(config.public_url + '#ok/' + order.order_id + '/' + order.order_hash);
  });
});

router.get('/orders/:orderid/failure', function(req: Request, res: Response) {
  order.paymentCancelled(req.params.orderid, req.query).then(function() { res.redirect(config.public_url + '#fail'); });
});

router.get('/orders/:orderid/:orderhash/tickets', function(req: Request, res: Response) {
  order.get(req.params.orderid).then(function(order: order.IOrder) {
    if (order.order_hash === req.params.orderhash) {
      var pdf = ticket.generatePdf(order.tickets);
      res.type('application/pdf');
      pdf.pipe(res);
    } else {
      res.sendStatus(403);
    }
  });
});

router.get('/venues/:venueid', function(req: Request, res: Response) {
  venue.get(req.params.venueid).then(function(data) { res.json(data); });
});

export = router;
