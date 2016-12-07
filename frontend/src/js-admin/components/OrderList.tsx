'use strict';

import React = require('react');
import $ = require('jquery');
import _ = require('underscore');
import Bootstrap = require('react-bootstrap');
import Moment = require('moment-timezone');

import {IAdminOrderListItem} from '../../../../backend/src/order';
import {IShow} from '../../../../backend/src/show';

export interface IOrderListProps {
  show_id?: number;
}

export interface IOrderListState {
  orders?: IAdminOrderListItem[];
  show?: IShow;
}

export default class OrderList extends React.Component<IOrderListProps, IOrderListState> {
  constructor() {
    super();
    this.state = {
      orders: [],
      show: null
    };
  }

  componentWillMount() {
    var data = this.props.show_id ? {show_id: this.props.show_id} : null;
    $.getJSON('admin-api/orders/', data, (resp: IAdminOrderListItem[]) => {
      this.setState({orders: resp});
    });
    $.getJSON('api/shows/' + this.props.show_id, (resp: IShow) => {
      this.setState({show: resp});
    });
  }

  checkStatus(order: IAdminOrderListItem) {
    $.getJSON('admin-api/orders/' + order.id + '/checkAndUpdateStatus', (resp) => {
      window.alert('Tilauksen tila: ' + resp.status);
      $.getJSON('admin-api/orders/', this.props.show_id ? {show_id: this.props.show_id} : null, (resp2: IAdminOrderListItem[]) => {
        this.setState({orders: resp2});
      });
    });
  }

  render() {
    return (
      <div>
        <h2>
          {this.state.show ? 'Tilaukset - ' + Moment.tz(this.state.show.time, 'Europe/Helsinki').format('D.M.YYYY') + ' ' + this.state.show.title : ''}
        </h2>
        <Bootstrap.Table bordered striped condensed><tbody>
        <tr>
          <th>Nimi</th>
          <th>Ostettu</th>
          <th>Hinta</th>
          <th>Lippuja (käytetty)</th>
          <th>Status</th>
          <th>Edit</th>
          <th>Liput</th>
          <th>Maksulinkki</th>
        </tr>
          {this.state.orders.map((order) => {
            var editLink = <a href={'#orders/' + order.id}>Edit</a> ;
            var ticketLink = order.status === 'paid' ? <a href={'admin-api/orders/' + order.id + '/tickets.pdf'}>Liput</a> : null;
            var paymentLink = order.status === 'payment-pending' ? <a href={order.payment_url}>Maksulinkki</a> : null;
            var checkStatus = order.status === 'payment-pending' ? <Bootstrap.Button onClick={this.checkStatus.bind(this, order)}>Tarkista</Bootstrap.Button> : null;
            var used = order.tickets_count === order.tickets_used_count;
            var className = 'warning';
            if (used) {
              className = 'success';
            } else if (order.status === 'paid') {
              className = '';
            }
            return (<tr key={order.id} className={className}>
              <td>{order.name}</td>
              <td>{order.time}</td>
              <td>{order.price}</td>
              <td>{order.tickets_count} ({order.tickets_used_count})</td>
              <td>{order.status} {checkStatus}</td>
              <td>{editLink}</td>
              <td>{ticketLink}</td>
              <td>{paymentLink}</td>
            </tr>);
          })}
        </tbody></Bootstrap.Table>
      </div>
    );
  }

}
