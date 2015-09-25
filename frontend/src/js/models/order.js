
var Backbone = require('backbone');

var Order = Backbone.Model.extend({
  urlRoot : '/api/orders',

  defaults : {
    name: '',
    email: ''
  }
});

module.exports = Order;
