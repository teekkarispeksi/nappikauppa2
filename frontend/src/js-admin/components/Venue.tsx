'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import SeatSelector from './SeatSelector';
import editable = require('./editables');
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';


export interface IVenueProps {
  venue_id: number;
}

export interface IVenueState {
  originalVenue?: IVenue;
  venue: IVenue;
}

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Venue extends React.Component<IVenueProps, IVenueState> {
  constructor() {
    super();
    this.state = {venue: null};
  }

  reset(venue?: IVenue) {
    if (venue) {
      this.setState({originalVenue: venue, venue: almostDeepClone(venue)});
    } else {
      this.setState({venue: almostDeepClone(this.state.originalVenue)});
    }
  }

  componentWillMount() {
    $.getJSON('api/venues/' + this.props.venue_id, (resp: IVenue) => {
      this.reset(resp);
    });
  }

  saveChanges() {
    $.ajax({
      url: 'admin-api/venues/' + this.state.venue.id,
      method: 'POST',
      data: JSON.stringify(this.state.venue),
      contentType: 'application/json',
      success: (response: IVenue) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('venue info updating failed'); // TODO
      }
    });

  }

  onSeatClicked(seat_id, section_id) {
    this.state.venue.sections[section_id].seats[seat_id].inactive = !this.state.venue.sections[section_id].seats[seat_id].inactive;
    this.forceUpdate();
  }

  render() {
    if (!this.state.venue) {
      return (<div></div>);
    }
    var venue = this.state.venue;

    var hasEdits = !_.isEqual(this.state.venue, this.state.originalVenue);
    return (
      <div>
        <h2>Teatterin tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          <tr><td>ID</td><td>{this.state.venue.id}</td></tr>
          <tr><td>Nimi</td><td>{editable.String(this, this.state.venue, 'venue_title')}</td></tr>
          <tr><td>Lipputyyppi</td>
            <td>{editable.Select(this, this.state.venue, 'ticket_type', [{value: 'generic-tickets', name: 'Numeroimaton'}, {value: 'numbered-seats', name: 'Numeroitu'}])}</td>
          </tr>
          <tr><td>Layout-kuva</td><td>{editable.String(this, this.state.venue, 'layout_src')}</td></tr>
          <tr><td>Kuvaus</td><td>{editable.Text(this, this.state.venue, 'description')}</td></tr>
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
        <h2>Katsomot</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>ID</th>
            <th>Nimi</th>
            <th>Rivin nimi</th>
            <th>Paikkoja</th>
          </tr></thead>
          <tbody>
          {_.values(this.state.venue.sections).map((section: ISection) => {
            return (<tr key={section.id}>
                <td>{section.id}</td>
                <td>{editable.String(this, section, 'section_title')}</td>
                <td>{editable.String(this, section, 'row_name')}</td>
                <td>{_.keys(section.seats).length}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
        <h2>Paikat</h2>
        {venue.ticket_type === 'numbered-seats' ? <SeatSelector venue={venue} onSeatClicked={this.onSeatClicked.bind(this)} /> : null}
      </div>
    );
  }

}
