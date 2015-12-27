'use strict';

import Backbone = require('backbone');

export default class TicketModel extends Backbone.Model {
  urlRoot = 'api/tickets';
}
