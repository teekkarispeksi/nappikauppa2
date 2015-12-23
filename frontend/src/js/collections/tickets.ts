'use strict';

import Backbone = require('backbone');
import Ticket from '../models/ticket';

export default class Tickets extends Backbone.Collection<Ticket> {
  model = Ticket;
  url = 'api/tickets';
}
