'use strict';

var _ = require('underscore');
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

    // different price groups among seats in this show; prices[0] is the most expensive one
    var getBasePrice = function(seat) {
      return seat.prices[0].price;
    };
    var prices = _.uniq(this.props.seats.map(getBasePrice)).sort().reverse();

    return (
      <div className={divClass}>
        <h2>Paikkojen valinta <small>2/5</small></h2>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/venue_1.png)'}}>
          {this.props.seats.map(function(seat) {
            var priceGroup = prices.indexOf(getBasePrice(seat));
            return <Seat seat={seat} priceGroup={priceGroup} status={seat.status} key={seat.id} onClick={this.props.active ? this.props.onSeatClicked.bind(null, seat) : null} />;
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
