var React = require('react');

var Show = require('../models/show.js');
var Shows = require('../collections/shows.js');

var Router = require('../router.js');

var Component = React.createClass({
  shows: new Shows(),

  componentWillMount: function () {
    this.shows.fetch({
      success: function(collection, response, options) {
        this.forceUpdate();
      }.bind(this)
    });
  },

  onClick: function (showid) {
    Router.navigate('show/'+showid, {trigger: true});
  },

  render: function () {
    return (
      <div>
        {this.shows.map(function(show) {
          return <a onClick={this.onClick.bind(this, show.id)}>{show.get('title')}</a>;
        }.bind(this))}
      </div>
    );
  }

});

module.exports = Component;
