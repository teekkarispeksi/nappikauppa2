'use strict';

var React = require('react');
var ProgressBar = require('react-bootstrap/lib/ProgressBar');

var ShowSelector = React.createClass({

  render: function() {

    return (
      <div className='shopping-stage show-selector'>
        <h2>Näytökset <small>1/5</small></h2>
        <ul className='list-unstyled'>
          {this.props.shows.map(function(show) {
            var date = new Date(show.get('time'));
            var dateStr = date.getDate() + '.' + date.getMonth() + '.';
            var selectedClass = (this.props.selectedShow && this.props.selectedShow.id === show.id) ? 'selected' : '';
            return (
              <li key={show.id}>
                <a onClick={this.props.onShowSelect.bind(null, show.id)} className={selectedClass}>
                  <span className='date'>{dateStr}</span><span className='title'>{show.get('title')}</span>
                  <ProgressBar bsSize='small' min={0} max={1000} now={Math.floor(Math.random() * 1000)} />
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
