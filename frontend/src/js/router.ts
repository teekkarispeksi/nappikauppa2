'use strict';

import Backbone = require('backbone');

class NkRouter extends Backbone.Router {
  routes: any;

  constructor(options?: any) {
    this.routes = {
      'show/:id': 'show',
      '*url': 'default'
    }
    super(options);
  }
}

export = new NkRouter();
