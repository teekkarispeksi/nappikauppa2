'use strict';

var React = require('react');
var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');

var Shows = require('../collections/shows.js');

var Home = React.createClass({
  shows: new Shows(),

  componentWillMount: function() {
    this.shows.fetch({
      success: function(collection, response, options) {
        this.forceUpdate();
      }.bind(this)
    });
  },

  render: function() {

    return (
      <div>
        <ul>
          {this.shows.map(function(show) {
            return <li key={show.id}><a href={'#orders/' + show.get('id')}>{show.get('title')}</a></li>;
          }.bind(this))}
        </ul>
      </div>
    );
  }

});

module.exports = Home;
