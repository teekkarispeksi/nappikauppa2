'use strict';

var Backbone = require('backbone');
var _ = require('underscore');

var Ticket = Backbone.Model.extend({
  urlRoot: 'api/tickets',
  whitelist: ['seat_id', 'discount_group_id'],
  toJSON: function(options) {
    return _.pick(this.attributes, this.whitelist);
  },
  defaults: {
  }
});

module.exports = Ticket;
