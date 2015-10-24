'use strict';

var config = require('../config/config.js');
var log = require('./log.js');
var mysql = require('mysql');

var db = mysql.createConnection(config.db);

db.on('error', function(err) {
  log.error('Database query failed without callbacks', {error: err});
});

// prevent connection time-out
setInterval(function() {
  db.query('SELECT 1');
}, 5000);

// Use :param style binding instead of question marks
db.config.queryFormat = function(query, values) {
  if (!values) {
    return query;
  }

  return query.replace(/\:(\w+)/g, function(txt, key) {
    if (values.hasOwnProperty(key)) {
      return this.escape(values[key]);
    }
    return txt;
  }.bind(this));
};

module.exports = db;
