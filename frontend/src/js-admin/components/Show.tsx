'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
import MomentTZ = require('moment-timezone');

import {IShow, IShowSection, IDiscountGroup} from '../../../../backend/src/show';
import {IVenue, ISection} from '../../../../backend/src/venue';

export interface IShowProps {
  show_id?: number;
}

export interface IShowState {
  shows?: IShow[];
  show?: IShow;
  show_id? : number;
  venues?: IVenue[];
}

function deepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Show extends React.Component<IShowProps, IShowState> {
  constructor() {
    super();
    this.state = {venues: [], shows: [{}] as IShow[], show: {} as IShow};
  }

  reset(shows?: IShow[]) {
    if (shows) {
      this.setState({shows: shows, show: deepClone(this.getOriginalShow(shows))});
    } else {
      this.setState({show: deepClone(this.getOriginalShow())});
    }
  }

  getOriginalShow(shows?: IShow[]) {
    if (!shows) {
      shows = this.state.shows;
    }
    var show_id = null;
    if (this.state.show_id) {
      show_id = this.state.show_id;
    } else if (this.props.show_id) {
      show_id = this.props.show_id;
    }
    return show_id ? _.findWhere(shows, {id: show_id}) : {} as IShow;
  }

  componentWillMount() {
    if (this.props.show_id) {
      $.getJSON('api/shows/', (resp: IShow[]) => {
        this.reset(resp);
      });
    }
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
  }

  onChange(obj: {}, field: string, event, type?: string) {
    if (type === 'number') {
      obj[field] = parseInt(event.target.value);
    } else if (type === 'select') {
      obj[field] = parseInt(event.target.value);
    } else if (type === 'checkbox') {
      obj[field] = event.target.checked ? 1 : 0;
    } else if (type === 'datetime') {
      var utctime = MomentTZ.tz(event.target.value, 'Europe/Helsinki').utc().format();
      obj[field] = utctime;
    } else {
      obj[field] = event.target.value;
    }
    this.forceUpdate();
  }

  onVenueChange(obj: {}, field: string, event, type?: string) {
    this.state.show[field] = parseInt(event.target.value);
    var venue = _.findWhere(this.state.venues, {id: this.state.show[field]});
    this.state.show.sections = _.mapObject(venue.sections, (section: ISection): IShowSection => {
      return {
        section_id: section.id,
        active: true,
        price: 0
      };
    });
    this.forceUpdate();
  }

  saveChanges() {
    if (!this.props.show_id) {
      this.state.shows.push(this.state.show);
    }
    $.ajax({
      url: 'admin-api/shows/' + this.state.show.id,
      method: 'POST',
      data: JSON.stringify(this.state.show),
      contentType: 'application/json',
      success: (response: IShow) => {
        this.reset();
      },
      error: (response) => {
        console.log('show info updating failed'); // TODO
      }
    });

  }

  _editableString(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<input type='text' value={obj[field]} onChange={(event) => onChange(obj, field, event)}/>);
  }

  _editableNumber(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<input type='number' value={obj[field]} onChange={(event) => onChange(obj, field, event, 'number')}/>);
  }

  _editableDate(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    var localtime = obj[field] ? MomentTZ(obj[field]).tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss') : null;

    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<input type='datetime-local' value={localtime} onChange={(event) => onChange(obj, field, event, 'datetime')}/>);
  }

  _editableCheckbox(obj: {}, field: string, onChange?: (obj: {}, field: string, event, type?: string) => void) {
    if (!onChange) {
      onChange = this.onChange.bind(this);
    }
    return (<input type='checkbox' checked={obj[field]} onChange={(event) => onChange(obj, field, event, 'checkbox')}/>);
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

  render() {
    if (!this.state.venues || !this.state.show) {
      return (<div></div>);
    }
    var venue = _.findWhere(this.state.venues, {id: this.state.show.venue_id});
    if (!venue) {
      return (<div></div>);
    }
    var hasEdits = !_.isEqual(this.state.show, this.getOriginalShow());
    return (
      <div>
        <h2>Näytöksen tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          <tr><td>ID</td><td>{this.state.show.id}</td></tr>
          <tr><td>Nimi</td><td>{this._editableString(this.state.show, 'title')}</td></tr>
          <tr><td>Aika</td><td>{this._editableDate(this.state.show, 'time')}</td></tr>
          <tr><td>Teatteri</td><td>{this._editableSelect(this.state.show, 'venue_id', this.state.venues.map((v: IVenue) => {return {value: v.id, name: v.venue_title}; }), this.onVenueChange.bind(this))}</td></tr>
          <tr><td>Aktiivinen</td><td>{this._editableCheckbox(this.state.show, 'active')}</td></tr>
          <tr><td>Lopetusaika</td><td>{this._editableDate(this.state.show, 'inactivate_time')}</td></tr>
          <tr><td>Kuvaus</td><td>{this._editableText(this.state.show, 'description')}</td></tr>
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
        <h2>Hinnat</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>ID</th>
            <th>Katsomo</th>
            <th>Hinta</th>
          </tr></thead>
          <tbody>
          {_.values(this.state.show.sections).map((show_section: IShowSection) => {
            var section = venue.sections[show_section.section_id];
            return (<tr key={section.id}>
                <td>{section.id}</td>
                <td>{section.section_title}</td>
                <td>{this._editableNumber(show_section, 'price')}</td>
                <td>{this._editableCheckbox(show_section, 'active')}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
        <h2>Alennukset</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>ID</th>
            <th>Nimi</th>
            <th>Alennus</th>
            <th>Admin</th>
          </tr></thead>
          <tbody>
          {_.values(this.state.show.discount_groups).map((discount_group: IDiscountGroup) => {
            var editable = discount_group.show_id !== null;
            return (<tr key={discount_group.id}>
                <td>{discount_group.id}</td>
                <td>{editable ? this._editableString(discount_group, 'title') : discount_group.title}</td>
                <td>{editable ? this._editableNumber(discount_group, 'discount') : discount_group.discount}</td>
                <td>{editable ? this._editableCheckbox(discount_group, 'admin') : discount_group.admin}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
