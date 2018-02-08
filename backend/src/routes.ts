'use strict';

import util = require('util');
import express = require('express');
import {RequestHandler} from 'express';
import bodyParser = require('body-parser');
import atob = require('atob');
import md5 = require('md5');
var router = express.Router();

import auth = require('./auth');
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
const COOKIE_MAX_AGE = config.expire_minutes * 60 * 1000;

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

router.get('/auth', checkUserSilently, (req: IRequestWithUser, res: Response) => {
  res.send(req.user);
});

router.post('/log', jsonParser, (req: Request, res: Response) => {
  if (req.body.meta) {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg, req.body.meta);
  } else {
    log.log(req.body.level, 'FRONTEND: ' + req.body.msg);
  }
  res.end();
});

router.get('/discountCode/:productionid/:code', checkUserSilently, (req: IRequestWithUser, res: Response) => {
  discountCode.check(req.params.code, req.params.productionid, req.user).then(ok(res), err(res));
});

router.get('/productions/latest', (req: Request, res: Response) => {
  production.getLatestActive().then(ok(res), err(res));
});

router.get('/shows/', checkUserSilently, (req: IRequestWithUser, res: Response) => {
  show.getAll(req.user, req.query.production_id).then(ok(res), err(res));
});

router.get('/shows/:showid', checkUserSilently, (req: IRequestWithUser, res: Response) => {
  show.get(parseInt(req.params.showid), req.user).then(ok(res), err(res));
});

router.get('/shows/:showid/reservedSeats', (req: Request, res: Response) => {
  show.getReservedSeats(parseInt(req.params.showid)).then(ok(res), err(res));
});

router.post('/shows/:showid/reserveSeats', jsonParser, checkUserSilently, (req: IRequestWithUser, res: Response) => {
  order.reserveSeats(parseInt(req.params.showid), req.body, req.user)
    .then((data) => {
      res.cookie(COOKIE_NAME, {id: data.order_id, hash: md5(data.order_hash)}, {maxAge: COOKIE_MAX_AGE});
      res.json(data);
    })
    .catch((error) => { res.status(409); res.json(error); });
});

router.get('/orders/continue', (req, res) => {
  var cookie = req.cookies[COOKIE_NAME];
  if (!cookie || !cookie.id || !cookie.hash) {
    res.clearCookie(COOKIE_NAME);
    res.sendStatus(204);
    return;
  }
  order.get(cookie.id).then((order) => {
    if (order.order_hash && md5(order.order_hash) === cookie.hash && (order.status === 'seats-reserved')) {
      log.info('Order succesfully loaded with cookie', {order_id: order.order_id});
      res.json(order);
    } else {
      res.clearCookie(COOKIE_NAME);
      res.sendStatus(204);
    }
  }).catch((error) => {
    res.clearCookie(COOKIE_NAME);
    res.sendStatus(204);
  });
});

router.post('/orders/:orderid', jsonParser, checkUserSilently, (req: IRequestWithUser, res: Response) => {
  order.updateContact(parseInt(req.params.orderid), req.body, req.user).then(ok(res), err(res));
});

router.post('/orders/:orderid/:orderhash/cancel', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  order.cancel(parseInt(req.params.orderid), req.params.orderhash).then(ok(res), err(res));
});

router.post('/orders/:orderid/preparePayment', (req: Request, res: Response) => {
  order.preparePayment(parseInt(req.params.orderid)).then(ok(res), err(res));
});

router.get('/orders/:orderid/success', (req: Request, res: Response) => {
  order.paymentDone(parseInt(req.params.orderid), req.query).then( (order) => {
    res.redirect(config.public_url + '#ok/' + order.order_id + '/' + order.order_hash);
  });
});

router.get('/orders/:orderid/notification', (req: Request, res: Response) => {
  order.paymentDone(parseInt(req.params.orderid), req.query).then(function(order) {
    res.sendStatus(200);
  });
});

router.get('/orders/:orderid/failure', (req: Request, res: Response) => {
  order.paymentCancelled(parseInt(req.params.orderid), req.query).then( () => { res.redirect(config.public_url + '#fail'); });
});

router.get('/orders/:orderid/:orderhash/tickets(.pdf)?', (req: Request, res: Response) => {
  order.get(parseInt(req.params.orderid)).then( (order: order.IOrder) => {
    if (order.order_hash === req.params.orderhash) {
      var pdf = ticket.generatePdf(order.tickets);
      res.type('application/pdf');
      pdf.pipe(res);
    } else {
      res.sendStatus(403);
    }
  });
});

router.get('/venues/:venueid', (req: Request, res: Response) => {
  venue.get(req.params.venueid).then(ok(res), err(res));
});

export = router;
