'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import Button from '../../js/components/Button';
import editable = require('./editables');

import {IShow, IShowSection} from '../../../../backend/src/show';
import {IDiscountGroup} from '../../../../backend/src/discountGroup';
import {IVenue, ISection} from '../../../../backend/src/venue';
import {IProduction} from '../../../../backend/src/production';

export interface IShowProps {
  show_id?: number;
}

export interface IShowState {
  shows?: IShow[];
  show?: IShow;
  show_id?: number;
  venues?: IVenue[];
  productions?: IProduction[];
}

var DEFAULT_VALUES: IShow = {
  active: false,
  inactivate_time: '1900-01-01T00:00',
  time: '1900-01-01T00:00'
} as IShow;

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Show extends React.Component<IShowProps, IShowState> {
  constructor() {
    super();
    this.state = {venues: null, shows: null, show: null};
  }

  reset(shows?: IShow[]) {
    if (shows) {
      this.setState({shows: shows, show: almostDeepClone(this.getOriginalShow(shows))});
    } else {
      this.setState({show: almostDeepClone(this.getOriginalShow())});
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
    return show_id ? _.findWhere(shows, {id: show_id}) : DEFAULT_VALUES;
  }

  componentWillMount() {
    $.getJSON('api/shows/', (resp: IShow[]) => {
      this.reset(resp);
    });
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
    $.getJSON('admin-api/productions', (resp: IProduction[]) => {
      this.setState({productions: resp});
    });
  }

  onVenueChange(__this: any, obj: {}, field: string, event, type?: string) {
    __this.state.show[field] = parseInt(event.target.value);
    var venue = _.findWhere(__this.state.venues, {id: __this.state.show[field]}) as IVenue;
    __this.state.show.sections = _.mapObject(venue.sections, (section: ISection): IShowSection => {
      return {
        section_id: section.id,
        active: true,
        price: 0
      };
    });
    __this.forceUpdate();
  }

  saveChanges() {
    if (!this.props.show_id) {
      this.state.shows.push(this.state.show);
    }
    $.ajax({
      url: 'admin-api/shows/' + (this.state.show.id ? this.state.show.id : ''),
      method: 'POST',
      data: JSON.stringify(this.state.show),
      contentType: 'application/json',
      success: (response: IShow) => {
        var idx = _.findIndex(this.state.shows, (show: IShow) => show.id === response.id);
        if (idx >= 0) {
          this.state.shows[idx] = response;
        } else {
          this.state.shows.push(response);
        }
        this.setState({show_id: response.id});
        this.reset();
      },
      error: (response) => {
        console.log('show info updating failed'); // TODO
      }
    });

  }

  render() {
    if (!this.state.venues || !this.state.show || !this.state.productions) {
      return (<div></div>);
    }
    var venue = _.findWhere(this.state.venues, {id: this.state.show.venue_id});
    var production = _.findWhere(this.state.productions, {id: this.state.show.production_id});

    var hasEdits = !_.isEqual(this.state.show, this.getOriginalShow());
    return (
      <div>
        <h2>Näytöksen tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          <tr><td>ID</td><td>{this.state.show.id}</td></tr>
          <tr><td>Nimi</td><td>{editable.String(this, this.state.show, 'title')}</td></tr>
          <tr><td>Aika</td><td>{editable.Date(this, this.state.show, 'time')}</td></tr>
          <tr><td>Produktio</td>
            <td>{editable.Select(this, this.state.show, 'production_id', this.state.productions.map((v: IProduction) => {return {value: v.id, name: v.title}; }))}</td>
          </tr>
          <tr><td>Teatteri</td>
            <td>{editable.Select(this, this.state.show, 'venue_id', this.state.venues.map((v: IVenue) => {return {value: v.id, name: v.venue_title}; }), this.onVenueChange)}</td>
          </tr>
          <tr><td>Aktiivinen</td><td>{editable.Checkbox(this, this.state.show, 'active')}</td></tr>
          <tr><td>Myynti loppuu</td><td>{editable.Date(this, this.state.show, 'inactivate_time')}</td></tr>
          <tr><td>Kuvaus</td>
            <td>{editable.Text(this, this.state.show, 'description')}<p>Kuvauksessa voi käyttää <a href='https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet'>Markdown-muotoiluja</a></p>
          </td></tr>
        </tbody></Bootstrap.Table>
        <Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Button>
        <Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Button>
        <h2>Hinnat</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>ID</th>
            <th>Katsomo</th>
            <th>Hinta</th>
          </tr></thead>
          <tbody>
          {venue ? _.values(this.state.show.sections).map((show_section: IShowSection) => {
            var section = venue.sections[show_section.section_id];
            return (<tr key={section.id}>
                <td>{section.id}</td>
                <td>{section.section_title}</td>
                <td>{editable.Number(this, show_section, 'price')}</td>
                <td>{editable.Checkbox(this, show_section, 'active')}</td>
              </tr>
            );
          }) : null}
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
            var thisShowOnly = discount_group.show_id !== null;
            return (<tr key={discount_group.id}>
                <td>{discount_group.id}</td>
                <td>{thisShowOnly ? editable.String(this, discount_group, 'title') : discount_group.title}</td>
                <td>{thisShowOnly ? editable.Number(this, discount_group, 'discount') : discount_group.discount}</td>
                <td>{thisShowOnly ? editable.Checkbox(this, discount_group, 'admin') : discount_group.admin}</td>
              </tr>
            );
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
