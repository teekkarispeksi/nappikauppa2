'use strict';

var React = require('react');
var Button = require('react-bootstrap/lib/Button');
var Glyphicon = require('react-bootstrap/lib/Glyphicon');
var Input = require('react-bootstrap/lib/Input');
var _ = require('underscore');

var Ticket = React.createClass({

  onChange: function(event) {
    this.props.onDiscountSelect(event.target.value);
  },

  render: function() {
    var seat = this.props.ticket.get('seat');
    var section = this.props.ticket.get('section');
    var conflict = seat.status === 'conflict';
    var remove = this.props.active ? (<Button bsStyle='link' className='removeSeat' onClick={this.props.onRemove.bind(null, seat.id, section.id)}><Glyphicon glyph='remove' /></Button>) : null;
    var disabled = !this.props.active || conflict;
    var divClass = 'ticket' + (conflict ? ' alert alert-danger' : '');
    return (
      <li key={seat.id}>
        <div className={divClass}>
          <div className='info'>{section.section_title}, {section.row_name} {seat.row}, paikka {seat.number}</div>
          <Input type='select' className='discountGroupSelect' standalone disabled={disabled} onChange={this.onChange} value={this.props.ticket.get('discount_group')}>
            {_.map(this.props.ticket.get('discount_groups'), function(group) {
              return (<option key={group.id} value={group.id}>{group.title} à {group.price}€</option>);
            })}
          </Input>
          {remove}
        </div>
      </li>
    );
  }

});

module.exports = Ticket;
