'use strict';

import _ = require('underscore');
import React = require('react');
import Bootstrap = require('react-bootstrap');
import Ticket from './Ticket';
import TicketModel from "../models/ticket";

export interface IShoppingCartProps {
  active: boolean;
  conflictingSeatIds: number[];
  error: string;
  reservationHasExpired: boolean;
  reservationExpirationTime: Date;
  tickets: TicketModel[];

  onSeatClicked: Function;
  onReserveTickets: Function;
}

export default class ShoppingCart extends React.Component<IShoppingCartProps, any> {

  onDiscountSelect(ticket, value) {
    ticket.set('discount_group_id', value);
    this.forceUpdate();
  }

  render() {
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

    var reserveTicketsButton = (this.props.active && tickets.length > 0 && !this.props.error) ?
      (<Bootstrap.Button id='reserveTickets' onClick={this.props.onReserveTickets.bind(this)}>Varaa liput</Bootstrap.Button>) : null;

    var timer;
    if (this.props.reservationExpirationTime) {
      var et = this.props.reservationExpirationTime;
      var hours = et.getHours();
      var mins = et.getMinutes();
      var hoursString = hours < 10 ? '0' + hours : hours;
      var minsString = mins < 10 ? '0' + mins : mins;
      var time = hoursString + ':' + minsString;
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
          {tickets.map(function(ticket: TicketModel) {
            return (
              <Ticket
                key={ticket.get('seat_id')}
                ticket={ticket}
                conflict={_.contains(this.props.conflictingSeatIds, ticket.get('seat_id'))}
                active={this.props.active}
                onDiscountSelect={this.onDiscountSelect.bind(this, ticket)}
                onRemove={this.props.onSeatClicked.bind(this)} />
            );
          }.bind(this))}
        </ul>
        {expirationText}
        {reserveTicketsButton}
        {timer}
      </div>
    );
  }

}
