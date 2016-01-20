'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');

import editable = require('./editables.tsx');
import {IOrder} from '../../../../backend/src/order';
import {ITicket} from '../../../../backend/src/ticket';

export interface IOrderProps {
  order_id: number;
}

export interface IOrderState {
  originalOrder?: IOrder;
  order?: IOrder;
}

// this is a 'hacky' way, but works for stuff that consists of objects, arrays, strings and numbers
function almostDeepClone<T extends {}>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default class Order extends React.Component<IOrderProps, IOrderState> {
  constructor() {
    super();
    this.state = {order: null};
  }

  reset(order?: IOrder) {
    if (order) {
      this.setState({originalOrder: order, order: almostDeepClone(order)});
    } else {
      this.setState({order: almostDeepClone(this.state.originalOrder)});
    }
  }

  componentWillMount() {
    $.getJSON('admin-api/orders/' + this.props.order_id, (resp: IOrder) => {
      this.reset(resp);
    });
  }

  saveChanges() {
    $.ajax({
      url: 'admin-api/orders/' + this.state.order.order_id,
      method: 'POST',
      data: JSON.stringify(this.state.order),
      contentType: 'application/json',
      success: (response: IOrder) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('order info updating failed'); // TODO
      }
    });
  }

  removeTicket(ticket: ITicket) {
    $.ajax({
      url: 'admin-api/orders/' + this.state.order.order_id + '/tickets/' + ticket.ticket_id + '/delete',
      method: 'GET', // DELETE doesn't work with our mod_rewrites, and X-HTTP-Method-Override didn't seem to work either
      success: (response: IOrder) => {
        this.reset(response);
      },
      error: (response) => {
        console.log('removing ticket failed', ticket); // TODO
      }
    });
  }

  sendTickets() {
    $.get('admin-api/orders/' + this.state.order.order_id + '/tickets/send');
  }

  render() {
    if (!this.state.order) {
      return (<div></div>);
    }
    var hasEdits = !_.isEqual(this.state.order, this.state.originalOrder);

    return (
      <div>
        <h2>Tilauksen tiedot</h2>
        <Bootstrap.Table bordered><tbody>
          <tr><td>ID</td><td>{this.state.order.order_id}</td></tr>
          <tr><td>Nimi</td><td>{editable.String(this, this.state.order, 'name')}</td></tr>
          <tr><td>Email</td><td>{editable.String(this, this.state.order, 'email')}</td></tr>
          <tr><td>Alennuskoodi</td><td>{this.state.order.discount_code}</td></tr>
          <tr><td>Aika</td><td>{this.state.order.time}</td></tr>
          <tr><td>Status</td><td>{this.state.order.status}</td></tr>
        </tbody></Bootstrap.Table>
        <Bootstrap.Button disabled={!hasEdits} onClick={this.saveChanges.bind(this)}>Tallenna muutokset</Bootstrap.Button>
        <Bootstrap.Button disabled={!hasEdits} onClick={() => this.reset()}>Peru</Bootstrap.Button>
        <h2>Liput</h2>
        <Bootstrap.Button disabled={this.state.order.status !== 'paid'} onClick={this.sendTickets.bind(this)}>Lähetä liput uudelleen</Bootstrap.Button>
        <Bootstrap.Table bordered>
          <thead><tr>
            <th>Näytös</th>
            <th>Katsomo</th>
            <th>Rivi</th>
            <th>Paikka</th>
            <th>Hinta</th>
            <th>Poista</th>
          </tr></thead>
          <tbody>
          {this.state.order.tickets.map((ticket) => {
            var remove = (ticket.ticket_price === 0 || this.state.order.order_price === 0) ? <Bootstrap.Button onClick={this.removeTicket.bind(this, ticket)}>X</Bootstrap.Button> : null;
            return (<tr key={ticket.ticket_id}>
              <td>{ticket.show_title}</td>
              <td>{ticket.section_title}</td>
              <td>{ticket.row_name} {ticket.row}</td>
              <td>Paikka {ticket.seat_number}</td>
              <td>{ticket.ticket_price}</td>
              <td>{remove}</td>
            </tr>);
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
