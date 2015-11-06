'use strict';

var React = require('react');
var _ = require('underscore');

String.prototype.toTitleCase = function() {
  return this[0].toUpperCase() + this.substr(1);
};

var Seat = React.createClass({

  render: function() {

    var text;
    var url;
    var onClick = this.props.onClick;

    var prices = _.pluck(this.props.seat.prices, 'price').join('/');
    if (this.props.status === 'reserved' || this.props.status === 'conflict') {
      url = this.img_reserved;
      onClick = null;
      text = 'Tämä paikka on valitettavasti jo varattu.';
    } else if (this.props.status === 'chosen') {
      url = this.img_chosen;
    } else {
      url = this.img_free;
      text = this.props.seat.row_name.toTitleCase() + ' ' + this.props.seat.row + '\nPaikka ' + this.props.seat.number + '\nHinta ' + prices + ' eur';
    }

    return (
      <a onClick={onClick}
        className={'seat seat-' + this.props.status + ' price-' + this.props.priceGroup}
        key={this.props.seat.id}
        data-id={this.props.seat.id}
        style={{
          top: parseInt(this.props.seat.y),
          left: parseInt(this.props.seat.x)
        }}
        title={text}>
      </a>
    );
  }

});

module.exports = Seat;
