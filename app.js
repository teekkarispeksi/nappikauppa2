'use strict';

var express = require('express');
var path = require('path');
var morgan = require('morgan');
var auth = require('http-auth');
var compression = require('compression')

var config = require('./config/config.js');
var confluenceAuth = require('./backend/confluenceAuth.js');
var api = require('./backend/routes');
var adminApi = require('./backend/routes-admin');

var log = require('./backend/log.js');

var basicAuth = auth.basic({
    realm: 'Nappikauppa v2 - use your speksi-intra account',
  }, function(username, password, cb) {
    confluenceAuth.auth(username, password, config.confluence_auth.groups.base, cb);
  }
);

var app = express();

app.use(morgan('combined', {stream: {
  write: function(message) { log.info('HTTP: ' + message); }
}}));

app.use(compression());
app.use('/public/', express.static(path.join(__dirname, '/frontend/build/public')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/frontend/build/index.html');
});

app.all('/admin*', auth.connect(basicAuth));
app.get('/admin/', function(req, res) {
  res.sendFile(__dirname + '/frontend/build/admin.html');
});

app.use('/api', api);
app.use('/admin-api', adminApi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
