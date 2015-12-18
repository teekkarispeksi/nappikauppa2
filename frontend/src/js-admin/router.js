'use strict';

var Backbone = require('backbone');

var Router = Backbone.Router.extend({
  routes: {
    'orders/:orderid': 'order',
    'shows/:showid/orders': 'orderlist',
    'orders': 'orderlist',
    '*url': 'default'
  }
});

module.exports = new Router();
