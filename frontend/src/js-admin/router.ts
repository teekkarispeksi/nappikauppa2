'use strict';

import Backbone = require('backbone');

class NkAdminRouter extends Backbone.Router {
  routes = {
      'orders/:orderid': 'order',
      'shows(/)(:showid)': 'shows',
      'shows/:showid/orders': 'orderlist',
      'orders': 'orderlist',
      'venues(/)(:venueid)': 'venues',
      'productions(/)(:productionid)': 'productions',
      'discountCodes(/)': 'discountCodes',
      'discountGroups(/)': 'discountGroups',
      '*url': 'default'
    };

  constructor(options?: any) {
    super();
    (<any>this)._bindRoutes();
  }
}

export = new NkAdminRouter();
