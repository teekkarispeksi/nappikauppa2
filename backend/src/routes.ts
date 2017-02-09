'use strict';

import util = require('util');
import express = require('express');
import {RequestHandler} from 'express';
import bodyParser = require('body-parser');
import atob = require('atob');
var router = express.Router();

import auth = require('./confluenceAuth');
import discountCode = require('./discountCode');
import order = require('./order');
import production = require('./production');
import show = require('./show');
import ticket = require('./ticket');
import venue = require('./venue');
import log = require('./log');

var config = require('../config/config.js');

var jsonParser = bodyParser.json();

const COOKIE_NAME = 'nappikauppa2';
const COOKIE_HASH_LENGTH = 8;
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

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

interface IRequestWithUser extends Request {
  user: string;
}

var checkUserSilently: RequestHandler = (req: IRequestWithUser, res: Response, next: any) => {
  var authHeader = req.header('Authorization');
  if (!authHeader) {
    next();
  } else {
    var creds = atob(authHeader.split(' ')[1]).split(':');
    auth.authenticate(creds[0], creds[1], config.confluence_auth.groups.base, (authOk: boolean) => {
      if (authOk) {
        req.user = creds[0];
      }
      next();
    });
  }
};

router.get('/auth', checkUserSilently, function(req: IRequestWithUser, res: Response) {
  res.send(req.user);
});

router.post('/log', jsonParser, function(req: Request, res: Response) {
  if (req.body.meta) {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg, req.body.meta);
  } else {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg);
  }
  res.end();
});

router.get('/discountCode/:productionid/:code', checkUserSilently, function(req: IRequestWithUser, res: Response) {
  discountCode.check(req.params.code, req.params.productionid, req.user).then(ok(res), err(res));
});

router.get('/productions/latest', function(req: Request, res: Response) {
  production.getLatestActive().then(ok(res), err(res));
});

router.get('/shows/', checkUserSilently, function(req: IRequestWithUser, res: Response) {
  show.getAll(req.user, req.query.production_id).then(ok(res), err(res));
});

router.get('/shows/:showid', checkUserSilently, function(req: IRequestWithUser, res: Response) {
  show.get(parseInt(req.params.showid), req.user).then(ok(res), err(res));
});

router.get('/shows/:showid/reservedSeats', function(req: Request, res: Response) {
  show.getReservedSeats(parseInt(req.params.showid)).then(ok(res), err(res));
});

router.post('/shows/:showid/reserveSeats', jsonParser, checkUserSilently, function(req: IRequestWithUser, res: Response) {
  order.reserveSeats(parseInt(req.params.showid), req.body, req.user)
    .then((data) => {
      res.cookie(COOKIE_NAME, {id: data.order_id, hash: data.order_hash.substr(0, COOKIE_HASH_LENGTH)}, {maxAge: COOKIE_MAX_AGE});
      res.json(data);
    })
    .catch((error) => { res.status(409); res.json(error); });
});

router.get('/orders/continue', (req, res) => {
  console.log(req.cookies);
  var cookie = req.cookies[COOKIE_NAME];
  if (!cookie || !cookie.id || !cookie.hash) {
    res.sendStatus(204);
    return;
  }
  order.get(cookie.id).then((order) => {
    if (order.order_hash && order.order_hash.substr(0, COOKIE_HASH_LENGTH) === cookie.hash && (order.status === 'seats-reserved' || order.status === 'payment-pending')) {
      res.json(order);
    } else {
      throw '';
    }
  }).catch((error) => {
    console.log(error);
    res.clearCookie(COOKIE_NAME);
    res.sendStatus(204);
  });
});

router.post('/orders/:orderid', jsonParser, checkUserSilently, function(req: IRequestWithUser, res: Response) {
  order.updateContact(parseInt(req.params.orderid), req.body, req.user).then(ok(res), err(res));
});

router.post('/orders/:orderid/preparePayment', function(req: Request, res: Response) {
  order.preparePayment(parseInt(req.params.orderid)).then(ok(res), err(res));
});

router.get('/orders/:orderid/success', function(req: Request, res: Response) {
  order.paymentDone(parseInt(req.params.orderid), req.query).then(function(order) {
    res.redirect(config.public_url + '#ok/' + order.order_id + '/' + order.order_hash);
  });
});

router.get('/orders/:orderid/notification', function(req: Request, res: Response) {
  order.paymentDone(parseInt(req.params.orderid), req.query).then(function(order) {
    res.sendStatus(200);
  });
});

router.get('/orders/:orderid/failure', function(req: Request, res: Response) {
  order.paymentCancelled(parseInt(req.params.orderid), req.query).then(function() { res.redirect(config.public_url + '#fail'); });
});

router.get('/orders/:orderid/:orderhash/tickets(.pdf)?', function(req: Request, res: Response) {
  order.get(parseInt(req.params.orderid)).then(function(order: order.IOrder) {
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
