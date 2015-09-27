'use strict';

var React = require('react');
var Backbone = require('backbone');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');
var ShoppingCart = require('./ShoppingCart.jsx');
var Contacts = require('./Contacts.jsx');

var Shows = require('../collections/shows.js');
var Tickets = require('../collections/tickets.js');
var Ticket = require('../models/ticket.js');
var Order = require('../models/order.js');

var Router = require('../router.js');

var Store = React.createClass({
  shows: new Shows(),
  tickets: new Tickets(),
  order: null,

  getInitialState: function() {
    return {page: 'home', showid: this.props.showid, show: null};
  },

  componentWillMount: function() {
    this.shows.fetch({
      success: function(collection, response, options) {
        if (this.state.showid) {
          this.setState({page: 'seats', show: this.shows.get(this.state.showid)});
        }

        this.forceUpdate();
      }.bind(this)
    });
  },

  onShowSelect: function(showid) {
    this.tickets.reset();
    this.order = null;
    this.setState({
      page: 'seats',
      showid: showid,
      show: this.shows.get(showid)
    });
    Router.navigate('show/' + showid, {trigger: false});
  },

  onSeatClicked: function(seat) {
    this.setState({page: 'seats'});
    var ticket = this.tickets.findWhere({seat: seat});
    if (ticket) {
      this.tickets.remove(ticket);
    } else {
      this.tickets.add(new Ticket({seat: seat}));
    }
    this.forceUpdate();
  },

  onReserveTickets: function() {
    Backbone.sync('create', this.tickets,
      {url: '/api/shows/' + this.state.showid + '/reserveSeats/',
        success: function(response) {
          this.order = new Order({id: response.order_id});
          this.setState({page: 'contacts'}); // setState also forces update
        }.bind(this),
        error: function(model, response) {
          console.log('seat reservation failed');
        }
      });
  },

  onSaveOrderInfo: function(info) {
    this.order.set('name', info.name);
    this.order.set('email', info.email);
    this.order.set('discount_code', info.discount_code);

    Backbone.sync('patch', this.order,
      {
        success: function(response) {
          this.setState({page: 'payment'});
        }.bind(this),
        error: function(response) {
          console.log('order info saving failed, continuing now anyways');
          this.setState({page: 'payment'});
        }.bind(this)
      });
  },

  helpText: (<div className='shopping-stage help-text'>
    <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
    Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
  </div>),

  render: function() {
    var seatSelectorElem, shoppingCartElem, contactsElem;

    switch (this.state.page) {
      case 'home':
        seatSelectorElem = this.helpText;
        break;

      // No breaks -> fallthrough-magic!
      case 'payment': // TODO
        /* fall through */
      case 'contacts':
        contactsElem = <Contacts active={this.state.page === 'contacts'} onSaveOrderInfo={this.onSaveOrderInfo} />;
        /* fall through */
      case 'seats':
        var seats = this.tickets.map(function(ticket) { return ticket.get('seat'); });
        seatSelectorElem = <SeatSelector onSeatClicked={this.onSeatClicked} show={this.state.show} selectedSeats={seats} />;
        if (this.tickets.length > 0) {
          shoppingCartElem = <ShoppingCart tickets={this.tickets} active={this.state.page === 'seats'} onReserveTickets={this.onReserveTickets}
            onSeatClicked={this.onSeatClicked} />;
        }
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
