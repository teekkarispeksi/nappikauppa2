'use strict';

var Backbone = require('backbone');
var $ = require('jquery');

var Order = Backbone.Model.extend({
  urlRoot: '/api/orders',

  defaults: {
    name: '',
    email: ''
  },

  preparePayment: function(onSuccess, onError) {
    // TODO: untested, I was offline when writing this, and connection is needed for paytrail
    $.post(this.urlRoot + '/' + this.get('id') + '/preparePayment',
      function(res) {
        if (res.err) {
          onError(res);
        } else {
          onSuccess(res);
        }
      });
  }
});

module.exports = Order;
