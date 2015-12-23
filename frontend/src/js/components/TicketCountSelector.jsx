'use strict';

var _ = require('underscore');
var React = require('react');
var Seat = require('./Seat.jsx');

var Input = require('react-bootstrap/lib/Input');

var TicketCountSelector = React.createClass({

  getInitialState: function() {
    return {error: null};
  },

  onChange: function(section, event) {
    var newVal = event.target.value;
    var sectionSeatIds = _.values(_.mapObject(this.props.venue.get('sections')[section.id].seats, function(seat) { return seat.id;})); // _.keys returns strings, we need ints
    var sectionChosenSeatIds = _.intersection(this.props.chosenSeatIds, sectionSeatIds);
    var current = sectionChosenSeatIds.length;
    if (current > newVal) {
      if (newVal < 0) {
        this.setState({error: 'Lippujen määrä ei voi olla negatiivinen'});
        return;
      }
      _.chain(this.props.chosenSeatIds)
       .last(current - newVal)
       .each(function(id) { this.props.onSeatClicked(id, section.id); }.bind(this));
    } else if (current < newVal) {
      var sectionReservedSeatIds = _.intersection(this.props.reservedSeatIds, sectionSeatIds);
      var availabeSeatsCount = sectionSeatIds.length - sectionReservedSeatIds.length;
      if (newVal > availabeSeatsCount) {
        this.setState({error: 'Vain ' + availabeSeatsCount + ' paikkaa on vapaana'});
        return;
      }
      _.chain(sectionSeatIds)
       .difference(this.props.chosenSeatIds)
       .difference(this.props.reservedSeatIds)
       .sample(newVal - current) // choose random id's to lessen the chance that another user picks the same seats
       .each(function(id) { this.props.onSeatClicked(id, section.id); }.bind(this));
    }
    this.setState({error: null});
  },

  render: function() {
    if (!this.props.show) {
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
        <h2>Valitse lippujen määrä <small>2/5</small></h2>
        <div>
          {_.map(_.values(this.props.venue.get('sections')), function(section) {
            var sectionSeatIds = _.values(_.mapObject(this.props.venue.get('sections')[section.id].seats, function(seat) { return seat.id; })); // _.keys returns strings, we need ints
            var sectionReservedSeatIds = _.intersection(this.props.reservedSeatIds, sectionSeatIds);
            var availabeSeatsCount = sectionSeatIds.length - sectionReservedSeatIds.length;

            return (
              <Input
                label={section.section_title}
                type='number'
                readOnly={!this.props.active || availabeSeatsCount === 0}
                value={this.props.chosenSeatIds.length}
                min={0} max={availabeSeatsCount}
                bsStyle={this.state.error ? 'error' : null}
                onChange={this.onChange.bind(null, section)} />
            );
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = TicketCountSelector;
