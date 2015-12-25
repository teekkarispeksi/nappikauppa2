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

type Request = express.Request;
type Response = express.Response;

var ok = (res) => {
  return (data) => {
    res.json(data);
  }
}

var err = (res, errStatus=500) => {
  return (data) => {
    log.error("Caught error", {data});
    res.status(errStatus);
    res.json(data); // TODO don't expose these to end-users
  }
}

router.post('/log', jsonParser, function(req: Request, res: Response) {
  if (req.body.meta) {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg, req.body.meta);
  } else {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg);
  }
  res.end();
});

router.get('/discountCode/:code', function(req: Request, res: Response) {
  discountCode.check(req.params.code).then(ok(res), err(res));
});

router.get('/shows/', function(req: Request, res: Response) {
  show.getAll().then(ok(res), err(res));
});

router.get('/shows/:showid', function(req: Request, res: Response) {
  show.get(req.params.showid).then(ok(res), err(res));
});

router.get('/shows/:showid/reservedSeats', function(req: Request, res: Response) {
  show.getReservedSeats(req.params.showid).then(ok(res), err(res));
});

router.post('/shows/:showid/reserveSeats', jsonParser, function(req: Request, res: Response) {
  order.reserveSeats(req.params.showid, req.body)
    .then(ok(res))
    .catch((err) => { res.status(409); res.json(err); });
});

router.patch('/orders/:orderid', jsonParser, function(req: Request, res: Response) {
  order.updateContact(req.body.id, req.body).then(ok(res), err(res));
});

router.post('/orders/:orderid/preparePayment', function(req: Request, res: Response) {
  order.preparePayment(req.params.orderid).then(ok(res), err(res));
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
  venue.get(req.params.venueid).then(ok(res), err(res));
});

export = router;
