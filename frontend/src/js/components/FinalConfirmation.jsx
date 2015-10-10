'use strict';

var React = require('react');
var _ = require('underscore');

var FinalConfirmation = React.createClass({

  render: function() {
    var numTickets = this.props.order.get('tickets').length;
    var finalPrice = this.props.order.get('order_price');
    var discountCode = this.props.order.get('discount_code');
    var ticketTotal = finalPrice;
    var discountedTotalEl = null;
    if (discountCode) {
      ticketTotal = _.reduce(this.props.order.get('tickets'), function(memo, ticket) {
        return memo + parseFloat(ticket.ticket_price);
      }, 0);
      discountedTotalEl = (
        <span>
          Alennuskoodi {discountCode}: {ticketTotal - finalPrice} eur<br />
          Yhteensä {finalPrice} eur<br />
        </span>
      );

    }
    return (
      <div className='shopping-stage final-confirmation'>
        Tähän taulukko:<br />
        Lippuja {numTickets} kpl, yhteensä {ticketTotal} eur<br />
        {discountedTotalEl}
        <a id='proceedToPayment' onClick={this.props.paymentBegun ? null : this.props.onProceedToPayment}>Siirry maksamaan</a>
      </div>
    );
  }

});

module.exports = FinalConfirmation;
