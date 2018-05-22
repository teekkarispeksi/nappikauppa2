'use strict';

var winston = require('winston');
require('winston-mailgun').MailGun; // exposes winston.transports.MailGun

var config = require('../../config/config.js');

var transports = [
  new (winston.transports.Console)({
    name: 'console'
  }),
  new (winston.transports.DailyRotateFile)({
    name: 'file',
    filename: 'log/nk2.log'
  }),
  new (winston.transports.DailyRotateFile)({
    name: 'file-error',
    filename: 'log/nk2-error.log',
    level: 'error',
    handleExceptions: true,
    humanReadableUnhandledException: true
  })
];

if (config.email.errors_to) {
  transports.push(new (winston.transports.MailGun)({
    level: 'error',
    to: config.email.errors_to,
    from: config.email.errors_from,
    apiKey: config.email.mailgun.api_key,
    domain: config.email.mailgun.domain
  }));
}

var logger = new (winston.Logger)({transports: transports});

export = logger;
