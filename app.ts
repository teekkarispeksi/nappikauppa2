'use strict';

import {Response} from 'express';
import {Request} from 'express';

import util = require('util');
var express = require('express');
var cookies = require('cookie-parser');
var path = require('path');
var morgan = require('morgan');

import basicAuth from 'express-basic-auth';

var config = require('./config/config.js');
var api = require('./backend/build/routes');
var adminApi = require('./backend/build/routes-admin');
var checkerApi = require('./backend/build/routes-checker');

var log = require('./backend/build/log');

var auth = require('./backend/build/auth');

function adminAuth (username, password, cb) {
  auth.authenticate(username, password, config.auth.groups.admin, cb);
}

function checkerAuth(username, password, cb) {
  auth.authenticate(username, password, config.auth.groups.checker, cb);
}


var app = express();
app.enable('trust proxy'); // so that our mod_rewrites doesn't mess up the req.ip address

app.use(morgan('combined', {stream: {
  write: function(message) { log.info('HTTP: ' + message); }
}}));

app.use(cookies());

app.use('/public/config/', express.static(path.join(__dirname, '/config/public')));
app.use('/public/', express.static(path.join(__dirname, '/frontend/build/public')));
app.get(['/', '/index.html'], function(req, res: any) {
  res.sendFile(__dirname + '/frontend/build/index.html');
});
app.get('/favicon.ico', function(req, res: Response) {
  res.send('');
});


app.all('/admin*', basicAuth({
  authorizer: adminAuth,
  authorizeAsync: true,
  challenge: true,
  realm: 'Nappikauppa 2'
}));
app.all('/checker*', basicAuth({
  authorizer: checkerAuth,
  authorizeAsync: true,
  challenge: true,
  realm: 'Nappikauppa 2 - Tarkistin'}));

app.use('/checker/', express.static(path.join(__dirname, '/checker')));
app.use('/checker-api', checkerApi);

app.get('/admin/', function(req, res: Response) {
  res.sendFile(__dirname + '/frontend/build/admin.html');
});

app.use('/api', api);
app.use('/admin-api', adminApi);

app.use(function(req: Request, res, next) {
  res.sendStatus(404);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err: any, req: any, res: any, next) {
  log.error('Unhandled error:',  util.inspect(err, {showHidden: true, depth: null}));
  res.sendStatus(err.status || 500);
});

app.listen(config.port);


export = app;
