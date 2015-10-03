'use strict';

var React = require('react');
var _ = require('underscore');

var Ticket = React.createClass({

  onChange: function(event) {
    this.props.onDiscountSelect(event.target.value);
  },

  render: function() {
    var seat = this.props.ticket.get('seat');
    return (
      <li key={seat.id}>{seat.section_title}, {seat.row_name} {seat.row}, paikka {seat.number}
        <a className='removeSeat' onClick={this.props.onRemove.bind(null, seat)}>[X]</a>
        <select disabled={!this.props.active} onChange={this.onChange} value={this.props.ticket.get('discount_group')}>
          {_.map(seat.prices, function(group) {
            return (<option key={group.id} value={group.id}>{group.title} : {group.price}</option>);
          })}
        </select>
      </li>
    );
  }

});

module.exports = Ticket;
