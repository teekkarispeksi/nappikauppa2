'use strict';

var React = require('react');

var Ticket = require('./Ticket.jsx');

var ShoppingCart = React.createClass({

  onDiscountSelect: function(ticket, value) {
    ticket.set('discount_group_id', value);
    this.forceUpdate();
  },

  render: function() {
    var tickets = this.props.tickets;
    if (!tickets) {
      return (
        <div className='shopping-stage shopping-cart'></div>
      );
    }

    var reserveTicketsButton;
    if (this.props.active) {
      reserveTicketsButton = (<a id='reserveTickets' onClick={this.props.onReserveTickets}>Varaa liput</a>);
    }

    return (
      <div className='shopping-stage shopping-cart'>
        <ul>
          {tickets.map(function(ticket) {
            return (
              <Ticket
                key={ticket.get('seat').id}
                ticket={ticket}
                active={this.props.active}
                onDiscountSelect={this.onDiscountSelect.bind(null,ticket)}
                onRemove={this.props.onSeatClicked} />
            );
          }.bind(this))}
        </ul>
        {reserveTicketsButton}
      </div>
    );
  }

});

module.exports = ShoppingCart;
