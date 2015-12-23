'use strict';

import Backbone = require('backbone');

export default class Show extends Backbone.Model {
  urlRoot = 'api/shows';

  defaults() {
    return {
      id: null, // 1
      title: null, // 'Enskari'
      date: null, // '2015-03-01 19:00'
      status: null, // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
      location: null, // 'Aleksanterin teatteri, Helsinki'
    }
  }
}
