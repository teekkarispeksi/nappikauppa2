'use strict';

import _ = require('underscore');
import React = require('react');
import Seat from './Seat.tsx';
import {IShow} from '../../../../backend/src/show';
import {IVenue} from '../../../../backend/src/venue';

export interface ISeatSelectorProps {
  active: boolean;
  conflictingSeatIds: number[];
  chosenSeatIds: number[];
  reservedSeatIds: number[];
  show: IShow;
  venue: IVenue;

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
    var divClass = 'shopping-stage seat-selector';
    if (!this.props.active) {
      divClass += ' disabled';
    }

    var prices = _.chain(this.props.show.sections).values().pluck('price').unique().value().sort().reverse();
    var discounts = _.pluck(this.props.show.discount_groups, 'discount');
    var statuses = this.getSeatStatuses();

    return (
      <div className={divClass}>
        <h2>Paikkojen valinta <small>2/5</small></h2>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/' + this.props.venue.layout_src + ')'}}>
          {_.values(this.props.venue.sections).map(function(section) {
            var showSection = this.props.show.sections[section.id];
            if (!showSection) {
              return null; // if section is set to active=0 in DB table 'nk2_prices'
            }
            var price = showSection.price;
            var priceGroup = prices.indexOf(price);
            return (
              <div key={section.id}>
              {_.values(section.seats).map(function(seat) {
                var status;
                if (statuses[seat.id]) {
                  status = statuses[seat.id];
                } else {
                  status = seat.inactive ? 'inactive' : 'free';
                }
                return <Seat key={seat.id}
                  seat={seat}
                  prices={discounts.map((discount) => Math.max(0, price - discount))}
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
