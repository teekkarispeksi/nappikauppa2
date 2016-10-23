'use strict';

import Backbone = require('backbone');

class NkRouter extends Backbone.Router {
  routes = {
      'show/:id': 'show',
      '*url': 'default'
    };

  constructor(options?: any) {
    super(options);
    (<any>this)._bindRoutes();
  }
}

export = new NkRouter();
