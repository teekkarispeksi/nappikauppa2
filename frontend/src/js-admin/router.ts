'use strict';

import Backbone = require('backbone');

class NkAdminRouter extends Backbone.Router {
  routes: any;
  
  constructor(options?: any) {
    this.routes = {
      'orders/:orderid': 'order',
      'shows/:showid/orders': 'orderlist',
      'orders': 'orderlist',
      '*url': 'default'
    }
    super();
  }
}

export = new NkAdminRouter();
