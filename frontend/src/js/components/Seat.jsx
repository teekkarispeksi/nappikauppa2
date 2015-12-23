'use strict';

var React = require('react');
var _ = require('underscore');

String.prototype.toTitleCase = function() {
  return this[0].toUpperCase() + this.substr(1);
};

var Seat = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    // this seems to make things actually faster on Lumia925 + Edge, and does not seem to break anything
    return nextProps.status !== this.props.status;
  },

  render: function() {

    var text;
    var url;
    var onClick = this.props.onClick;

    var prices = this.props.prices.join('/');
    if (this.props.status === 'reserved' || this.props.status === 'conflict') {
      onClick = null;
      text = 'Tämä paikka on valitettavasti jo varattu.';
    } else {
      text = this.props.rowName.toTitleCase() + ' ' + this.props.seat.row + '\nPaikka ' + this.props.seat.number + '\nHinta ' + prices + ' eur';
    }

    return (
      <a onClick={onClick}
        className={'seat seat-' + this.props.status + ' ' + this.props.priceClass}
        key={this.props.seat.id}
        data-id={this.props.seat.id}
        style={{
          top: parseInt(this.props.seat.y_coord),
          left: parseInt(this.props.seat.x_coord)
        }}
        title={text}>
      </a>
    );
  }

});

module.exports = Seat;
