'use strict';

var Backbone = require('backbone');

var Ticket = require('../models/ticket.js');

var Tickets = Backbone.Collection.extend({
  model: Ticket,
  url: '/api/tickets'
});

module.exports = Tickets;
