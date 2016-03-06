'use strict';

import util = require('util');
import express = require('express');
import bodyParser = require('body-parser');
var router = express.Router();

import log = require('./log');
import checker = require('./checker');

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

router.get('/all', function(req: Request, res: Response) {
  checker.getAll().then(ok(res), err(res));
});

router.post('/use', jsonParser, function(req: Request, res: Response) {
  checker.use(req.body).then(ok(res), err(res));
});

export = router;
