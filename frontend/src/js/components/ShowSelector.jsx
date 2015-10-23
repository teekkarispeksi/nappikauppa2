'use strict';

var React = require('react');

var ShowSelector = React.createClass({

  render: function() {

    return (
      <div className='shopping-stage show-selector'>
        <h2>Näytökset <small>1/5</small></h2>
        <ul className='list-unstyled'>
          {this.props.shows.map(function(show) {
            var date = new Date(show.get('time'));
            var dateStr = date.getDate() + '.' + date.getMonth() + '.';
            return (
              <li key={show.id}>
                <a onClick={this.props.onShowSelect.bind(null, show.id)}>
                  <span className='date'>{dateStr}</span><span className='title'>{show.get('title')}</span>
                </a>
              </li>
            );
          }.bind(this))}
        </ul>
      </div>
    );
  }

});

module.exports = ShowSelector;
