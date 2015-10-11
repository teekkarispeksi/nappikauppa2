'use strict';

var Backbone = require('backbone');

var Show = require('../models/show.js');

var Shows = Backbone.Collection.extend({
  model: Show,
  url: 'api/shows'
});

module.exports = Shows;
