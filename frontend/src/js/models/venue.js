
var Backbone = require('backbone');

var Venue = Backbone.Model.extend({
  urlRoot: '/api/venues',

  defaults: {
    id: null, // 1
  }
});

module.exports = Venue;
