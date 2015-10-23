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
    var remove = this.props.active ? (<Button bsStyle='link' className='removeSeat' onClick={this.props.onRemove.bind(null, seat)}><Glyphicon glyph='remove' /></Button>) : null;
    return (
      <li key={seat.id}><div>{seat.section_title}, {seat.row_name} {seat.row}, paikka {seat.number}
        {remove}
        <Input type='select' className='discountGroupSelect' standalone disabled={!this.props.active} onChange={this.onChange} value={this.props.ticket.get('discount_group')}>
          {_.map(seat.prices, function(group) {
            return (<option key={group.id} value={group.id}>{group.title} à {group.price}€</option>);
          })}
        </Input>
        </div>
      </li>
    );
  }

});

module.exports = Ticket;
