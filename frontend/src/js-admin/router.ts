'use strict';

import Backbone = require('backbone');

class NkAdminRouter extends Backbone.Router {
  routes: any;

  constructor(options?: any) {
    this.routes = {
      'orders/:orderid': 'order',
      'shows(/)(:showid)': 'shows',
      'shows/:showid/orders': 'orderlist',
      'orders': 'orderlist',
      'venues(/)(:venueid)': 'venues',
      '*url': 'default'
    };
    super();
  }
}

export = new NkAdminRouter();
