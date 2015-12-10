'use strict';

var React = require('react');
var Backbone = require('backbone');
var Table = require('react-bootstrap/lib/Table');
var Button = require('react-bootstrap/lib/Button');

var $ = require('jquery');
var _ = require('underscore');

var Modal = require('./Modal.jsx');

var Orders = require('../collections/orders.js');

var OrderList = React.createClass({
  orders: new Orders(),
  outdated: true,

  componentWillMount: function() {
    this.orders.fetch({
      data: this.props.showid ? {showid: this.props.showid} : null,
      success: function(collection, response, options) {
        this.forceUpdate();
      }.bind(this)
    });
  },

  removeConfirmationDialog: function(id) {
    var order = this.orders.get(id);
    var ticketLink = order.get('status') === 'paid' ? <a target='_blank' href={'admin-api/orders/' + order.get('id') + '/tickets/'}>Liput</a> : null;

    var removeAndClose = function() {
      order.destroy();
      this.forceUpdate();
    }.bind(this);

    var confirmEl = (
      <Modal title='Vahvista poisto' onAccept={removeAndClose} acceptText='Poista' >
        Haluatko varmasti poistaa seuraavan varauksen:
        <Table bordered striped condensed><tbody>
        <tr>
          <th>Nimi</th>
          <th>Ostettu</th>
          <th>Hinta</th>
          <th>Status</th>
          <th>Liput</th>
        </tr>
        <tr key={order.get('id')}>
          <td>{order.get('name')}</td>
          <td>{order.get('time')}</td>
          <td>{order.get('price')}</td>
          <td>{order.get('status')}</td>
          <td>{ticketLink}</td>
        </tr>
        </tbody></Table>
      </Modal>
    );
    React.unmountComponentAtNode(document.getElementById('modal-container')); // in case the Modal exists already
    React.render(confirmEl, document.getElementById('modal-container')); // there is probably a better way to do this
  },

  render: function() {
    return (
      <div>
        <Table bordered striped condensed><tbody>
        <tr>
          <th>Nimi</th>
          <th>Ostettu</th>
          <th>Hinta</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Liput</th>
          <th>Poista</th>
        </tr>
          {this.orders.map(function(order) {
            var editLink = order.get('status') === 'paid' ? <a href={'#orders/' + order.get('id')}>Edit</a> : null;
            var ticketLink = order.get('status') === 'paid' ? <a href={'admin-api/orders/' + order.get('id') + '/tickets/'}>Liput</a> : null;
            var removeLink = <a onClick={this.removeConfirmationDialog.bind(null, order.get('id'))}>X</a>;
            return (<tr key={order.get('id')}>
              <td>{order.get('name')}</td>
              <td>{order.get('time')}</td>
              <td>{order.get('price')}</td>
              <td>{order.get('status')}</td>
              <td>{editLink}</td>
              <td>{ticketLink}</td>
              <td>{removeLink}</td>
            </tr>);
          }.bind(this))}
        </tbody></Table>
      </div>
    );
  }

});

module.exports = OrderList;
