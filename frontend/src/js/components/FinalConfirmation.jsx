'use strict';

var React = require('react');

var FinalConfirmation = React.createClass({

  render: function() {
    return (
      <div className='shopping-stage final-confirmation'>
        Tähän taulukko:<br />
        Lippuja x kpl, yhteensä y eur<br />
        Mahdollinen alennuskoodi -z eur<br />
        Yhteensä xxx eur<br /><br />

        <a id='proceedToPayment' onClick={this.props.onProceedToPayment}>Siirry maksamaan</a>
      </div>
    );
  }

});

module.exports = FinalConfirmation;
