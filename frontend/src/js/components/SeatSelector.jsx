var React = require('react');

var Router = require('../router.js');

var seats = [{id: 1, selected: false}, {id: 2, selected: false}, {id: 3, selected: false}]; // test data

var SeatSelector = React.createClass({

  seatSelected: function (seat) {
    seat.selected = !seat.selected;
    this.forceUpdate();
  },

  render: function () {
    return (
      <div>
        <h4>Valitse tästä paikkasi näytökseen <strong>{this.props.show.get('title')}</strong>!</h4>
        <div>
          {seats.map(function(seat) {
            return <span key={seat.id}><label>Paikka {seat.id}</label><input type="checkbox" checked={seat.selected} onChange={this.seatSelected.bind(null, seat)} /></span>;
          }.bind(this))}
        </div>
        <span><a onClick={this.props.onSeatsSelected.bind(null, seats)}>Valmis</a></span>
      </div>
    );
  }

});

module.exports = SeatSelector;
