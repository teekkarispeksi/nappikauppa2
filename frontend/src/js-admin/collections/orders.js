'use strict';

var Backbone = require('backbone');

var Order = require('../models/order.js');

var Orders = Backbone.Collection.extend({
  model: Order,
  url: '/admin-api/orders'
});

module.exports = Orders;
