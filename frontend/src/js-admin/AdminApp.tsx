'use strict';

import React = require('react');
import ReactDOM = require('react-dom');
import Backbone = require('backbone');

import Home from './components/Home.tsx';
import OrderList from './components/OrderList.tsx';
import Order from './components/Order.tsx';
import Show from './components/Show.tsx';
import Venue from './components/Venue.tsx';
import Production from './components/Production.tsx';
import DiscountCodes from './components/DiscountCodes.tsx';

import Router = require('./router.ts');

ReactDOM.render(<div><h1>Nappikauppa 2 - admin</h1><a href=''>Admin-etusivulle</a> - <a href='../'>Lippukauppaan</a></div>, document.getElementsByTagName('header')[0]);

Router.on('route:default', function(url) {
  ReactDOM.render(<Home action={url} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:shows', function(show_id) {
  ReactDOM.render(<Show show_id={parseInt(show_id)} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:orderlist', function(show_id) {
  ReactDOM.render(<OrderList show_id={parseInt(show_id)} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:order', function(order_id) {
  ReactDOM.render(<Order order_id={parseInt(order_id)} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:venues', function(venue_id) {
  ReactDOM.render(<Venue venue_id={parseInt(venue_id)} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:productions', function(production_id) {
  ReactDOM.render(<Production production_id={parseInt(production_id)} />, document.getElementsByTagName('main')[0]);
});

Router.on('route:discountCodes', function() {
  ReactDOM.render(<DiscountCodes />, document.getElementsByTagName('main')[0]);
})

Backbone.history.start();
