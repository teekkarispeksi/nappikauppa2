'use strict';

var React = require('react');
var _ = require('underscore');
var Table = require('react-bootstrap/lib/Table');

var OrderModel = require('../models/order.js');

var Order = React.createClass({
  order: null,

  componentWillMount: function() {
    this.order = new OrderModel({id: this.props.orderid});
    this.order.fetch({
      success: function() {
        this.forceUpdate();
      }.bind(this)
    });
  },

  _editableRow: function(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='text' defaultValue={this.order.get(field)} /></td>
      </tr>);
  },

  _staticRow: function(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td>{this.order.get(field)}</td>
      </tr>);
  },

  render: function() {
    if (!this.order.get('tickets')) {
      return (<div></div>);
    }
    return (
      <div>
        <h2>Tilauksen tiedot</h2>
        <Table bordered><tbody>
          {this._editableRow('Nimi', 'name')}
          {this._editableRow('Email', 'email')}
          {this._staticRow('Alennuskoodi', 'discount_code')}
          {this._staticRow('Aika', 'time')}
        </tbody></Table>

        <h2>Liput</h2>
        <Table bordered>
          <thead><tr>
            <th>Näytös</th>
            <th>Katsomo</th>
            <th>Rivi</th>
            <th>Paikka</th>
            <th>Hinta</th>
          </tr></thead>
          <tbody>
          {this.order.get('tickets').map(function(ticket) {
            return (<tr key={ticket.ticket_id}>
              <td>{ticket.show_title}</td>
              <td>{ticket.section_title}</td>
              <td>{ticket.row_name} {ticket.row}</td>
              <td>Paikka {ticket.seat_number}</td>
              <td>{ticket.ticket_price}</td>
            </tr>);
          }.bind(this))}
        </tbody></Table>
      </div>
    );
  }

});

module.exports = Order;
