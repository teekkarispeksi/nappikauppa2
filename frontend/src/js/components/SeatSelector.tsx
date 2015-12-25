'use strict';

import _ = require('underscore');
import React = require('react');
import Seat from './Seat.tsx';
import Venue from "../models/venue";
import {IShow} from "../../../../backend/src/show";
import {ISection} from "../../../../backend/src/venue";

export interface ISeatSelectorProps {
  active: boolean;
  conflictingSeatIds: number[];
  chosenSeatIds: number[];
  reservedSeatIds: number[];
  show: IShow;
  venue: Venue;

  onSeatClicked: Function;
}

export default class SeatSelector extends React.Component<ISeatSelectorProps, any> {

  getSeatStatuses(): {} {
    var statuses: { [id: number]: string} = {};
    this.props.conflictingSeatIds.forEach(function(id) {
      statuses[id] = 'conflict';
    });
    this.props.chosenSeatIds.forEach(function(id) {
      statuses[id] = 'chosen';
    });
    this.props.reservedSeatIds.forEach(function(id) {
      statuses[id] = 'reserved';
    });
    return statuses;
  }

  render() {
    if (!this.props.show) {
      return (
        <div className='shopping-stage seat-selector'></div>
      );
    }

    var divClass = 'shopping-stage seat-selector';
    if (!this.props.active) {
      divClass += ' disabled';
    }

    // different price groups among seats in this show; discount_groups[0] is the most expensive one
    var getBasePrice = function(section: any) {
      return section.discount_groups[0].price;
    };
    var prices = _.chain(this.props.show.sections).values().map(getBasePrice).unique().value().sort().reverse();

    var statuses = this.getSeatStatuses();

    return (
      <div className={divClass}>
        <h2>Paikkojen valinta <small>2/5</small></h2>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/venue_1.png)'}}>
          {_.values(this.props.venue.get('sections')).map(function(section) {
            var showSection = this.props.show.sections[section.id];
            if (!showSection) {
              return null; // if section is set to active=0 in DB table 'nk2_prices'
            }
            var price = _.pluck(showSection.discount_groups, 'price');
            var priceGroup = prices.indexOf(price[0]);
            return (
              <div key={section.id}>
              {_.values(section.seats).map(function(seat) {
                var status;
                if (statuses[seat.id]) {
                  status = statuses[seat.id];
                } else {
                  status = seat.bad_seat ? 'bad' : 'free';
                }
                return <Seat key={seat.id}
                  seat={seat}
                  prices={price}
                  status={status}
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

}
