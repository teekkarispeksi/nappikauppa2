'use strict';

import Logger = require('./logger');

window.onerror = function(errorMsg, url, line, col, error) {
  Logger.error(errorMsg, {url: url, lineNumber: line, colNumber: col, error: error});
  return true;
};

declare var config: {analytics: {google: string}};

import React = require('react');
import ReactDOM = require('react-dom');
import Backbone = require('backbone');
import $ = require('jquery');
import GA = require('react-ga');

import Header from './components/Header';
import Store from './components/Store';

import Router = require('./router');

ReactDOM.render(<Header />, $('header')[0]);

Router.on('route:default', function(url: string) {
  var store;
  if (url) {
    var urlparts: string[] = url.split('/');
    store = <Store action={urlparts[0]} args={urlparts.slice(1)} />;
  } else {
    store = <Store />;
  }
  ReactDOM.render(store, document.getElementsByTagName('main')[0]);
});

Router.on('route:show', function(showid) {
  ReactDOM.render(<Store showid={parseInt(showid)} />, document.getElementsByTagName('main')[0]);
});

GA.initialize(config.analytics.google);
GA.pageview('/' + window.location.hash);
Backbone.history.start();
