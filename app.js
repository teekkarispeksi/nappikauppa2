'use strict';

var express = require('express');
var path = require('path');
var logger = require('morgan');

var api = require('./backend/routes');
var adminApi = require('./backend/routes-admin');

var app = express();

app.use(logger('dev'));

app.use(require('connect-livereload')());

app.use('/public/', express.static(path.join(__dirname, '/frontend/build/public')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/frontend/build/index.html');
});
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

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

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
