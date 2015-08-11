
var Backbone = require('backbone');

var Show = Backbone.Model.extend({
  urlRoot : '/api/shows',

  defaults : {
    id: null, // 1
    title : null, // 'Enskari'
    date: null, // '2015-03-01 19:00'
    status: null, // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
    location: null, // 'Aleksanterin teatteri, Helsinki'
  }
});

module.exports = Show;
