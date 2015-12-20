'use strict';

var React = require('react');
var Backbone = require('backbone');
Backbone.emulateHTTP = true; // PATCH's don't work with our mod_rewrites
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
        var hasConflictingSeats = false;
        this.seats = _.chain(this.venue.get('sections'))
                    .values()
                    .map(function(section) {
                      return _.chain(section.seats)
                              .values()
                              .map(function(seat) {
                                return {
                                  id: seat.seat_id,
                                  status: seat.is_bad ? 'bad' : 'free'
                                };
                              })
                              .value();
                    })
                    .flatten()
                    .indexBy(function(seat) { return seat.id;})
                    .value();
        mySeats.forEach(function(id) {
          this.seats[id].status = 'chosen';
        }.bind(this));
        response.reserved_seats.forEach(function(id) {
          if (this.seats[id].status === 'chosen') {
            this.seats[id].status = 'conflict';
            hasConflictingSeats = true;
          } else {
            this.seats[id].status = 'reserved';
          }
        }.bind(this));

        if (hasConflictingSeats) {
          this.setState({reservationError: 'Osa valitsemistasi paikoista on valitettavasti jo ehditty varata.'});
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

  onSeatClicked: function(seat_id, section_id) {
    this.setState({
      page: 'seats',
      reservationHasExpired: false,
      reservationError: null
    });
    if (this.seats[seat_id].status === 'chosen' || this.seats[seat_id] === 'conflict') {
      this.unselectSeat(seat_id);
    } else {
      this.selectSeat(seat_id, section_id);
    }
    this.updateSeatStatus();
    this.forceUpdate();
  },

  getMySeats: function() {
    if (!this.seats) {
      return [];
    }

    return _.filter(this.seats, function(seat) {
      return seat.status === 'chosen' || seat.status === 'conflict';
    }).map(function(seat) {
      return seat.id;
    });
  },

  selectSeat: function(seat_id, section_id) {
    var section = this.venue.get('sections')[section_id];
    var seat = section.seats[seat_id];
    var discount_groups = this.state.show.get('sections')[section_id].discount_groups;
    this.tickets.add(new Ticket({seat_id: seat_id, seat: seat, section: section, discount_groups: discount_groups,  discount_group_id: DISCOUNT_GROUP_DEFAULT}));
    this.seats[seat_id].status = 'chosen';
  },

  unselectSeat: function(seat_id) {
    var ticket = this.tickets.findWhere({seat_id: seat_id});
    this.removeTicket(ticket);
  },

  removeTicket: function(ticket) {
    this.tickets.remove(ticket);
    this.seats[ticket.get('seat_id')].status = 'free';
  },

  onReserveTickets: function() {
    Backbone.sync('create', this.tickets,
      {url: 'api/shows/' + this.state.showid + '/reserveSeats/',
        success: function(response) {
          this.order = new Order({id: response.order_id, hash: response.order_hash});
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
    this.order.save({id: this.order.id, hash: this.order.get('hash'), name: info.name, email: info.email, discount_code: info.discount_code}, {
      patch: true, // Backbone.emulateHTTP is set to 'true' to make this still a POST request
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
      var order_id = this.props.args[0];
      var order_hash = this.props.args[1];
      result = (
        <div className='alert alert-success'><p>Tilaus onnistui!</p>
          <p>Lähetimme liput sähköpostitse.
          Voit myös <a className='alert-link' href={'api/orders/' + order_id + '/' + order_hash + '/tickets'}>ladata liput tästä.</a></p>
        </div>
      );
    } else if (this.props.action === 'fail') {
      result = (<div className='alert alert-warning'>Keskeytit tilauksesi ja varaamasi paikat on vapautettu myyntiin.</div>);
    }

    return (<div className='shopping-stage help-text'>
      {result}
      <h2>Tervetuloa katsomaan NääsPeksin Helsingin-näytöstä!</h2>
      <p>Näytös järjestetään Aleksanterin teatterissa, Albertinkatu 32. Teatteri perii eteispalvelumaksun.</p>
      <p>Lipunmyynti sulkeutuu 23.11. klo 04:00. Mikäli lippuja on tällöin vielä jäljellä, niitä saa ostaa teatterin
        ovelta tuntia ennen näytöstä, niin kauan kuin niitä on jäljellä.</p>
      <p>Mikäli koet ongelmia lippukaupan toiminnassa, voit ottaa yhteyttä lipunmyyntivastaavaan osoitteessa liput@teekkarispeksi.fi.</p>
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
        seatSelectorElem = <SeatSelector active={this.state.page === 'seats'} onSeatClicked={this.onSeatClicked} show={this.state.show} venue={this.venue} seats={this.seats} />;
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
