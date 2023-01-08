'use strict';

import formData = require('form-data');
import Mailgun from 'mailgun.js';

const config = require('../../config/config.js');
const MG_DOMAIN = config.email.mailgun.domain

// Inject form data to mailgun and create singleton
const mailgun = new Mailgun(formData);

// Create mailgun client instance
export const mailer = mailgun.client({
  username: 'api',
  key: config.email.mailgun.api_key,
});


export function sendMail(message): Promise<any> {
  return mailer.messages.create(MG_DOMAIN, message);
}
