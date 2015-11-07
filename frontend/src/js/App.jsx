'use strict';

var Logger = require('./logger.js');

window.onerror = function(errorMsg, url, line, col, error) {
  Logger.error(errorMsg, {url: url, lineNumber: line, colNumber: col, error: error});
  return true;
};

var React = require('react');
var Backbone = require('backbone');

var Header = require('./components/Header.jsx');
var Store = require('./components/Store.jsx');

var Router = require('./router.js');

React.render(<Header />, document.getElementsByTagName('header')[0]);

Router.on('route:default', function(url) {
  var store;
  if (url) {
    var urlparts = url.split('/');
    store = <Store action={urlparts[0]} args={urlparts.slice(1)} />;
  } else {
    store = <Store />;
  }
  React.render(store, document.getElementsByTagName('main')[0]);
});

Router.on('route:show', function(showid) {
  React.render(<Store showid={showid} />, document.getElementsByTagName('main')[0]);
});

Backbone.history.start();
