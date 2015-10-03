'use strict';

var React = require('react');
var _ = require('underscore');

var Seat = React.createClass({

  render: function() {

    var text;
    var url;
    var onClick = this.props.onClick;

    var prices = _.values(_.mapObject(this.props.seat.prices, function(price) { return price.price; })).join('/');

    if (this.props.status === 'reserved') {
      url = this.img_reserved;
      onClick = null;
      text = 'This seat has been reserved.';
    } else if (this.props.status === 'chosen') {
      url = this.img_chosen;
    } else {
      url = this.img_free;
      text = 'Row: ' + this.props.seat.row + '\nNumber: ' + this.props.seat.number + '\nHinta: ' + prices;
    }

    return (
      <a onClick={onClick}
        className={'seat seat-' + this.props.status}
        key={this.props.seat.id}
        data-id={this.props.seat.id}
        style={{
          top: parseInt(this.props.seat.y) - 35, // TODO fix the offset in DB - this is Aleksanteri-specific
          left: parseInt(this.props.seat.x) - 12 // TODO fix the offset in DB - this is Aleksanteri-specific
        }}
        title={text}>
      </a>
    );
  }

});

module.exports = Seat;
