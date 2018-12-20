'use strict';

import React = require('react');
import Backbone = require('backbone');
import $ = require('jquery');
import _ = require('underscore');

import ShowList from './ShowList';

import {IVenue} from '../../../../backend/src/venue';
import {IProduction} from '../../../../backend/src/production';

export interface IHomeState {
  venues?: IVenue[];
  production?: IProduction; // latest
  productions?: IProduction[];
}

export default class Home extends React.Component<any, IHomeState> {

  constructor(props) {
    super(props);
    this.state = {venues: [], productions: []};
  }

  componentWillMount() {
    $.getJSON('api/productions/latest', (resp: IProduction) => {
      this.setState({production: resp});
    });
    $.getJSON('admin-api/venues', (resp: IVenue[]) => {
      this.setState({venues: resp});
    });
    $.getJSON('admin-api/productions', (resp: IProduction[]) => {
      this.setState({productions: resp});
    });
  }

  render() {
    return (
      <div>
        <a href={'#discountCodes/'}><h2>Alennuskoodit</h2></a>
        <a href={'#discountGroups/'}><h2>Alennusryhmät</h2></a>
        {this.state.production ? <ShowList production={this.state.production} /> : null}
        <h2>Teatterit</h2>
        <p><a href={'#venues/'}>Luo uusi teatteri</a></p>
        <ul>
          {this.state.venues.map((venue) => <li key={venue.id}><a href={'#venues/' + venue.id}>{venue.venue_title}</a></li>)}
        </ul>
        <h2>Produktiot</h2>
        <p><a href={'#productions/'}>Luo uusi produktio</a></p>
        <ul>
          {this.state.productions.map((production) =>
            <li key={production.id}>
              <a href={'#productions/' + production.id}>{production.performer} - {production.title}</a>
               &nbsp;--- <a href={'#statistics/' + production.id}>Statistiikat</a>
            </li>)}
        </ul>
      </div>
    );
  }

}
