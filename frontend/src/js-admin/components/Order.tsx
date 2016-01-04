'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import {IOrder} from '../../../../backend/src/order';

export interface IOrderProps {
  order_id: number;
}

export interface IOrderState {
  hasEdits?: boolean;
  name?: string;
  email?: string;
  order?: IOrder;
}

export default class Order extends React.Component<IOrderProps, IOrderState> {
  constructor() {
    super();
    this.state = {hasEdits: false, name: null, email: null, order: null};
  }

  reset() {
    this.setState({name: null, email: null});
  }

  componentWillMount() {
    $.getJSON('admin-api/orders/' + this.props.order_id, (resp: IOrder) => {
      this.setState({order: resp});
    });
  }

  onChange(field, event) {
    var change: IOrderState = {};
    change[field] = event.target.value;
    this.setState(change);
  }

  saveChanges() {
    var changes: IOrderState = {};
    if (this.state.name) {
      changes.name = this.state.name;
    }
    if (this.state.email) {
      changes.email = this.state.email;
    }

    $.ajax({
      url: 'admin-api/orders/' + this.state.order.order_id,
      method: 'POST',
      data: JSON.stringify(changes),
      contentType: 'application/json',
      success: (response: IOrder) => {
        this.setState({order: response});
        this.reset();
      },
      error: (response) => {
        console.log('order info updating failed'); // TODO
      }
    });

  }

  _editableRow(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='text' value={this.state[field] ? this.state[field] : this.state.order[field]} onChange={this.onChange.bind(this,field)}/></td>
      </tr>);
  }

  _staticRow(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td>{this.state.order[field]}</td>
      </tr>);
  }

  render() {
    if (!this.state.order) {
      return (<div></div>);
    }
    return (
      <div>
        <h2>Tilauksen tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          {this._editableRow('Nimi', 'name')}
          {this._editableRow('Email', 'email')}
          {this._staticRow('Alennuskoodi', 'discount_code')}
          {this._staticRow('Aika', 'time')}
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!(this.state.name || this.state.email)} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <h2>Liput</h2>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>Näytös</th>
            <th>Katsomo</th>
            <th>Rivi</th>
            <th>Paikka</th>
            <th>Hinta</th>
          </tr></thead>
          <tbody>
          {this.state.order.tickets.map((ticket) => {
            return (<tr key={ticket.ticket_id}>
              <td>{ticket.show_title}</td>
              <td>{ticket.section_title}</td>
              <td>{ticket.row_name} {ticket.row}</td>
              <td>Paikka {ticket.seat_number}</td>
              <td>{ticket.ticket_price}</td>
            </tr>);
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
