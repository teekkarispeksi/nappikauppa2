'use strict';

var React = require('react');
var Button = require('react-bootstrap/lib/Button');
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

    var expirationText;
    if (this.props.reservationHasExpired) {
      expirationText = (<span>Varauksesi on rauennut.</span>);
    }

    var reserveTicketsButton = (<Button id='reserveTickets' disabled={!this.props.active} onClick={this.props.active ? this.props.onReserveTickets : null}>Varaa liput</Button>);

    var timer;
    if (this.props.reservationExpirationTime) {
      var et = this.props.reservationExpirationTime;
      var secs = et.getSeconds();
      var mins = et.getMinutes();
      mins = mins < 10 ? '0' + mins : mins;
      secs = secs < 10 ? '0' + secs : secs;
      var time = et.getHours() + ':' + mins + ':' + secs;
      timer = (<span>Varauksesi on voimassa {time} asti</span>);
    }

    return (
      <div className='shopping-stage shopping-cart'>
        <h2>Paikkojen varaus <small>3/5</small></h2>
        <ul className='list-unstyled'>
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
        {expirationText}
        {reserveTicketsButton}
        {timer}
      </div>
    );
  }

});

module.exports = ShoppingCart;
