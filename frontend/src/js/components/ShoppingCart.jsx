var React = require('react');

var ShoppingCart = React.createClass({

  render: function () {
    var tickets = this.props.tickets;
    if(!tickets) return (
      <div className="shopping-stage shopping-cart"></div>
    );

    var reserveTicketsButton;
    if(this.props.active) {
      reserveTicketsButton = (<a id="reserveTickets" onClick={this.props.onReserveTickets}>Varaa liput</a>);
    }

    return (
      <div className="shopping-stage shopping-cart">
        <ul>
          {tickets.map(function(ticket) {
            console.log(ticket);
            return <li key={ticket.get("seat").id}>{ticket.get("seat").section_title}, {ticket.get("seat").row_name} {ticket.get("seat").row}, paikka {ticket.get("seat").number}</li>;
          }.bind(this))}
        </ul>
        {reserveTicketsButton}
      </div>
    );
  }

});

module.exports = ShoppingCart;
