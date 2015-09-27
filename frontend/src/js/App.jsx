'use strict';

var React = require('react');
var Backbone = require('backbone');

var Header = require('./components/Header.jsx');
var Store = require('./components/Store.jsx');

var Router = require('./router.js');

React.render(<Header />, document.getElementsByTagName('header')[0]);

Router.on('route:default', function(url) {
  React.render(<Store action={url} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:show', function(showid) {
  React.render(<Store showid={showid} />, document.getElementsByTagName('main')[0]);
});

Backbone.history.start();
