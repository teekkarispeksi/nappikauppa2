'use strict';

import Backbone = require('backbone');
import Show from '../models/show';

export default class Shows extends Backbone.Collection<Show> {
  model = Show;
  url = 'api/shows';
}
