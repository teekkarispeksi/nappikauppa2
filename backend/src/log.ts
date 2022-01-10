'use strict';

import winston = require('winston');
import DailyRotateFile = require('winston-daily-rotate-file');
// require('winston-mailgun').MailGun; // exposes winston.transports.MailGun

var config = require('../../config/config.js');

var transports = [
  new winston.transports.Console(),
  new DailyRotateFile({
    filename: 'log/nk2.log'
  }),
  new DailyRotateFile({
    filename: 'log/nk2-error.log',
    level: 'error',
    //handleExceptions: true,
  })
];

// if (config.email.errors_to) {
//   transports.push(new (winston.transports.MailGun)({
//     level: 'error',
//     to: config.email.errors_to,
//     from: config.email.errors_from,
//     apiKey: config.email.mailgun.api_key,
//     domain: config.email.mailgun.domain
//   }));
// }

var logger = winston.createLogger({level: 'info', transports: transports});

export = logger;
