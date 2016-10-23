'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import SeatSelector from './SeatSelector';
import editable = require('./editables');
import {IProduction} from '../../../../backend/src/production';


export interface IProductionProps {
  production_id: number;
}

export interface IProductionState {
  productions?: IProduction[];
  production?: IProduction;
  production_id?: number;
}

var PERFORMERS = [{value: 'Teekkarispeksi', name: 'Teekkarispeksi'}, {value: 'NääsPeksi', name: 'NääsPeksi'}];

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Production extends React.Component<IProductionProps, IProductionState> {
  constructor() {
    super();
    this.state = {production: null};
  }

  reset(productions?: IProduction[]) {
    if (productions) {
      this.setState({productions: productions, production: almostDeepClone(this.getOriginalProduction(productions))});
    } else {
      this.setState({production: almostDeepClone(this.getOriginalProduction())});
    }
  }

  getOriginalProduction(productions?: IProduction[]) {
    if (!productions) {
      productions = this.state.productions;
    }
    var production_id = null;
    if (this.state.production_id) {
      production_id = this.state.production_id;
    } else if (this.props.production_id) {
      production_id = this.props.production_id;
    }
    return production_id ? _.findWhere(productions, {id: production_id}) : {ticket_image_src: 'lippu_dummy.png'} as IProduction;
  }

  componentWillMount() {
    $.getJSON('admin-api/productions/', (resp: IProduction[]) => {
      this.reset(resp);
    });
  }

  saveChanges() {
    if (!this.props.production_id) {
      this.state.productions.push(this.state.production);
    }
    $.ajax({
      url: 'admin-api/productions/' + (this.state.production.id ? this.state.production.id : ''),
      method: 'POST',
      data: JSON.stringify(this.state.production),
      contentType: 'application/json',
      success: (response: IProduction) => {
        var idx = _.findIndex(this.state.productions, (production: IProduction) => production.id === response.id);
        if (idx >= 0) {
          this.state.productions[idx] = response;
        } else {
          this.state.productions.push(response);
        }
        this.setState({production_id: response.id});
        this.reset();
      },
      error: (response) => {
        console.log('production info updating failed'); // TODO
      }
    });

  }

  render() {
    if (!this.state.production) {
      return (<div></div>);
    }
    var production = this.state.production;

    var hasEdits = !_.isEqual(this.state.production, this.getOriginalProduction());
    return (
      <div>
        <h2>Produktion tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          <tr><td>ID</td><td>{this.state.production.id}</td></tr>
          <tr><td>Nimi</td><td>{editable.String(this, this.state.production, 'title')}</td></tr>
          <tr><td>Esiintyjä</td><td>{editable.Select(this, this.state.production, 'performer', PERFORMERS)}</td></tr>
          <tr><td>Lipunmyynti aukeaa</td><td>{editable.Date(this, this.state.production, 'opens')}</td></tr>
          <tr><td>Aktiivinen</td><td>{editable.Checkbox(this, this.state.production, 'active')}</td></tr>
          <tr><td>Kuvaus</td><td>{editable.Text(this, this.state.production, 'description')}
            <p>Kuvauksessa voi käyttää <a href='https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet'>Markdown-muotoiluja</a></p>
          </td></tr>
          <tr><td>Lipun kuvatiedoston nimi<br/><br/>JPG tai PNG,<br/>kuvasuhde: 595.28 : (3/4 x 841.89)</td><td>{editable.String(this, this.state.production, 'ticket_image_src')}</td></tr>
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
      </div>
    );
  }

}
