'use strict';

var React = require('react');
var Backbone = require('backbone');
var Table = require('react-bootstrap/lib/Table');

var $ = require('jquery');
var _ = require('underscore');

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
        </tr>
          {this.orders.map(function(order) {
            var editLink = order.get('status') === 'paid' ? <a href={'#orders/' + order.get('id')}>Edit</a> : null;
            var ticketLink = order.get('status') === 'paid' ? <a href={'admin-api/orders/' + order.get('id') + '/tickets/'}>Liput</a> : null;
            return (<tr key={order.get('id')}>
              <td>{order.get('name')}</td>
              <td>{order.get('time')}</td>
              <td>{order.get('price')}</td>
              <td>{order.get('status')}</td>
              <td>{editLink}</td>
              <td>{ticketLink}</td>
            </tr>);
          }.bind(this))}
        </tbody></Table>
      </div>
    );
  }

});

module.exports = OrderList;
