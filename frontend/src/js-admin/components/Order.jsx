'use strict';

var React = require('react');
var _ = require('underscore');
var Backbone = require('backbone');
Backbone.emulateHTTP = true; // PATCH's don't work with our mod_rewrites

var Table = require('react-bootstrap/lib/Table');
var Button = require('react-bootstrap/lib/Button');

var OrderModel = require('../models/order.js');

var Order = React.createClass({
  order: null,

  getInitialState: function() {
    return {hasEdits: false};
  },

  reset: function() {
    this.setState({name: null, email: null});
  },

  componentWillMount: function() {
    this.order = new OrderModel({id: this.props.orderid});
    this.order.fetch({
      success: function() {
        this.reset();
      }.bind(this)
    });
  },

  onChange: function(field, event) {
    var change = {};
    change[field] = event.target.value;
    this.setState(change);
  },

  saveChanges: function() {
    var changes = {};
    if (this.state.name) {
      changes.name = this.state.name;
    }
    if (this.state.email) {
      changes.email = this.state.email;
    }
    this.order.save(changes, {
      patch: true, // Backbone.emulateHTTP is set to 'true' to make this still a POST request
      success: function(response) {
        this.reset();
      }.bind(this),
      error: function(response) {
        console.log('order info updating failed'); // TODO
      }.bind(this)
    });
  },

  _editableRow: function(title, field) {
    return (
      <tr>
        <td>{title}</td>
        <td><input type='text' value={this.state[field] ? this.state[field] : this.order.get(field)} onChange={this.onChange.bind(null,field)}/></td>
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
        <Button disabled={!(this.state.name || this.state.email)} onClick={this.saveChanges}>Tallenna muutokset</Button>
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
