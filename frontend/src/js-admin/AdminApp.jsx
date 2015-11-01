'use strict';

var React = require('react');
var Backbone = require('backbone');

var Header = require('./components/Header.jsx');
var Home = require('./components/Home.jsx');
var OrderList = require('./components/OrderList.jsx');
var Order = require('./components/Order.jsx');

var Router = require('./router.js');

React.render(<Header />, document.getElementsByTagName('header')[0]);

Router.on('route:default', function(url) {
  React.render(<Home action={url} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:orderlist', function(showid) {
  React.render(<OrderList showid={showid} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:order', function(orderid) {
  React.render(<Order orderid={orderid} />, document.getElementsByTagName('main')[0]);
});

Backbone.history.start();
