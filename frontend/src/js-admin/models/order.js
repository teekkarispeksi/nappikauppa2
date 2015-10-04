'use strict';

var Backbone = require('backbone');
var $ = require('jquery');

var Order = Backbone.Model.extend({
  urlRoot: '/admin-api/orders'
});

module.exports = Order;
