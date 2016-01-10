'use strict';

import express = require('express');
import bodyParser = require('body-parser');
var router = express.Router();

import order = require('./order');
import show = require('./show');
import venue = require('./venue');
import ticket = require('./ticket');
import log = require('./log');
import production = require('./production');

var jsonParser = bodyParser.json();

type Request = express.Request;
type Response = express.Response;

var ok = (res) => {
  return (data) => {
    res.json(data);
  };
};

var err = (res, errStatus = 500) => {
  return (data) => {
    log.error('Caught error', {data});
    res.status(errStatus);
    res.json(data); // TODO don't expose these to end-users
  };
};

router.get('/orders', function(req: Request, res: Response) {
  if (req.query.show_id) {
    order.getAllForShow(req.query.show_id).then(ok(res), err(res));
  } else {
    order.getAll().then(ok(res), err(res));
  }
});

router.get('/orders/:orderid', function(req: Request, res: Response) {
  order.get(req.params.orderid).then(ok(res), err(res));
});

router.post('/orders/:orderid', jsonParser, function(req: Request, res: Response) {
  order.update(req.params.orderid, req.body).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets', function(req: Request, res: Response) {
  order.get(req.params.orderid).then(function(order) {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

router.get('/venues', function(req: Request, res: Response) {
  venue.getAll().then(ok(res), err(res));
});

router.post('/venues/:venueid', jsonParser, function(req: Request, res: Response) {
  venue.update(parseInt(req.params.venueid), req.body).then(ok(res), err(res));
});

router.post('/shows', jsonParser, function(req: Request, res: Response) {
  show.create(req.body).then(ok(res), err(res));
});

router.post('/shows/:showid', jsonParser, function(req: Request, res: Response) {
  show.update(parseInt(req.params.showid), req.body).then(ok(res), err(res));
});

router.get('/productions/:productionid', function(req: Request, res: Response) {
  production.get(parseInt(req.params.productionid)).then(ok(res), err(res));
});

router.get('/productions', function(req: Request, res: Response) {
  production.getAll().then(ok(res), err(res));
});

router.post('/productions', jsonParser, function(req: Request, res: Response) {
  production.create(req.body).then(ok(res), err(res));
});

router.post('/productions/:productionid', jsonParser, function(req: Request, res: Response) {
  production.update(parseInt(req.params.productionid), req.body).then(ok(res), err(res));
});

export = router;
