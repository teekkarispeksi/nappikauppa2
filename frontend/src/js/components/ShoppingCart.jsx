'use strict';

var React = require('react');

var ShoppingCart = React.createClass({
  timer: null,
  getInitialState: function() {
    return {};
  },

  componentWillReceiveProps: function(newProps) {
    if (newProps.expirationTime) {
      this.setState({timeLeft: new Date(newProps.expirationTime - Date.now())});
      this.startTimer();
    } else {
      clearInterval(this.timer);
      this.setState({timeLeft: null});
    }
  },

  componentWillMount: function() {
    this.componentWillReceiveProps(this.props);
  },

  componentWillUnmount: function() {
    clearInterval(this.timer);
  },

  updateTimer: function() {
    this.setState({timeLeft: new Date(this.props.expirationTime - Date.now())});
  },

  startTimer: function() {
    this.timer = setInterval(this.updateTimer, 1000);
  },

  render: function() {
    var tickets = this.props.tickets;
    if (!tickets) {
      return (
        <div className='shopping-stage shopping-cart'></div>
      );
    }

    var reserveTicketsButton;
    if (this.props.active) {
      reserveTicketsButton = (<a id='reserveTickets' onClick={this.props.onReserveTickets}>Varaa liput</a>);
    }

    var timer;
    if (this.state.timeLeft) {
      var time = this.state.timeLeft;
      timer = (<span>{time.getMinutes()}:{time.getSeconds()}</span>);
    }

    return (
      <div className='shopping-stage shopping-cart'>
        <ul>
          {tickets.map(function(ticket) {
            var seat = ticket.get('seat');
            return (
              <li key={seat.id}>{seat.section_title}, {seat.row_name} {seat.row}, paikka {seat.number}
                <a className='removeSeat' onClick={this.props.onSeatClicked.bind(null, seat)}>[X]</a></li>
            );
          }.bind(this))}
        </ul>
        {reserveTicketsButton}
        {timer}
      </div>
    );
  }

});

module.exports = ShoppingCart;
