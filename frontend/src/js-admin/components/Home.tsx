'use strict';

import React = require('react');
import Backbone = require('backbone');
import $ = require('jquery');
import _ = require('underscore');

import {IShow, IReservedSeats, IDiscountGroup} from '../../../../backend/src/show';
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';

export interface IHomeState {
  shows?: IShow[];
  venues?: IVenue[];
}

export default class Home extends React.Component<any, IHomeState> {
  constructor() {
    super();
    this.state = {shows: [], venues: []};
  }

  componentWillMount() {
    $.getJSON('api/shows', (resp: IShow[]) => {
      this.setState({shows: resp});
    });
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
  }

  render() {
    return (
      <div>
        <h2>Näytökset</h2>
        <p><a href={'#shows/'}>Luo uusi näytös</a></p>
        <ul>
          {this.state.shows.map((show) => <li key={show.id}><a href={'#shows/' + show.id}>{show.title}</a> - <a href={'#shows/' + show.id + '/orders'}>Tilaukset</a></li>)}
        </ul>
        <h2>Teatterit</h2>
        <ul>
          {this.state.venues.map((venue) => <li key={venue.id}><a href={'#venues/' + venue.id}>{venue.venue_title}</a></li>)}
        </ul>
      </div>
    );
  }

}
