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

// TODO: get this from backend, as it should match as closely as possible to backend's timer
var EXPIRATION_IN_MINUTES = 15;
var DISCOUNT_GROUP_DEFAULT = 1;

var scrollToElem = function(elemstr) {
  $('html, body').animate({
    scrollTop: $(elemstr)[0].offsetTop
  });
};

var Store = React.createClass({
  shows: new Shows(),
  tickets: new Tickets(),
  order: null,
  venue: null,
  seats: null,

  getInitialState: function() {
    return {
      page: 'home',
      showid: this.props.showid,
      show: null,
      paymentBegun: false,
      reservationError: null
    };
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

  componentWillUnmount: function() {
    clearTimeout(this.timer);
  },

  onTimeout: function() {
    this.setState({page: 'seats', reservationExpirationTime: null, reservationHasExpired: true});
  },

  startTimer: function() {
    this.timer = setTimeout(this.onTimeout, EXPIRATION_IN_MINUTES * 60 * 1000);
    this.setState({reservationExpirationTime: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000), reservationHasExpired: false});
  },

  updateSeatStatus: function(showid) {
    if (showid === undefined) {
      showid = this.state.showid;
    }

    var mySeats = this.getMySeats();

    $.ajax({
      url: 'api/shows/' + showid + '/reservedSeats',
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
            } else if (_.contains(response.reserved_seats, seat.id)) {
              seat.status = 'reserved';
            } else if (_.contains(mySeats, seat.id)) {
              seat.status = 'chosen';
            } else {
              seat.status = 'free';
            }
            return seat;
          });
        }.bind(this)));

        var conflictSeats = _.difference(mySeats, this.getMySeats());
        if (conflictSeats.length > 0) {
          this.setState({reservationError: 'Valitsemasi paikka on jo ehditty varata.'});

          for (var i = 0; i < conflictSeats.length; i++) {
            this.unselectSeat(this.getSeatById(conflictSeats[i]));
          }
          this.updateSeatStatus();
        }
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
      show: show,
      reservationExpirationTime: null,
      reservationHasExpired: null
    });
    Router.navigate('show/' + showid, {trigger: false});
    setTimeout(function() {
      scrollToElem('.seat-selector');
    }, 100);
  },

  onSeatClicked: function(seat) {
    this.setState({
      page: 'seats',
      reservationHasExpired: false,
      reservationError: null
    });
    var ticket = this.tickets.findWhere({seat: seat});
    if (ticket) {
      this.removeTicket(ticket);
    } else {
      this.selectSeat(seat);
    }
    this.forceUpdate();
  },

  getMySeats: function() {
    if (!this.seats) {
      return [];
    }

    return this.seats.filter(function(seat) {
      return seat.status === 'chosen';
    }).map(function(seat) {
      return seat.id;
    });
  },

  getSeatById: function(id) {
    return _.findWhere(this.seats, {id: id});
  },

  selectSeat: function(seat) {
    this.tickets.add(new Ticket({seat: seat, discount_group_id: DISCOUNT_GROUP_DEFAULT}));
    this.seats[_.indexOf(this.seats, seat)].status = 'chosen';
  },

  unselectSeat: function(seat) {
    var ticket = this.tickets.findWhere({seat: seat});
    this.removeTicket(ticket);
  },

  removeTicket: function(ticket) {
    this.tickets.remove(ticket);
    this.seats[_.indexOf(this.seats, ticket.get('seat'))].status = 'free';
  },

  onReserveTickets: function() {
    Backbone.sync('create', this.tickets,
      {url: 'api/shows/' + this.state.showid + '/reserveSeats/',
        success: function(response) {
          this.order = new Order({id: response.order_id});
          this.startTimer();
          this.setState({page: 'contacts'});
          setTimeout(function() {
            scrollToElem('.contact-input');
          }, 0);
        }.bind(this),
        error: function(model, response) {
          this.updateSeatStatus();
          this.forceUpdate();
        }.bind(this)
      });
  },

  onSaveOrderInfo: function(info) {
    // backend assumes id is also an attribute
    this.order.save({id: this.order.id, name: info.name, email: info.email, discount_code: info.discount_code}, {
      patch: true,
      success: function(response) {
        this.setState({page: 'payment'});
        setTimeout(function() {
          scrollToElem('.final-confirmation');
        }, 0);
      }.bind(this),
      error: function(response) {
        console.log('order info saving failed'); // TODO
      }.bind(this)
    });
  },

  onProceedToPayment: function() {
    clearTimeout(this.timer);
    this.setState({paymentBegun: true, reservationExpirationTime: null});

    $.post(this.order.urlRoot + '/' + this.order.get('id') + '/preparePayment',
      function(res) {
        if (res.err) {
          this.setState({page: 'seats', paymentBegun: false});
        } else {
          if (res.url[0] === '#') { // when skipping Paytrail
            this.replaceState(this.getInitialState());
          }
          window.location.href = res.url;
        }
      }.bind(this));
  },

  helpText: function() {
    var result;
    if (this.props.action === 'ok') {
      result = (<div className='alert alert-success'>Tilaus onnistui! TODO: Tulosta liput tästä.</div>);
    } else if (this.props.action === 'fail') {
      result = (<div className='alert alert-warning'>Tilaus peruttiin onnistuneesti.</div>);
    }

    return (<div className='shopping-stage help-text'>
      {result}
      <h2>Tervetuloa katsomaan Suomen suurinta opiskelijamusikaalia!</h2>
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
        finalConfirmationElem = <FinalConfirmation order={this.order} paymentBegun={this.state.paymentBegun} onProceedToPayment={this.onProceedToPayment} />;
        /* fall through */
      case 'contacts':
        contactsElem = <Contacts active={this.state.page === 'contacts'} onSaveOrderInfo={this.onSaveOrderInfo} />;
        /* fall through */
      case 'seats':
        seatSelectorElem = <SeatSelector active={this.state.page === 'seats'} onSeatClicked={this.onSeatClicked} show={this.state.show} seats={this.seats} />;
        if (this.tickets.length > 0 || this.state.reservationError) {
          shoppingCartElem = (<ShoppingCart
            tickets={this.tickets}
            active={this.state.page === 'seats'}
            reservationExpirationTime={this.state.reservationExpirationTime}
            reservationHasExpired={this.state.reservationHasExpired}
            onReserveTickets={this.onReserveTickets}
            onSeatClicked={this.onSeatClicked}
            error={this.state.reservationError} />);
        }
    }

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect} shows={this.shows} selectedShow={this.state.show} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
        {finalConfirmationElem}
      </div>
    );
  }

});

module.exports = Store;
