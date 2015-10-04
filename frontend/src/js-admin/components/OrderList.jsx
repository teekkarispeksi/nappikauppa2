'use strict';

var React = require('react');
var Backbone = require('backbone');
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
        <table><tbody>
        <tr>
          <th>Nimi</th>
          <th>Ostettu</th>
          <th>Hinta</th>
          <th>Status</th>
        </tr>
          {this.orders.map(function(order) {
            return (<tr key={order.get('id')}>
              <td>{order.get('name')}</td>
              <td>{order.get('time')}</td>
              <td>{order.get('price')}</td>
              <td>{order.get('status')}</td>
            </tr>);
          }.bind(this))}
        </tbody></table>
      </div>
    );
  }

});

module.exports = OrderList;
