'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import SeatSelector from './SeatSelector.tsx';

import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';


export interface IVenueProps {
  venue_id: number;
}

export interface IVenueState {
  originalVenue?: IVenue;
  venue: IVenue;
}

function deepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Venue extends React.Component<IVenueProps, IVenueState> {
  constructor() {
    super();
    this.state = {venue: null};
  }

  reset(venue?: IVenue) {
    if (venue) {
      this.setState({originalVenue: venue, venue: deepClone(venue)});
    } else {
      this.setState({venue: deepClone(this.state.originalVenue)});
    }
  }

  componentWillMount() {
    $.getJSON('api/venues/' + this.props.venue_id, (resp: IVenue) => {
      this.reset(resp);
    });
  }

  onChange(obj: {}, field: string, event, type?: string) {
    if (type === 'number') {
      obj[field] = parseInt(event.target.value);
    } else if (type === 'select') {
      obj[field] = event.target.value;
    } else if (type === 'checkbox') {
      obj[field] = event.target.checked ? 1 : 0;
    } else if (type === 'datetime') {
      obj[field] = event.target.value;
    } else {
      obj[field] = event.target.value;
    }
    this.forceUpdate();
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

  _editableString(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<input type='text' value={obj[field]} onChange={(event) => onChange(obj, field, event)}/>);
  }

  _editableText(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<textarea value={obj[field]} onChange={(event) => onChange(obj, field, event)} rows={5} cols={40}/>);
  }

  _editableSelect(obj: {}, field: string, options: {value: any, name: string}[], onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (
      <Bootstrap.Input type='select' standalone onChange={(event) => onChange(obj, field, event, 'select')} value={obj[field]}>
        {options.map((option) => {
          return (<option key={option.value} value={option.value}>{option.name}</option>);
        })}
      </Bootstrap.Input>
    );
  }

  onSeatClicked(seat_id, section_id) {
    this.state.venue.sections[section_id].seats[seat_id].bad_seat = !this.state.venue.sections[section_id].seats[seat_id].bad_seat;
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
          <tr><td>Nimi</td><td>{this._editableString(this.state.venue, 'venue_title')}</td></tr>
          <tr><td>Lipputyyppi</td>
            <td>{this._editableSelect(this.state.venue, 'ticket_type', [{value: 'generic-tickets', name: 'Numeroimaton'}, {value: 'numbered-seats', name: 'Numeroitu'}])}</td>
          </tr>
          <tr><td>Layout-kuva</td><td>{this._editableString(this.state.venue, 'layout_src')}</td></tr>
          <tr><td>Kuvaus</td><td>{this._editableText(this.state.venue, 'description')}</td></tr>
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
                <td>{this._editableString(section, 'section_title')}</td>
                <td>{this._editableString(section, 'row_name')}</td>
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
