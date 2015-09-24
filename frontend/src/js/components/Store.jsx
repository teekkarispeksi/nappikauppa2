var React = require('react');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');
var ShoppingCart = require('./ShoppingCart.jsx');
var Contacts = require('./Contacts.jsx');

var Shows = require('../collections/shows.js');
var Ticket = require('../models/ticket.js');

var Router = require('../router.js');

var Store = React.createClass({
  shows: new Shows(),

  getInitialState: function () {
    return {page: "home", showid: this.props.showid, show: null, tickets: []};
  },

  componentWillMount: function () {
    this.shows.fetch({
      success: function(collection, response, options) {
        if(this.state.showid) {
          this.setState({page: 'seats', show: this.shows.get(this.state.showid)});
        }

        this.forceUpdate();
      }.bind(this)
    });
  },

  onShowSelect: function (showid) {
    this.setState({
      page: 'seats',
      showid: showid,
      show: this.shows.get(showid),
      tickets: []
    });
    Router.navigate('show/'+showid, {trigger: false});
  },

  onSeatClicked: function (seat) {
    var tickets = this.state.tickets;
    var indx = tickets.indexOf(seat);
    var found = false;
    for(var i = 0; i < tickets.length; ++i) {
      if(tickets[i].get('seat') === seat) {
        tickets.splice(i,1);
        found = true;
        break;
      }
    }
    if(!found) {
      tickets.push(new Ticket({seat: seat}));
    }
    this.setState({tickets: tickets});
  },

  helpText: (<div className="shopping-stage help-text">
    <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
    Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
  </div>),


  render: function () {
    var seatSelectorElem, shoppingCartElem, contactsElem;

    if(this.state.page == 'home') {
      seatSelectorElem = this.helpText;
    } else if(this.state.page == 'seats') {
      // for now everything is displayed when a show is selected - maybe be more gradual?
      seats = this.state.tickets.map(function(ticket) { return ticket.get("seat"); });
      seatSelectorElem = <SeatSelector onSeatClicked={this.onSeatClicked} show={this.state.show} selectedSeats={seats} />;
      shoppingCartElem = <ShoppingCart tickets={this.state.tickets} />;
      contactsElem = <Contacts />;
    }

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect} shows={this.shows} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
      </div>
    );
  }

});

module.exports = Store;
