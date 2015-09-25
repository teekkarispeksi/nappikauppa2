'use strict';

var React = require('react');

var ShowSelector = React.createClass({

  render: function() {
    return (
      <div className='shopping-stage show-selector'>
        <ul>
          {this.props.shows.map(function(show) {
            return <li key={show.id}><a onClick={this.props.onShowSelect.bind(null, show.id)}>{show.get('title')}</a><br /></li>;
          }.bind(this))}
        </ul>
      </div>
    );
  }

});

module.exports = ShowSelector;
