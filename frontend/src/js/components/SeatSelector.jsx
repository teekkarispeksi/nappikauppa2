'use strict';

var React = require('react');

var Seat = require('./Seat.jsx');

var SeatSelector = React.createClass({

  render: function() {
    if (!this.props.show || !this.props.seats) {
      return (
        <div className='shopping-stage seat-selector'></div>
      );
    }

    var divClass = 'shopping-stage seat-selector';
    if (!this.props.active) {
      divClass += ' disabled';
    }

    return (
      <div className={divClass}>
        <h2>Paikkojen valinta <small>2/5</small></h2>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/venue_1.png)'}}>
          {this.props.seats.map(function(seat) {
            return <Seat seat={seat} status={seat.status} key={seat.id} onClick={this.props.active ? this.props.onSeatClicked.bind(null, seat) : null} />;
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
