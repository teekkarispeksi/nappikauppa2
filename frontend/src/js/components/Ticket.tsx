'use strict';

import React = require('react');
import Props = __React.Props;
import Bootstrap = require('react-bootstrap');
import _ = require('underscore');

import {IDiscountGroup} from '../../../../backend/src/discountGroup';
import {ITicket} from './Store';

export interface ITicketProps extends Props<any> {
  active: boolean;
  conflict: boolean;
  ticket: ITicket;
  onDiscountSelect: Function;
  onRemove: Function;
}

export default class Ticket extends React.Component<ITicketProps, any> {

  onChange(event) {
    this.props.onDiscountSelect(event.target.value);
  }

  render() {
    var seat = this.props.ticket.seat;
    var section = this.props.ticket.section;
    var conflict = this.props.conflict;
    var remove = this.props.active ? (
      <Bootstrap.Button bsStyle='link' className='removeSeat' onClick={this.props.onRemove.bind(null, seat.id, section.id)}>
      <Bootstrap.Glyphicon glyph='remove' /></Bootstrap.Button>) : null;
    var disabled = !this.props.active || conflict;
    var divClass = 'ticket' + (conflict ? ' alert alert-danger' : '');
    var info = section.row_name ? section.section_title + ', ' + section.row_name + ' ' + seat.row + ', paikka ' + seat.number : section.section_title; // for numbered or un-numbered

    return (
      <li key={seat.id}>
        <div className={divClass}>
          <div className='info'>{info}</div>
          <Bootstrap.Input type='select' className='discountGroupSelect' standalone disabled={disabled} onChange={this.onChange.bind(this)} value={this.props.ticket.discount_group_id}>
            {_.map(this.props.ticket.discount_groups, (group: IDiscountGroup) => {
              var price = Math.max(0, this.props.ticket.price - group.discount);
              return (<option key={group.id} value={group.id.toString()}>{group.title} à {price}€</option>);
            })}
          </Bootstrap.Input>
          {remove}
        </div>
      </li>
    );
  }

}
