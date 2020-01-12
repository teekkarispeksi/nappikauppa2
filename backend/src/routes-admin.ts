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

router.get('/orders', (req: Request, res: Response) => {
  if (req.query.show_id) {
    order.getAllForShow(parseInt(req.query.show_id)).then(ok(res), err(res));
  } else {
    order.getAll().then(ok(res), err(res));
  }
});

router.get('/orders/:orderid', (req: Request, res: Response) => {
  order.get(parseInt(req.params.orderid)).then(ok(res), err(res));
});

router.post('/orders/:orderid', jsonParser, (req: Request, res: Response) => {
  order.update(parseInt(req.params.orderid), req.body).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets(.pdf)?', (req: Request, res: Response) => {
  order.get(parseInt(req.params.orderid)).then((order) => {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

router.get('/orders/:orderid/tickets/send', (req: Request, res: Response) => {
  order.sendTickets(parseInt(req.params.orderid)).then(() => res.sendStatus(200));
});

router.get('/orders/:orderid/tickets/:ticketid/:tickethash/delete', (req: Request, res: Response) => {
  order.removeTicket(parseInt(req.params.orderid), parseInt(req.params.ticketid), req.params.tickethash).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets/:ticketid/:tickethash/use', (req: Request, res: Response) => {
  order.useTicket(parseInt(req.params.orderid), parseInt(req.params.ticketid), req.params.tickethash).then(ok(res), err(res));
});

router.get('/orders/:orderid/status', (req: Request, res: Response) => {
  order.checkPaymentStatus(Number(req.params.orderid)).then((result) => {
    res.write(result);
    res.end();
  }, err(res));
});

router.get('/orders/:orderid/checkAndUpdateStatus', (req: Request, res: Response) => {
  order.checkAndUpdateStatus(Number(req.params.orderid)).then(ok(res), err(res));
});

router.get('/venues', (req: Request, res: Response) => {
  venue.getAll().then(ok(res), err(res));
});

router.post('/venues/', jsonParser, (req: Request, res: Response) => {
  venue.create(req.body).then(ok(res), err(res));
});

router.post('/venues/:venueid', jsonParser, (req: Request, res: Response) => {
  venue.update(parseInt(req.params.venueid), req.body).then(ok(res), err(res));
});

router.post('/shows', jsonParser, (req: Request, res: Response) => {
  show.create(req.body).then(ok(res), err(res));
});

router.post('/shows/:showid', jsonParser, (req: Request, res: Response) => {
  show.update(parseInt(req.params.showid), req.body).then(ok(res), err(res));
});

router.get('/productions/:productionid', (req: Request, res: Response) => {
  production.get(parseInt(req.params.productionid)).then(ok(res), err(res));
});

router.get('/productions', (req: Request, res: Response) => {
  production.getAll().then(ok(res), err(res));
});

router.post('/productions', jsonParser, (req: Request, res: Response) => {
  production.create(req.body).then(ok(res), err(res));
});

router.post('/productions/:productionid', jsonParser, (req: Request, res: Response) => {
  production.update(parseInt(req.params.productionid), req.body).then(ok(res), err(res));
});

router.get('/discountCodes', (req: Request, res: Response) => {
  discountCode.getAll().then(ok(res), err(res));
});

router.post('/discountCodes', jsonParser, (req: Request, res: Response) => {
  discountCode.createOrUpdate(req.body, false).then(ok(res), err(res));
});

router.post('/discountCodes/send', jsonParser, (req: Request, res: Response) => {
  discountCode.createOrUpdate(req.body, true).then(ok(res), err(res));
});

router.get('/discountGroups', (req: Request, res: Response) => {
  discountGroup.getAll().then(ok(res), err(res));
});

router.post('/discountGroups', jsonParser, (req: Request, res: Response) => {
  discountGroup.update(req.body).then(ok(res), err(res));
});

router.get('/stats', (req: Request, res: Response) => {
  statistics.stats().then(ok(res), err(res));
});

router.get('/stats/:productionid', (req: Request, res: Response) => {
  statistics.raw(parseInt(req.params.productionid)).then(ok(res), err(res));
});

router.get('/kirjaaja', (req: Request, res: Response) => {
  order.kirjaaja().then(ok(res), err(res));
});

export = router;
