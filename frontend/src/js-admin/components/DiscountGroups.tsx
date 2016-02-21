'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import editable = require('./editables.tsx');
import {IDiscountGroup} from '../../../../backend/src/discountGroup';
import {IShow} from '../../../../backend/src/show';


export interface IDiscountGroupProps {
}

export interface IDiscountGroupState {
  originalDiscountGroups?: IDiscountGroup[];
  discountGroups?: IDiscountGroup[];
  shows?: IShow[];
}

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class DiscountGroup extends React.Component<IDiscountGroupProps, IDiscountGroupState> {
  constructor() {
    super();
    this.state = {discountGroups: null};
  }

  reset(discountGroups?: IDiscountGroup[]) {
    if (discountGroups) {
      this.setState({originalDiscountGroups: discountGroups, discountGroups: almostDeepClone(discountGroups)});
    } else {
      this.setState({discountGroups: almostDeepClone(this.state.originalDiscountGroups)});
    }
  }

  componentWillMount() {
    $.getJSON('/admin-api/discountGroups', (resp: IDiscountGroup[]) => {
      this.reset(resp);
    });
    $.getJSON('/api/shows/', (resp: IShow[]) => {
      this.setState({shows: resp});
    });
  }

  saveChanges() {
    this.state.discountGroups.forEach((group) => {
      if (!group.id) {
        group.id = null;
      }
      if (!group.show_id) {
        group.show_id = null;
      }
    });
    $.ajax({
      url: '/admin-api/discountGroups',
      method: 'POST',
      data: JSON.stringify(this.state.discountGroups),
      contentType: 'application/json',
      success: (response: IDiscountGroup[]) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('discountGroup creation failed'); // TODO
      }
    });
  }

  addNewGroup() {
    this.state.discountGroups.push({
      id: null,
      title: '',
      discount: 0,
      show_id: null,
      admin: false,
      active: true
    });
    this.forceUpdate();
  }

  render() {
    if (!this.state.discountGroups || !this.state.shows) {
      return (<div></div>);
    }
    var discountGroups = this.state.discountGroups;

    var hasEdits = !_.isEqual(this.state.discountGroups, this.state.originalDiscountGroups);
    return (
      <div>
        <h2>Alennusryhmät</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>ID</th>
            <th>Nimi (lukee lipussa)</th>
            <th>Alennus</th>
            <th>Show</th>
            <th>Vain admin</th>
            <th>Käytössä</th>
          </tr></thead>
          <tbody>
          {this.state.discountGroups.map((group, i) => {
            return (
              <tr key={group.id ? group.id : (1000 + i)}>
                <td>{group.id}</td>
                <td>{editable.String(this, group, 'title')}</td>
                <td>{editable.Number(this, group, 'discount')}</td>
                <td>{editable.Select(this, group, 'show_id', this.state.shows.map((show) => {return {value: show.id, name: show.title}; }))}</td>
                <td>{editable.Checkbox(this, group, 'admin')}</td>
                <td>{editable.Checkbox(this, group, 'active')}</td>
              </tr>
            );
          })}
          </tbody>
        </Bootstrap.Table>
        <Bootstrap.Button onClick={this.addNewGroup.bind(this)}>Lisää uusi</Bootstrap.Button><br/><br/>
        <Bootstrap.Button onClick={this.saveChanges.bind(this)} disabled={!hasEdits}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
      </div>
    );
  }

}
