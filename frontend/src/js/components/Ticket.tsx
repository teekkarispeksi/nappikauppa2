import {Section} from "../models/section";
'use strict';

import React = require('react');
import Props = __React.Props;
import Bootstrap = require('react-bootstrap');
import _ = require('underscore');

import TicketModel from "../models/ticket";
import {DiscountGroup} from "../models/discountGroup";

export interface ITicketProps extends Props<any> {
  active: boolean;
  conflict: boolean;
  ticket: TicketModel;

  onDiscountSelect: Function;
  onRemove: Function;
}

export default class Ticket extends React.Component<ITicketProps, any> {

  onChange(event) {
    this.props.onDiscountSelect(event.target.value);
  }

  render() {
    var seat = this.props.ticket.get('seat');
    var section = this.props.ticket.get('section');
    var conflict = this.props.conflict;
    var remove = this.props.active ? (
      <Bootstrap.Button bsStyle='link' className='removeSeat' onClick={this.props.onRemove.bind(null, seat.id, section.id)}>
      <Bootstrap.Glyphicon glyph='remove' /></Bootstrap.Button>) : null;
    var disabled = !this.props.active || conflict;
    var divClass = 'ticket' + (conflict ? ' alert alert-danger' : '');

    return (
      <li key={seat.id}>
        <div className={divClass}>
          <div className='info'>{section.section_title}, {section.row_name} {seat.row}, paikka {seat.number}</div>
          <Bootstrap.Input type='select' className='discountGroupSelect' standalone disabled={disabled} onChange={this.onChange.bind(this)} value={this.props.ticket.get('discount_group')}>
            {_.map(this.props.ticket.get('discount_groups'), (group: DiscountGroup) => {
              return (<option key={group.id} value={group.id}>{group.title} à {group.price}€</option>);
            })}
          </Bootstrap.Input>
          {remove}
        </div>
      </li>
    );
  }

}
