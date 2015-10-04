'use strict';

var Backbone = require('backbone');

var Router = Backbone.Router.extend({
  routes: {
    'orders/:showid': 'orderlist',
    'orders': 'orderlist',
    '*url': 'default'
  }
});

module.exports = new Router();
