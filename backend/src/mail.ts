'use strict';

var config = require('../config/config.js');
var mailgun = require('mailgun-js');

export var mailer = mailgun({
  apiKey: config.email.mailgun.api_key,
  domain: config.email.mailgun.domain
});

export function sendMail(data, cb) {
  mailer.messages().send(data, cb);
}
