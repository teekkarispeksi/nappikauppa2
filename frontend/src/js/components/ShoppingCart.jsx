'use strict';

var React = require('react');

var ShoppingCart = React.createClass({

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
            var seat = ticket.get('seat');
            return (
              <li key={seat.id}>{seat.section_title}, {seat.row_name} {seat.row}, paikka {seat.number}
                <a className='removeSeat' onClick={this.props.onSeatClicked.bind(null, seat)}>[X]</a></li>
            );
          }.bind(this))}
        </ul>
        {reserveTicketsButton}
      </div>
    );
  }

});

module.exports = ShoppingCart;
