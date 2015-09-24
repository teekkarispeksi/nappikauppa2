
var Backbone = require('backbone');

var Ticket = Backbone.Model.extend({
  urlRoot : '/api/tickets',

  defaults : {
  }
});

module.exports = Ticket;
