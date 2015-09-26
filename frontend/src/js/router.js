var Backbone = require('backbone');

var Router = Backbone.Router.extend({
  routes: {
    'show/:id': 'show',
    '*url': 'default'
  }
});

module.exports = new Router();
