var React = require('react');

var Show = require('../models/show.js');
var Shows = require('../collections/shows.js');

var Component = React.createClass({
  shows: new Shows(),

  componentWillMount: function () {
    this.shows.fetch({
      success: function(collection, response, options) {
        this.forceUpdate();
      }.bind(this)
    });
  },

  render: function () {
    return (
      <div>
        {this.shows.map(function(show) {
          return <a>{show.get('title')}</a>;
        })}
      </div>
    );
  }

});

module.exports = Component;
