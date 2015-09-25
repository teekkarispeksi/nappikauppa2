"use strict";

var React = require('react');
var _ = require('underscore');

var Seat = require('./Seat.jsx');

var Venue = require('../models/venue.js');

var SeatSelector = React.createClass({

  venue: new Venue(),
  chosenSeats: [],

  _initialize: function() {
    this.loading = true;
    this.venue.set("id", this.props.show.get("venue_id"));
    this.venue.fetch({
      success: function(model, response, options) {
        this.loading = false;
        this.forceUpdate();
      }.bind(this)
    });
  },

  componentWillMount: function () {
    this._initialize();
  },

  componentWillReceiveProps: function(nextProps) {
    if(nextProps.show.get("id") !== this.props.show.get("id")) {
      this._initialize();
    }
  },

  render: function () {
    if(!this.props.show || this.loading) {
      return (
        <div className="shopping-stage seat-selector"></div>
      );
    }

    var sections = _.values(this.venue.get("sections"));
    var allSeats = _.flatten(sections.map(function(section) {
      return _.values(section.seats).map(function(seat) {
        seat.section_title = section.title;
        seat.row_name = section.row_name;
        return seat;
      });
    }));

    return (
      <div className="shopping-stage seat-selector">
        <h4>Valitse tästä paikkasi näytökseen <strong>{this.props.show.get('title')}</strong>!</h4>
        <div style={{position: "relative"}}>
          <img src="/public/img/venues/venue_1.png" />
          {allSeats.map(function(seat) {
            var status = "free";
            if (this.props.selectedSeats.indexOf(seat) >= 0) {
              status = "chosen";
            }
            return <Seat seat={seat} status={status} key={seat.id} onClick={this.props.onSeatClicked.bind(null, seat)} />;
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
