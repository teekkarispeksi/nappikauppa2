'use strict';

import Backbone = require('backbone');

export default class Venue extends Backbone.Model {
  urlRoot = 'api/venues';

  defaults() {
    return {
      id: null, // 1
    }
  }
}
