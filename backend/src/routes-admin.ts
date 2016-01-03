'use strict';

import express = require('express');
import bodyParser = require('body-parser');
var router = express.Router();

import order = require('./order');
import ticket = require('./ticket');
import log = require('./log');

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
  order.updateNameOrEmail(req.params.orderid, req.body).then(ok(res), err(res));
});

router.get('/orders/:orderid/tickets', function(req: Request, res: Response) {
  order.get(req.params.orderid).then(function(order) {
    var pdf = ticket.generatePdf(order.tickets);
    res.type('application/pdf');
    pdf.pipe(res);
  });
});

export = router;
