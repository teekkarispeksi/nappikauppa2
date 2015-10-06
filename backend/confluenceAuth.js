'use strict';

var config = require('../config/config.js');
var request = require('request');
var _ = require('underscore');

// In-memory userCache to reduce number of queries.
// Invalidation means that we'll query user again from confluence, not that the user is logged out.
var userCache = {};
var CACHE_INVALIDATE_MSEC = 5 * 60 * 1000;

var confluenceAuth = {
  auth: function(user, password, requiredGroup, cb) {
    if (userCache[user] && userCache[user].password === password) {
      var now = new Date();
      if (now - userCache[user].inserted > CACHE_INVALIDATE_MSEC) {
        delete userCache[user];
      } else {
        console.log('Found',user,'from cache');
        return cb(true);
      }
    }

    request({
      uri: config.confluence_auth.url,
      method: 'POST',
      json: true,
      body: {user: user, password: password}
    }, function(err, response, body) {
      var groups = body;

      if (err) {
        return cb(false);
      }

      if (!_.contains(groups, requiredGroup)) {
        return cb(false);
      }

      console.log('Authed as', user);
      userCache[user] = {
        password: password, // a bit insecure, but it's only in memory and for a few minutes
        inserted: new Date()
      };
      return cb(true);
    });
  }
};

module.exports = confluenceAuth;
