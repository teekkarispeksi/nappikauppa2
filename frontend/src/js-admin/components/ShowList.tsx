'use strict';

import React = require('react');
import Backbone = require('backbone');
import $ = require('jquery');
import _ = require('underscore');
import Moment = require('moment-timezone');

import {IProduction} from '../../../../backend/src/production';
import {IShow} from '../../../../backend/src/show';

export interface IShowListProps {
  production: IProduction;
}

export interface IShowListSate {
  shows?: IShow[];
}

export default class ShowList extends React.Component<IShowListProps, IShowListSate> {
  constructor() {
    super();
    this.state = {shows: []};
  }

  componentWillMount() {
    $.getJSON('api/shows', {production_id: this.props.production.id}, (resp: IShow[]) => {
      this.setState({shows: resp});
    });
  }

  render() {
    return (
      <div>
        <h2>Näytökset: {this.props.production ? this.props.production.title : ''}</h2>
        <p><a href={'#shows/'}>Luo uusi näytös</a></p>
        <ul>
          {this.state.shows.map((show) =>
            <li key={show.id}>
              <a href={'#shows/' + show.id}>{Moment.tz(show.time, 'Europe/Helsinki').format('D.M.YYYY')} {show.title}</a>
              &nbsp;-&nbsp;
              <a href={'#shows/' + show.id + '/orders'}>Tilaukset</a>
            </li>)
          }
        </ul>
      </div>
    );
  }

}
