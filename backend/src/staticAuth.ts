'use strict';

import log = require('./log');
import _ = require('underscore');
import md5 = require('md5');

var config = require('../../config/config.js');

interface IStaticAuthUser {
  name: string;
  pass: string;
  groups: string[];
}

export function authenticate(user: string, password: string, requiredGroup: string, cb: Function) {

  log.info('Trying to authenticate', {user: user});

  var userObject = _.findWhere<IStaticAuthUser, Object>(
    config.auth.static.users,
    { name: user, pass: md5(password) }
  );

  if (userObject &&
    (requiredGroup === undefined || _.contains(userObject.groups, requiredGroup))
  ) {
     log.info('Authencation successful', {user: user});
     return cb(true);
  }

  log.warn('Access denied', {user: user, requiredGroup: requiredGroup});
  return cb(false);
}
