'use strict';

import React = require('react');
import ReactDOM = require('react-dom');
import Backbone = require('backbone');

import Home from './components/Home.tsx';
import OrderList from './components/OrderList.tsx';
import Order from './components/Order.tsx';
import Show from './components/Show.tsx';

import Router = require('./router.ts');

ReactDOM.render(<h1>Nappikauppa 2 - admin</h1>, document.getElementsByTagName('header')[0]);

Router.on('route:default', function(url) {
  ReactDOM.render(<Home action={url} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:shows', function(show_id) {
  ReactDOM.render(<Show show_id={show_id} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:orderlist', function(show_id) {
  ReactDOM.render(<OrderList show_id={show_id} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:order', function(order_id) {
  ReactDOM.render(<Order order_id={order_id} />, document.getElementsByTagName('main')[0]);
});

Backbone.history.start();
