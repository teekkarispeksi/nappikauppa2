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
            var dateStr = date.getDate() + '.' + (date.getMonth() + 1) + '.'; // JS getMonth is zero-indexed. Go figure.
            var selectedClass = (this.props.selectedShow && this.props.selectedShow.id === show.id) ? 'selected' : '';
            var progressBar;
            if (show.get('reserved_percentage') < 100) {
              progressBar = (<ProgressBar bsSize='small' min={0} max={100} now={show.get('reserved_percentage')} />);
            } else {
              progressBar = (<div className='sold-out'>Loppuunmyyty</div>);
            }

            return (
              <li key={show.id}>
                <a onClick={this.props.onShowSelect.bind(null, show.id)} className={selectedClass}>
                  <span className='date'>{dateStr}</span><span className='title'>{show.get('title')}</span>
                  {progressBar}
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
