'use strict';

var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
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
  ]
});

export = logger;
