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
    var getBasePrice = function(section) {
      return section.discount_groups[0].price;
    };
    var prices = _.uniq(_.values(this.props.show.get('sections')).map(getBasePrice)).sort().reverse();

    return (
      <div className={divClass}>
        <h2>Paikkojen valinta <small>2/5</small></h2>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/venue_1.png)'}}>
          {_.values(this.props.venue.get('sections')).map(function(section) {
            var priceGroup = prices.indexOf(getBasePrice(this.props.show.get('sections')[section.id]));
            var price = _.pluck(section.discount_groups, 'price');
            return (
              <div key={section.id}>
              {_.values(section.seats).map(function(seat) {
                return <Seat key={seat.id}
                  seat={seat}
                  prices={price}
                  status={this.props.seats[seat.id].status}
                  rowName={section.row_name}
                  priceClass={'price-' + priceGroup}
                  onClick={this.props.active ? this.props.onSeatClicked.bind(null, seat.id, section.id) : null} />;
              }.bind(this))}
              </div>
            );
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
