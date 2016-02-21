'use strict';

import React = require('react');
import Backbone = require('backbone');
import $ = require('jquery');
import _ = require('underscore');

import {IShow, IReservedSeats} from '../../../../backend/src/show';
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';
import {IProduction} from '../../../../backend/src/production';
import {ISOToDateString} from '../utils';

export interface IHomeState {
  shows?: IShow[];
  venues?: IVenue[];
  productions?: IProduction[];
}

export default class Home extends React.Component<any, IHomeState> {
  constructor() {
    super();
    this.state = {shows: [], venues: [], productions: []};
  }

  componentWillMount() {
    $.getJSON('/api/shows', (resp: IShow[]) => {
      this.setState({shows: resp});
    });
    $.getJSON('/admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
    $.getJSON('/admin-api/productions', (resp: IProduction[]) => {
      this.setState({productions: resp});
    });
  }

  render() {
    return (
      <div>
        <a href={'#discountCodes/'}><h2>Alennuskoodit</h2></a>
        <a href={'#discountGroups/'}><h2>Alennusryhmät</h2></a>
        <h2>Näytökset</h2>
        <p><a href={'#shows/'}>Luo uusi näytös</a></p>
        <ul>
          {this.state.shows.map((show) => <li key={show.id}><a href={'#shows/' + show.id}>{ISOToDateString(show.time)} {show.title}</a> - <a href={'#shows/' + show.id + '/orders'}>Tilaukset</a></li>)}
        </ul>
        <h2>Teatterit</h2>
        <ul>
          {this.state.venues.map((venue) => <li key={venue.id}><a href={'#venues/' + venue.id}>{venue.venue_title}</a></li>)}
        </ul>
        <h2>Produktiot</h2>
        <p><a href={'#productions/'}>Luo uusi produktio</a></p>
        <ul>
          {this.state.productions.map((production) => <li key={production.id}><a href={'#productions/' + production.id}>{production.performer} - {production.title}</a></li>)}
        </ul>
      </div>
    );
  }

}
