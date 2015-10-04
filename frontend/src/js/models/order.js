'use strict';

var Backbone = require('backbone');
var $ = require('jquery');

var Order = Backbone.Model.extend({
  urlRoot: '/api/orders',

  defaults: {
    name: '',
    email: ''
  }
});

module.exports = Order;
