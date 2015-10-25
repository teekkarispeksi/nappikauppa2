'use strict';

var React = require('react');
var Button = require('react-bootstrap/lib/Button');
var _ = require('underscore');

var FinalConfirmation = React.createClass({

  render: function() {
    var numTickets = this.props.order.get('tickets').length;
    var finalPrice = this.props.order.get('order_price');
    var discountCode = this.props.order.get('discount_code');
    var ticketTotal = this.props.order.get('tickets_total_price');
    var discountedTotalEl = null;
    if (discountCode) {
      discountedTotalEl = (
        <span>
          Alennuskoodi {discountCode}: {ticketTotal - finalPrice} eur<br />
          Yhteensä {finalPrice} eur<br />
        </span>
      );

    }
    var active = !this.props.paymentBegun;
    return (

      <div className='shopping-stage final-confirmation'>
        <h2>Vahvistus <small>5/5</small></h2>
        Tähän taulukko:<br />
        Lippuja {numTickets} kpl, yhteensä {ticketTotal} eur<br />
        {discountedTotalEl}
        <Button id='proceedToPayment' disabled={!active} onClick={active ? this.props.onProceedToPayment : null}>
          {active ? 'Siirry maksamaan' : 'Siirrytään maksupalveluun'}
        </Button>
      </div>
    );
  }

});

module.exports = FinalConfirmation;
