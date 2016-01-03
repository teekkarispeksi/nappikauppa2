'use strict';

import _ = require('underscore');
import React = require('react');
import Bootstrap = require('react-bootstrap');

import {IShow} from '../../../../backend/src/show';
import {IVenue} from '../../../../backend/src/venue';

export interface ITicketCountSelectorProps {
  active: boolean;
  chosenSeatIds: number[];
  reservedSeatIds: number[];
  show: IShow;
  venue: IVenue;

  onSeatClicked: Function;
}

export default class TicketCountSelector extends React.Component<ITicketCountSelectorProps, any> {
  constructor(props: any) {
    super();
    this.state = {error: null};
  }

  onAdd(section, event) {
    var sectionSeatIds = _.values(this.props.venue.sections[section.id].seats).map((s) => s.id); // _.keys returns strings, we need ints

    _.chain(sectionSeatIds)
     .difference(this.props.chosenSeatIds)
     .difference(this.props.reservedSeatIds)
     .sample(1) // choose random id to lessen the chance that another user picks the same seats
     .each((id) => this.props.onSeatClicked(id, section.id));
  }

  render() {
    var divClass = 'shopping-stage seat-selector';
    if (!this.props.active) {
      divClass += ' disabled';
    }

    return (
      <div className={divClass}>
        <h2>Lisää lippuja ostoskoriin <small>2/5</small></h2>
        <div>
          {_.values(this.props.venue.sections).map((section) => {
            var showSection = this.props.show.sections[section.id];
            if (!showSection) {
              return null; // if section is set to active=0 in DB table 'nk2_prices'
            }
            var prices = _.pluck(showSection.discount_groups, 'price').join('/');

            var sectionSeatIds = _.values(this.props.venue.sections[section.id].seats).map((s) => s.id); // _.keys returns strings, we need ints
            var sectionReservedSeatIds = _.intersection(this.props.reservedSeatIds, sectionSeatIds);
            var sectionChosenSeatIds = _.intersection(this.props.chosenSeatIds, sectionSeatIds);
            var availableSeatsCount = sectionSeatIds.length - sectionReservedSeatIds.length - sectionChosenSeatIds.length;

            var title = availableSeatsCount === 1 ? '1 paikka jäljellä' : '' + availableSeatsCount + ' paikkaa jäljellä';
            return (
              <Bootstrap.Button key={section.id} disabled={!this.props.active || availableSeatsCount === 0} title={title} onClick={this.onAdd.bind(this, section)} >
                <Bootstrap.Glyphicon glyph='plus' /> {section.section_title} {prices} eur
              </Bootstrap.Button>
            );
          })}
        </div>
      </div>
    );
  }
}
