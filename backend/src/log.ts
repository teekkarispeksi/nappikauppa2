'use strict';

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import { mailer } from './mail';

interface MailgunTransportOpts extends winston.transport.TransportStreamOptions {
  targetEmail: string;
  fromEmail: string;
  domain: string;
}


/**
 * Simple transport to send log messages via email
 * use to
 */
class MailgunTransport extends Transport {

  private targetEmail: string;
  private fromEmail: string;
  private domain: string;

  constructor(opts: MailgunTransportOpts) {
    super(opts);

    this.targetEmail = opts.targetEmail;
    this.domain = opts.domain;
    this.fromEmail = opts.fromEmail;
  }

  log(info, cb) {
    mailer.messages.create(this.domain, {
      from: this.fromEmail,
      to: this.targetEmail,
      subject: 'NK2 - Error',
      text: `Error: \n\n ${JSON.stringify(info)} \n\n from nappikauppa2`,
    })
    .then(() => cb())
    .catch(() => cb());
  }
}

var config = require('../../config/config.js');

var transports: winston.transport[] = [
  new winston.transports.Console(),
  new DailyRotateFile({
    filename: 'log/nk2.log'
  }),
  new DailyRotateFile({
    filename: 'log/nk2-error.log',
    level: 'error',
    handleExceptions: true,
  })
];

if (config.email.errors_to) {
  transports.push(new MailgunTransport({
    level: 'error',
    targetEmail: config.email.errors_to,
    fromEmail: config.email.errors_from,
    domain: config.email.mailgun.domain
  }));
}

var logger = winston.createLogger({level: 'info', transports: transports});

export = logger;
