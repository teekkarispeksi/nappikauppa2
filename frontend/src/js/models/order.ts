'use strict';

import Backbone = require('backbone');
import $ = require('jquery');

export default class Order extends Backbone.Model {
  urlRoot = 'api/orders';

  defaults() {
    return {
      name: '',
      email: ''
    }
  };
}
