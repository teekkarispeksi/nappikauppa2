'use strict';

var $ = require('jquery');

var LOGGER_API_URL = 'api/log';

var Logger = function(options) {
  var url = options.url;

  this.log = function(level, msg, meta) {
    $.ajax({
      url: url,
      data: JSON.stringify({level: level, msg: msg, meta: meta}),
      dataType: 'json',
      method: 'POST',
      contentType: 'application/json'
    });
  };

  this.info = function(msg, meta) {
    this.log('info', msg, meta);
  };

  this.error = function(msg, meta) {
    this.log('error', msg, meta);
  };
};

module.exports = new Logger({url: LOGGER_API_URL});
