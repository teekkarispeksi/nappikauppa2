'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import SeatSelector from './SeatSelector';
import editable = require('./editables');
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';


export interface IVenueProps {
  venue_id?: number;
}

export interface IVenueState {
  selectSeatsForSectionId?: number;
  venues?: IVenue[];
  venue?: IVenue;
  venue_id?: number;
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

  reset(venues?: IVenue[]) {
    if (venues) {
      this.setState({venues: venues, venue: almostDeepClone(this.getOriginalVenue(venues))});
    } else {
      this.setState({venue: almostDeepClone(this.getOriginalVenue())});
    }
  }

  getOriginalVenue(venues?: IVenue[]) {
    if (!venues) {
      venues = this.state.venues;
    }
    var venue_id = null;
    if (this.state.venue_id) {
      venue_id = this.state.venue_id;
    } else if (this.props.venue_id) {
      venue_id = this.props.venue_id;
    }
    return venue_id ? _.findWhere(venues, {id: venue_id}) : {} as IVenue;
  }

  onCopyVenue(venue_id: number) {
    var venueToCopyFrom = _.findWhere(this.state.venues, {id: venue_id});
    var venueCopy = _.omit(almostDeepClone(venueToCopyFrom), 'id');

    this.setState({venue: venueCopy});
  }

  componentWillMount() {
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.reset(resp);
    });
  }

  saveChanges() {
    $.ajax({
      url: 'admin-api/venues/' + (this.state.venue.id ? this.state.venue.id : ''),
      method: 'POST',
      data: JSON.stringify(this.state.venue),
      contentType: 'application/json',
      success: (response: IVenue) => {
        var idx = _.findIndex(this.state.venues, (venue: IVenue) => venue.id === response.id);
        if (idx >= 0) {
          this.state.venues[idx] = response;
        } else {
          this.state.venues.push(response);
        }
        this.setState({venue_id: response.id});
        this.reset();
      },
      error: (response) => {
        console.log('venue info updating failed'); // TODO
      }
    });

  }

  onSeatClicked(seat_id, section_id) {
    if (this.state.selectSeatsForSectionId == null) {
      this.state.venue.sections[section_id].seats[seat_id].inactive = !this.state.venue.sections[section_id].seats[seat_id].inactive;
    } else {
      if (section_id === this.state.selectSeatsForSectionId) {
        return;
      }
      var seat = this.state.venue.sections[section_id].seats[seat_id];
      delete this.state.venue.sections[section_id].seats[seat_id];
      this.state.venue.sections[this.state.selectSeatsForSectionId].seats[seat_id] = seat;
    }

    this.forceUpdate();
  }

  render() {
    if (!this.state.venue) {
      return (<div></div>);
    }

    var copy = !this.state.venue_id ? (
      <div>
        <h2>Kopioi teatteri</h2>
        <Bootstrap.FormControl componentClass='select' onChange={(event) => this.onCopyVenue(parseInt((event.target as any).value))}>
          <option />
          {this.state.venues.map((venue) => <option key={venue.id} value={'' + venue.id}>{venue.venue_title}</option>)}
        </Bootstrap.FormControl>
      </div>
    ) : null;

    var venue = this.state.venue;

    var hasEdits = !_.isEqual(this.state.venue, this.getOriginalVenue());
    return (
      <div>
        {copy}
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
            <th>Valitse paikkoja</th>
          </tr></thead>
          <tbody>
          {_.values(this.state.venue.sections).map((section: ISection) => {
            var sectionIsSelected = this.state.selectSeatsForSectionId === section.id;
            return (<tr key={section.id}>
                <td>{section.id}</td>
                <td>{editable.String(this, section, 'section_title')}</td>
                <td>{editable.String(this, section, 'row_name')}</td>
                <td>{_.keys(section.seats).length}</td>
                <td>
                  <Bootstrap.Button
                    bsStyle={sectionIsSelected ? 'primary' : null}
                    onClick={() => this.setState({selectSeatsForSectionId: sectionIsSelected ? null : section.id})}>
                    Valitse
                  </Bootstrap.Button>
                </td>
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
