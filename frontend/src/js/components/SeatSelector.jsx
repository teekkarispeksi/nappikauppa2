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

    return (
      <div className='shopping-stage seat-selector'>
        <h4>Valitse tästä paikkasi näytökseen <strong>{this.props.show.get('title')}</strong>!</h4>
        <div style={{position: 'relative'}}>
          <img src='public/img/venues/venue_1.png' />
          {this.props.seats.map(function(seat) {
            return <Seat seat={seat} status={seat.status} key={seat.id} onClick={this.props.active ? this.props.onSeatClicked.bind(null, seat) : null} />;
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
