'use strict';

import _ = require('underscore');
import React = require('react');
import Seat from '../../js/components/Seat';
import {IShow} from '../../../../backend/src/show';
import {IVenue} from '../../../../backend/src/venue';

export interface ISeatSelectorProps {
  venue: IVenue;
  onSeatClicked: Function;
}

export default class SeatSelector extends React.Component<ISeatSelectorProps, any> {

  render() {
    var divClass = 'seat-selector';

    return (
      <div className={divClass}>
        <div className='theaterLayout' style={{backgroundImage: 'url(public/img/venues/' + this.props.venue.layout_src + ')'}}>
          {_.values(this.props.venue.sections).map((section) => {
            return (
              <div key={section.id}>
              {_.values(section.seats).map((seat) => {
                var status = seat.inactive ? 'inactive' : 'free';
                return <Seat key={seat.id}
                  seat={seat}
                  prices={[]}
                  status={status}
                  rowName={section.row_name}
                  priceClass={'price-' + (section.id % 4)} // just to differentiate between different sections
                  onClick={this.props.onSeatClicked.bind(null, seat.id, section.id)} />;
              })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

}
