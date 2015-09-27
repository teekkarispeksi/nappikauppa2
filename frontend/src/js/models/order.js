
var Backbone = require('backbone');
var $ = require('jquery');

var Order = Backbone.Model.extend({
  urlRoot: '/api/orders',

  defaults: {
    name: '',
    email: ''
  },

  preparePayment: function() {
    // TODO: untested, I was offline when writing this, and connection is needed for paytrail
    $.post(this.urlRoot + '/' + this.get('id') + '/preparePayment',
        function(res) {
            window.location.href = res.url;
        });
  }
});

module.exports = Order;
