'use strict';

import util = require('util');
import express = require('express');
import bodyParser = require('body-parser');
var router = express.Router();

import order = require('./order');
import show = require('./show');
import venue = require('./venue');
import ticket = require('./ticket');
import log = require('./log');
import production = require('./production');
import discountCode = require('./discountCode');
import discountGroup = require('./discountGroup');
import statistics = require('./statistics');

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
    log.error('Caught error', util.inspect(data, {showHidden: true, depth: null}));
    res.sendStatus(errStatus);
  };
};

router.get('/orders', function(req: Request, res: Response) {
  if (req.query.show_id) {
    order.getAllForShow(parseInt(req.query.show_id)).then(ok(res), err(res));
  } else {
    order.getAll().then(ok(res), err(res));
  }
});

router.get('/orders/:orderid', function(req: Request, res: Response) {
  order.get(parseInt(req.params.orderid)).then(ok(res), err(res));
});

router.post('/orders/:orderid', jsonParser, function(req: Request, res: Response) {
  order.update(parseInt(req.params.orderid), req.body).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets(.pdf)?', function(req: Request, res: Response) {
  order.get(parseInt(req.params.orderid)).then(function(order) {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

router.get('/orders/:orderid/tickets/send', function(req: Request, res: Response) {
  order.sendTickets(parseInt(req.params.orderid)).then(() => res.sendStatus(200));
});

router.get('/orders/:orderid/tickets/:ticketid/:tickethash/delete', function(req: Request, res: Response) {
  order.removeTicket(parseInt(req.params.orderid), parseInt(req.params.ticketid), req.params.tickethash).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets/:ticketid/:tickethash/use', function(req: Request, res: Response) {
  order.useTicket(parseInt(req.params.orderid), parseInt(req.params.ticketid), req.params.tickethash).then(ok(res), err(res));
});

router.get('/orders/:orderid/status', function(req: Request, res: Response) {
  order.checkPaytrailStatus(req.params.orderid).then((result) => {
    res.write(result);
    res.end();
  }, err(res));
});

router.get('/orders/:orderid/checkAndUpdateStatus', function(req: Request, res: Response) {
  order.checkAndUpdateStatus(req.params.orderid).then(ok(res), err(res));
});

router.get('/venues', function(req: Request, res: Response) {
  venue.getAll().then(ok(res), err(res));
});

router.post('/venues/', jsonParser, function(req: Request, res: Response) {
  venue.create(req.body).then(ok(res), err(res));
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

router.get('/discountCodes', function(req: Request, res: Response) {
  discountCode.getAll().then(ok(res), err(res));
});

router.post('/discountCodes', jsonParser, function(req: Request, res: Response) {
  discountCode.createOrUpdate(req.body, false).then(ok(res), err(res));
});

router.post('/discountCodes/send', jsonParser, function(req: Request, res: Response) {
  discountCode.createOrUpdate(req.body, true).then(ok(res), err(res));
});

router.get('/discountGroups', function(req: Request, res: Response) {
  discountGroup.getAll().then(ok(res), err(res));
});

router.post('/discountGroups', jsonParser, function(req: Request, res: Response) {
  discountGroup.update(req.body).then(ok(res), err(res));
});

router.get('/stats', function(req: Request, res: Response) {
  statistics.stats().then(ok(res), err(res));
});

router.get('/stats/:productionid', function(req: Request, res: Response) {
  statistics.raw(parseInt(req.params.productionid)).then(ok(res), err(res));
});

router.get('/kirjaaja', function(req: Request, res: Response) {
  order.kirjaaja().then(ok(res), err(res));
});

export = router;
