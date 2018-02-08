'use strict';

var config = require('../../config/config.js');
import log = require('./log');

import request = require('request');
import _ = require('underscore');

import md5 = require('md5');

export function isAdmin(user: string) {
  return typeof(user) !== 'undefined';
}

export function authenticate(user: string, password: string, requiredGroup: string, cb: Function) {
  _.findWhere(config.static_auth.users,
   {name: user, pass: md5(password), group: requiredGroup})
  ? cb(true) : cb(false);
}
