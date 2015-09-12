var React = require('react');

var Seat = React.createClass({

  img_free: "/public/img/seats/"+"seat_free.gif",
  img_reserved: "/public/img/seats/"+"seat_reserved.gif",
  img_chosen: "/public/img/seats/"+"seat_chosen.gif",

  render: function () {

    var url;
    var text;
    var onClick = this.props.onClick;

    if(this.props.status === "reserved") {
      url = this.img_reserved;
      onClick = null;
      text = "This seat has been reserved.";
    } else if(this.props.status === "chosen") {
      url = this.img_chosen;
    } else {
      url = this.img_free;
      text = "Row: " + this.props.seat.row + "\nNumber: " + this.props.seat.number;
    }

    return (
      <img src={url}
        key={this.props.seat.id}
        data-id={this.props.seat.id}
        style={{
          position: "absolute",
          top: parseInt(this.props.seat.y) - 35, // TODO fix the offset in DB - this is Aleksanteri-specific
          left: parseInt(this.props.seat.x) - 12 // TODO fix the offset in DB - this is Aleksanteri-specific
        }}
        title={text}
        onClick={onClick} />
    );
  }

});

module.exports = Seat;
