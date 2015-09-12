var React = require('react');

var ShoppingCart = React.createClass({

  render: function () {
    if(!this.props.selectedSeats) return (
      <div className="shopping-stage shopping-cart"></div>
    );

    return (
      <div className="shopping-stage shopping-cart">
        <ul>
          {this.props.selectedSeats.map(function(seat) {
            console.log(seat);
            return <li key={seat.id}>{seat.sectionTitle}, rivi {seat.row}, paikka {seat.seatNumber}</li>;
          }.bind(this))}
        </ul>
      </div>
    );
  }

});

module.exports = ShoppingCart;
