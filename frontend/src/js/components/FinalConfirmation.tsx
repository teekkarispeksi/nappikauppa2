'use strict';

import React = require('react');
import Button from './Button';
import {IOrder} from '../../../../backend/src/order';


export interface IFinalConfirmationProps {
  canCancel: boolean;
  order: IOrder;
  paymentBegun: boolean;

  onCancel: React.EventHandler<React.MouseEvent<any>>;
  onProceedToPayment: React.EventHandler<React.MouseEvent<any>>;
}

export default class FinalConfirmation extends React.Component<IFinalConfirmationProps, any> {

  render() {
    if (!this.props.order) {
      return (<div />);
    }
    var numTickets = this.props.order.tickets.length;
    var finalPrice = this.props.order.order_price;
    var discountCode = this.props.order.discount_code;
    var ticketTotal = this.props.order.tickets_total_price;
    var discountedTotalEl: React.ReactElement<any> = null;
    if (discountCode) {
      discountedTotalEl = (
        <tr>
          <td>Alennuskoodi {discountCode}</td>
          <td>-{ticketTotal - finalPrice} eur</td>
        </tr>
      );

    }
    var active = !this.props.paymentBegun;
    return (
      <div className='shopping-stage final-confirmation'>
        <h2>Vahvistus <small>5/5</small></h2>
        <table className='table table-bordered'>
        <tbody>
          <tr>
            <td>Pääsylippu, {numTickets} kpl</td>
            <td>{ticketTotal} eur</td>
          </tr>
          {discountedTotalEl}
          <tr>
            <td>Yhteensä</td>
            <td>{finalPrice} eur</td>
          </tr>
        </tbody>
        </table>

        <Button id='proceedToPayment' disabled={!active} onClick={this.props.onProceedToPayment}>
          {active ? 'Siirry maksamaan' : 'Siirrytään maksupalveluun'}
        </Button>
        <Button id='cancel' disabled={!(active && this.props.canCancel)} onClick={this.props.onCancel}>Peru</Button>
      </div>
    );
  }

}
