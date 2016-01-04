'use strict';

import React = require('react');
import Backbone = require('backbone');
import $ = require('jquery');
import _ = require('underscore');

import {IShow, IReservedSeats, IDiscountGroup} from '../../../../backend/src/show';
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';

export interface IHomeState {
  shows: IShow[];
}

export default class Home extends React.Component<any, IHomeState> {
  constructor() {
    super();
    this.state = {shows: []};
  }

  componentWillMount() {
    $.getJSON('api/shows', (resp: IShow[]) => {
      this.setState({shows: resp});
    });
  }

  render() {
    return (
      <div>
        <p><a href={'#shows/'}>Luo uusi näytös</a></p>
        <ul>
          {this.state.shows.map((show) => <li key={show.id}><a href={'#shows/' + show.id}>{show.title}</a> - <a href={'#shows/' + show.id + '/orders'}>Tilaukset</a></li>)}
        </ul>
      </div>
    );
  }

}
