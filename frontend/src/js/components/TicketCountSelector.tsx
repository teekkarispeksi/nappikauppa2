'use strict';

import _ = require('underscore');
import React = require('react');
import Bootstrap = require('react-bootstrap');

import Seat from './Seat.tsx';
import {IShow} from "../../../../backend/src/show";
import {ISection} from "../../../../backend/src/venue";
import {IVenue} from "../../../../backend/src/venue";

export interface ITicketCountSelectorProps {
  active: boolean;
  conflictingSeatIds: number[];
  chosenSeatIds: number[];
  reservedSeatIds: number[];
  show: IShow;
  venue: IVenue;

  onSeatClicked: Function;
}

export default class TicketCountSelector extends React.Component<ITicketCountSelectorProps,any>{
  constructor(props: any) {
    super();
    this.state = {error: null};
  }

  onChange(section, event) {
    var newVal = event.target.value;
    var sectionSeatIds = _.values(this.props.venue.sections[section.id].seats).map((s) => s.id) // _.keys returns strings, we need ints
    var sectionChosenSeatIds = _.intersection(this.props.chosenSeatIds, sectionSeatIds);
    var current = sectionChosenSeatIds.length;
    if (current > newVal) {
      if (newVal < 0) {
        this.setState({error: 'Lippujen määrä ei voi olla negatiivinen'});
        return;
      }
      _.chain(this.props.chosenSeatIds)
       .last(current - newVal)
       .each((id) => this.props.onSeatClicked(id, section.id));
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
       .each((id) => this.props.onSeatClicked(id, section.id));
    }
    this.setState({error: null});
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

    return (
      <div className={divClass}>
        <h2>Valitse lippujen määrä <small>2/5</small></h2>
        <div>
          {_.values(this.props.venue.sections).map((section) => {
            var sectionSeatIds = _.values(this.props.venue.sections[section.id].seats).map((s) => s.id); // _.keys returns strings, we need ints
            var sectionReservedSeatIds = _.intersection(this.props.reservedSeatIds, sectionSeatIds);
            var availabeSeatsCount = sectionSeatIds.length - sectionReservedSeatIds.length;

            return (
              <Bootstrap.Input key={section.id}
                label={section.section_title}
                type='number'
                readOnly={!this.props.active || availabeSeatsCount === 0}
                value={this.props.chosenSeatIds.length}
                min={0} max={availabeSeatsCount}
                bsStyle={this.state.error ? 'error' : null}
                onChange={this.onChange.bind(this, section)} />
            );
          })}
        </div>
      </div>
    );
  }
}
