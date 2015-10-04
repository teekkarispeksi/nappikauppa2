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

    var expirationText;
    if (this.props.reservationHasExpired) {
      expirationText = (<span>Varauksesi on rauennut.</span>);
    }

    var reserveTicketsButton;
    if (this.props.active) {
      reserveTicketsButton = (<a id='reserveTickets' onClick={this.props.onReserveTickets}>Varaa liput</a>);
    }

    var timer;
    if (this.props.timeLeft) {
      timer = (<span>{this.props.timeLeft.getMinutes()}:{this.props.timeLeft.getSeconds()}</span>);
    }

    return (
      <div className='shopping-stage shopping-cart'>
        <ul>
          {tickets.map(function(ticket) {
            var seat = ticket.get('seat');
            return (
              <li key={seat.id}>{seat.section_title}, {seat.row_name} {seat.row}, paikka {seat.number}
                {this.props.active ? (<a className='removeSeat' onClick={this.props.onSeatClicked.bind(null, seat)}>[X]</a>) : null}</li>
            );
          }.bind(this))}
        </ul>
        {expirationText}
        {reserveTicketsButton}
        {timer}
      </div>
    );
  }

});

module.exports = ShoppingCart;
