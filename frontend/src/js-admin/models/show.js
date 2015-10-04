'use strict';

var Backbone = require('backbone');

var Show = Backbone.Model.extend({
  urlRoot: '/api/shows'
});

module.exports = Show;
