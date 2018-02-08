'use strict';

var config = require('../config/config.js');

// Hacky way to select authenthication method:
var auth = require('./' + config.auth_method + 'Auth');

export function isAdmin(user: string) {
  return auth.isAdmin(user);
}

export function authenticate(user: string, password: string, requiredGroup: string, cb: Function) {
  return auth.authenticate(user, password, requiredGroup, cb);
}
