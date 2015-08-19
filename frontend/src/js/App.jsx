var React = require('react');
var Backbone = require('backbone');

var Component = require('./components/Component.jsx');
var Router = require('./router.js');



Router.on('route:default', function(url) {
  React.render(<Component />, document.getElementById('main'));
});

Router.on('route:show', function(showid) {
  React.render(<Component showid={showid} />, document.getElementById('main'));
});

Backbone.history.start();
