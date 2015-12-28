'use strict';

var config = require('../../config/config.js');
import log = require('./log');

import request = require('request');
import _ = require('underscore');

// In-memory userCache to reduce number of queries.
// Invalidation means that we'll query user again from confluence, not that the user is logged out.
var userCache = {};
var CACHE_INVALIDATE_MSEC = 5 * 60 * 1000;

export default class ConfluenceAuth {
  auth(user: string, password: string, requiredGroup: string, cb: Function) {
    if (userCache[user] && userCache[user].password === password) {
      var now = new Date();
      if (now.getTime() - userCache[user].inserted.getTime() > CACHE_INVALIDATE_MSEC) {
        delete userCache[user];
      } else {
        return cb(true);
      }
    }

    log.info('Trying to authenticate', {user: user});
    request({
      uri: config.confluence_auth.url,
      method: 'POST',
      json: true,
      body: {user: user, password: password}
    }, function(err, response, body) {
      var groups = body;

      if (err) {
        log.error('Got error from auth server', {error: err, user: user});
        return cb(false);
      }

      if (!_.contains(groups, requiredGroup)) {
        log.error('Access denied', {user: user, hasGroups: groups, requiredGroup: requiredGroup});
        return cb(false);
      }

      userCache[user] = {
        password: password, // a bit insecure, but it's only in memory and for a few minutes
        inserted: new Date()
      };
      log.info('Authencation successful', {user: user});
      return cb(true);
    });
  }
}
