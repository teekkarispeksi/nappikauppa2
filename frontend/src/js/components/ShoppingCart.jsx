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

    var reserveTicketsButton = (this.props.active && tickets.length > 0) ?
      (<Button id='reserveTickets' onClick={this.props.onReserveTickets}>Varaa liput</Button>) : null;

    var timer;
    if (this.props.reservationExpirationTime) {
      var et = this.props.reservationExpirationTime;
      var hours = et.getHours();
      var mins = et.getMinutes();
      hours = hours < 10 ? '0' + hours : hours;
      mins = mins < 10 ? '0' + mins : mins;
      var time = hours + ':' + mins;
      timer = (<span>Varauksesi on voimassa klo {time} asti</span>);
    }

    var divClass = 'shopping-stage shopping-cart';
    if (!this.props.active) {
      divClass += ' disabled';
    }

    var error = this.props.error ? <div className='alert alert-danger'>{this.props.error}</div> : null;

    return (
      <div className={divClass}>
        <h2>Paikkojen varaus <small>3/5</small></h2>
        {error}
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
