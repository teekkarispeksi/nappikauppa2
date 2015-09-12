var React = require('react');

var Router = require('../router.js');
var Seat = require('./Seat.jsx');

var seats = [
  {id: 1, sectionTitle: 'Permanto', row: '1', seatNumber: '1', selected: false},
  {id: 2, sectionTitle: 'Permanto', row: '1', seatNumber: '2', selected: false},
  {id: 3, sectionTitle: 'Permanto', row: '1', seatNumber: '3', selected: false}]; // test data

var SeatSelector = React.createClass({

  seatSelected: function (seat) {
    seat.selected = !seat.selected;
    this.props.onSeatSelected(seats);
    this.forceUpdate();
  },

  render: function () {
    if(!this.props.show) return (
      <div className="shopping-stage seat-selector"></div>
    );

    else return (
      <div className="shopping-stage seat-selector">
        <h4>Valitse tästä paikkasi näytökseen <strong>{this.props.show.get('title')}</strong>!</h4>
        <div>
          {seats.map(function(seat) {
            return (<Seat seat={seat} onSelected={this.seatSelected.bind(null, seat)} />);
          }.bind(this))}
        </div>
      </div>
    );
  }

});

module.exports = SeatSelector;
