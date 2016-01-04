'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
import MomentTZ = require('moment-timezone');

import {IShow} from '../../../../backend/src/show';
import {IVenue} from '../../../../backend/src/venue';

export interface IShowProps {
  show_id?: number;
}

export interface IShowState {
  originalShow?: IShow;
  show?: IShow;
  venues?: IVenue[];
}

export default class Show extends React.Component<IShowProps, IShowState> {
  constructor() {
    super();
    this.state = {venues: [], originalShow: {} as IShow, show: {} as IShow};
  }

  reset(show?: IShow) {
    if (show) {
      this.setState({originalShow: show, show: _.clone(show)});
    } else {
      this.setState({show: _.clone(this.state.originalShow)});
    }
  }

  componentWillMount() {
    if (this.props.show_id) {
      $.getJSON('api/shows/' + this.props.show_id, (resp: IShow) => {
        this.reset(resp);
      });
    }
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
  }

  onChange(field: string, event, type?: string) {
    if (type === 'number') {
      this.state.show[field] = parseInt(event.target.value);
    } else if (type === 'select') {
      this.state.show[field] = parseInt(event.target.value);
    } else if (type === 'checkbox') {
      this.state.show[field] = event.target.checked ? 1 : 0;
    } else if (type === 'datetime') {
      var utctime = MomentTZ.tz(event.target.value, 'Europe/Helsinki').utc().format();
      this.state.show[field] = utctime;
    } else {
      this.state.show[field] = event.target.value;
    }
    this.forceUpdate();
  }

  onChangeCheckbox(field, event) {
    this.state.show[field] = event.target.checked;
    this.forceUpdate();
  }

  saveChanges() {
    $.ajax({
      url: 'admin-api/shows/' + this.state.show.id,
      method: 'POST',
      data: JSON.stringify(this.state.show),
      contentType: 'application/json',
      success: (response: IShow) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('show info updating failed'); // TODO
      }
    });

  }

  _editableString(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='text' value={this.state.show[field]} onChange={(event) => this.onChange(field, event)}/></td>
      </tr>);
  }

  _editableNumber(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='number' value={this.state.show[field]} onChange={(event) => this.onChange(field, event, 'number')}/></td>
      </tr>);
  }

  _editableDate(title, field) {
    var localtime = this.state.show[field] ? MomentTZ(this.state.show[field]).tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss') : null;

    return (
      <tr>
        <td>{title}</td>
        <td><input type='datetime-local' value={localtime} onChange={(event) => this.onChange(field, event, 'datetime')}/></td>
      </tr>);
  }

  _editableCheckbox(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='checkbox' checked={this.state.show[field]} onChange={(event) => this.onChange(field, event, 'checkbox')}/></td>
      </tr>);
  }

  _editableText(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><textarea value={this.state.show[field]} onChange={(event) => this.onChange(field, event)} rows={5} cols={40}/></td>
      </tr>);
  }

  _editableSelect(title, field, options) {
    return (
      <tr>
        <td>{title}</td>
        <td><Bootstrap.Input type='select' standalone onChange={(event) => this.onChange(field, event, 'select')} value={this.state.show[field]}>
          {options.map((option) => {
            return (<option key={option.value} value={option.value}>{option.name}</option>);
          })}
        </Bootstrap.Input></td>
      </tr>);
  }

  _staticRow(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td>{this.state.show[field]}</td>
      </tr>);
  }

  render() {
    if (!this.state.venues || !this.state.show) {
      return (<div></div>);
    }
    var venue = _.findWhere(this.state.venues, (v: IVenue) => v.id === this.state.show.venue_id);

    var hasEdits = !_.isEqual(this.state.show, this.state.originalShow);
    return (
      <div>
        <h2>Tilauksen tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          {this._staticRow('ID', 'id')}
          {this._editableString('Nimi', 'title')}
          {this._editableDate('Aika', 'time')}
          {this._editableSelect('Teatteri', 'venue_id', this.state.venues.map((v: IVenue) => {return {value: v.id, name: v.venue_title}; }))}
          {this._editableCheckbox('Aktiivinen', 'active')}
          {this._editableDate('Lopetusaika', 'inactivate_time')}
          {this._editableText('Kuvaus', 'description')}
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
        <h2>Teatteri</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>Näytös</th>
            <th>Katsomo</th>
            <th>Rivi</th>
            <th>Paikka</th>
            <th>Hinta</th>
          </tr></thead>
          <tbody>
          {}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
