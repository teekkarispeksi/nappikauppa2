'use strict';

var config = require('../config/config.js');

// Hacky way to select authenthication method:
var auth = require('./' + config.auth.method + 'Auth');

export function isAdmin(user: string) {
  return typeof(user) !== 'undefined';
}

export function authenticate(user: string, password: string, requiredGroup: string, cb: Function) {
  return auth.authenticate(user, password, requiredGroup, cb);
}
