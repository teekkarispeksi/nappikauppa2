'use strict';

var config = require('../../config/config.js');
import log = require('./log');

import _ = require('underscore');

import md5 = require('md5');

export function authenticate(user: string, password: string, requiredGroup: string, cb: Function) {

  log.info('Trying to authenticate', {user: user});

  // Allows silent user check to work
  if (requiredGroup === undefined) {
    if (_.findWhere(config.auth.static_auth.users,
      {name: user, pass: md5(password)}
    )) {
      log.info('Authentication successful');
      return cb(true);
    }
  }

  if (_.findWhere(config.auth.static_auth.users,
    {name: user, pass: md5(password), group: requiredGroup})) {
    log.info('Authencation successful', {user: user});
    return cb(true);
  }

  log.warn('Access denied', {user: user, requiredGroup: requiredGroup});
  return cb(false);
}
