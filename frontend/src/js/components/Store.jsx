'use strict';

var React = require('react');
var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');

var ShowSelector = require('./ShowSelector.jsx');
var SeatSelector = require('./SeatSelector.jsx');
var ShoppingCart = require('./ShoppingCart.jsx');
var Contacts = require('./Contacts.jsx');
var FinalConfirmation = require('./FinalConfirmation.jsx');

var Shows = require('../collections/shows.js');
var Tickets = require('../collections/tickets.js');
var Ticket = require('../models/ticket.js');
var Venue = require('../models/venue.js');
var Order = require('../models/order.js');

var Router = require('../router.js');

var DISCOUNT_GROUP_DEFAULT = 1;

var Store = React.createClass({
  shows: new Shows(),
  tickets: new Tickets(),
  order: null,
  venue: null,
  seats: null,

  getInitialState: function() {
    return {page: 'home', showid: this.props.showid, show: null, paymentBegun: false};
  },

  componentWillMount: function() {
    if (this.props.action) {
      // clean the ok/fail hash in the url
      window.history.pushState('', '', window.location.pathname);
    }

    this.shows.fetch({
      success: function(collection, response, options) {
        if (this.state.showid) {
          this.onShowSelect(this.state.showid);
        }

        this.forceUpdate();
      }.bind(this)
    });
  },

  updateSeatStatus: function(showid) {
    $.ajax({
      url: '/api/shows/' + showid + '/reservedSeats',
      success: function(response, status) {
        var sections = _.values(this.venue.get('sections'));
        this.seats = _.flatten(sections.map(function(section) {
          var prices = this.state.show.get('sections')[section.id].discount_groups;
          return _.values(section.seats).map(function(seat) {
            seat.section_id = section.id;
            seat.section_title = section.title;
            seat.row_name = section.row_name;
            seat.prices = prices;
            if (seat.is_bad) {
              seat.status = 'bad';
            } else if (_.indexOf(response.reserved_seats,seat.id) >= 0) {
              seat.status = 'reserved';
            } else {
              seat.status = 'free';
            }
            return seat;
          });
        }.bind(this)));
        this.forceUpdate();
      }.bind(this)
    });
  },

  onShowSelect: function(showid) {
    this.tickets.reset();
    this.order = null;
    this.seats = null;

    var show = this.shows.get(showid);

    if (!this.venue || this.venue.get('id') !== show.get('venue_id')) {
      this.venue = new Venue({id: show.get('venue_id')});
      this.venue.fetch({
        success: function(model, response, options) {
          this.updateSeatStatus(showid);
        }.bind(this)
      });
    } else {
      this.updateSeatStatus(showid);
    }

    this.setState({
      page: 'seats',
      showid: showid,
      show: show
    });
    Router.navigate('show/' + showid, {trigger: false});
  },

  onSeatClicked: function(seat) {
    this.setState({page: 'seats'});
    var ticket = this.tickets.findWhere({seat: seat});
    if (ticket) {
      this.tickets.remove(ticket);
      this.seats[_.indexOf(this.seats, ticket.get('seat'))].status = 'free';
    } else {
      this.tickets.add(new Ticket({seat: seat, discount_group_id: DISCOUNT_GROUP_DEFAULT}));
      this.seats[_.indexOf(this.seats, seat)].status = 'chosen';
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
          console.log('order info saving failed, continuing now anyways'); // TODO
          this.setState({page: 'payment'});
        }.bind(this)
      });
  },

  onProceedToPayment: function() {
    this.setState({paymentBegun: true});
    this.order.preparePayment();
  },

  helpText: function() {
    var result;
    if (this.props.action === 'ok') {
      result = (<div className='result-ok'>Tilaus onnistui! TODO: Tulosta liput tästä.</div>);
    } else if (this.props.action === 'fail') {
      result = (<div className='result-fail'>Tilaus peruttiin onnistuneesti.</div>);
    }

    return (<div className='shopping-stage help-text'>
      {result}
      <h4>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h4>
      Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.
    </div>);
  },

  render: function() {
    var seatSelectorElem, shoppingCartElem, contactsElem, finalConfirmationElem;

    switch (this.state.page) {
      case 'home':
        seatSelectorElem = this.helpText();
        break;

      // No breaks -> fallthrough-magic!
      case 'payment':
        finalConfirmationElem = <FinalConfirmation tickets={this.tickets} paymentBegun={this.state.paymentBegun} onProceedToPayment={this.onProceedToPayment} />;
        /* fall through */
      case 'contacts':
        contactsElem = <Contacts active={this.state.page === 'contacts'} onSaveOrderInfo={this.onSaveOrderInfo} />;
        /* fall through */
      case 'seats':
        seatSelectorElem = <SeatSelector onSeatClicked={this.onSeatClicked} show={this.state.show} seats={this.seats} />;
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
        {finalConfirmationElem}
      </div>
    );
  }

});

module.exports = Store;
