var React = require('react');

var Seat = React.createClass({

  selected: function() {
    console.log('seleced',this);
  },

  render: function () {
    return (
      <div>
        <a key={this.props.seat.id} 
          data-id={this.props.seat.id} 
          onClick={this.props.onSelected}
          className={"seat " + (this.props.seat.selected ? 'selected' : 'available')}>
            Paikka {this.props.seat.id}
          </a>
        <br />
      </div>
    );
  }

});

module.exports = Seat;
