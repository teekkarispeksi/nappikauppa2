'use strict';

var nodemailer = require('nodemailer');
var config = require('../config/config.js');

// TODO: for now gmail, because it's easiest to test with. Something real soon.
var transporter = nodemailer.createTransport(config.email);
module.exports = transporter;
