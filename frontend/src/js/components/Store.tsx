'use strict';

import React = require('react');
import Backbone = require('backbone');
Backbone.emulateHTTP = true; // PATCH's don't work with our mod_rewrites
import $ = require('jquery');
import _ = require('underscore');
import Marked = require('marked');
import Moment = require('moment-timezone');
import Bootstrap = require('react-bootstrap');
import GA = require('react-ga');

import ShowSelector from './ShowSelector';
import SeatSelector from './SeatSelector'; // for numbered seats
import TicketCountSelector from './TicketCountSelector'; // for non-numbered seats
import ShoppingCart from './ShoppingCart';
import Contacts from './Contacts';
import FinalConfirmation from './FinalConfirmation';

import {IOrder} from '../../../../backend/src/order';
import {IProduction} from '../../../../backend/src/production';
import {IShow, IReservedSeats} from '../../../../backend/src/show';
import {IDiscountGroup} from '../../../../backend/src/discountGroup';
import {IVenue, ISection, ISeat} from '../../../../backend/src/venue';

import Router = require('../router');

// TODO: get this from backend, as it should match as closely as possible to backend's timer
const EXPIRATION_IN_MINUTES = 15;
const DISCOUNT_GROUP_DEFAULT = 1;

var scrollToElem = function(elemstr) {
  $('html, body').animate({
    scrollTop: $(elemstr)[0].offsetTop
  });
};

export interface ITicket {
  seat: ISeat;
  section: ISection;
  price: number;
  discount_groups: IDiscountGroup[];
  discount_group_id: number;
}

export interface IStoreProps {
  action?: string;
  showid?: number;
  args?: string[];
}

export interface IStoreState {
  auth?: string; // authenticated user
  page?: string;
  show?: IShow;
  paymentBegun?: boolean;
  reservationError?: string;
  conflictingSeatIds?: number[];
  chosenSeatIds?: number[];
  reservedSeatIds?: number[];
  reservationExpirationTime?: Date;
}

export default class Store extends React.Component<IStoreProps, IStoreState> {
  production: IProduction;
  shows: IShow[];
  tickets: ITicket[];
  order: IOrder;
  venue: IVenue;
  timer: any;

  constructor(props: IStoreProps) {
    super();

    this.shows = [];
    this.tickets = [];
    this.production = null;

    this.state = this._getInitialState(props);
  }

  private _getInitialState(props: IStoreProps) {
    return {
      page: 'home',
      show: null,
      paymentBegun: false,
      reservationError: null,
      conflictingSeatIds: [],
      chosenSeatIds: [],
      reservedSeatIds: []
    };
  }

  componentWillMount() {
    if (this.props.action) {
      // clean the ok/fail hash in the url
      window.history.pushState('', '', window.location.pathname);
    }

    $.getJSON('api/productions/latest', (resp: IProduction) => {
      this.production = resp;
      this.forceUpdate();

      $.getJSON('api/shows', {production_id: this.production.id}, (resp2: IShow[]) => {
        this.shows = resp2;
        if (this.props.showid) {
          this.onShowSelect(this.props.showid);
        }
        this.forceUpdate();
      });
    });

    $.get('api/auth', (resp: string) => {
      if (resp) {
        this.setState({auth: resp});
      }
    });
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  onTimeout() {
    this.setState({page: 'seats', reservationError: 'Varauksesi on rauennut.'});
  }

  startTimer() {
    this.timer = setTimeout(this.onTimeout.bind(this), EXPIRATION_IN_MINUTES * 60 * 1000);
    this.setState({reservationExpirationTime: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000)});
  }

  updateSeatStatus(showid = undefined) {
    if (showid === undefined) {
      showid = this.state.show.id;
    }

    var chosenSeatIds = this.tickets.map((t: ITicket) => t.seat.id);
    this.setState({chosenSeatIds: chosenSeatIds});
    $.ajax({
      url: 'api/shows/' + showid + '/reservedSeats',
      success: (response: IReservedSeats) => {
        var reservedSeatIds = response.reserved_seats;
        var conflictingSeatIds = _.intersection(reservedSeatIds, chosenSeatIds);
        var hasConflictingSeats = conflictingSeatIds.length > 0;
        var state = {
          conflictingSeatIds: conflictingSeatIds,
          reservedSeatIds: reservedSeatIds,
          reservationError: null
        };
        if (hasConflictingSeats) {
          // If we don't have numbered seats, we don't actually care about the seat id's. To keep the backend simple,
          // we have pseudo-seats still, so in frontend we have to choose some id's. Now, if those seats happen to be
          // taken by some concurrent buyer, our 'reserveTickets'-call will fail, but we don't need any user action.
          // So let's just get some new free id's and retry. This will probably only happen like 0 times ever, so there
          // is no need to worry about performance. If there isn't enough free seats left anymore, we show the error.
          // Note that this supports multiple sections, making the code a bit more complicated.
          if (this.venue.ticket_type === 'generic-tickets') {
            var enoughTicketsLeft = true;
            var conflictingTickets = _.filter(this.tickets, (t: ITicket) => _.contains(conflictingSeatIds, t.seat.id));
            chosenSeatIds = this.tickets.map((t: ITicket) => t.seat.id);
            for (var ticket of conflictingTickets) {
              var section = this.venue.sections[ticket.section.id];
              var sectionSeatIds = _.values(section.seats).map((s: ISeat) => s.id); // _.keys returns strings, we need ints
              var freeSeatIds = _.chain(sectionSeatIds)
               .difference(reservedSeatIds)
               .difference(chosenSeatIds)
               .shuffle().value();
              if (freeSeatIds.length === 0) {
                enoughTicketsLeft = false;
                break;
              }
              var freeSeatId = freeSeatIds[0]; // .sample() breaks type information
              var freeSeat = section.seats[freeSeatId];
              chosenSeatIds.push(freeSeatId);
              ticket.seat = freeSeat;
            }
            if (enoughTicketsLeft) {
              this.onReserveTickets();
              return;
            }
          }
          state.reservationError = 'Osa valitsemistasi paikoista on valitettavasti jo ehditty varata.';
        }
        this.setState(state);
      }
    });
  }

  onShowSelect(showid: number) {
    this.tickets = [];
    this.order = null;

    var show = _.findWhere(this.shows, {id: showid});

    if (!this.venue || this.venue.id !== show.venue_id) {
      $.getJSON('api/venues/' + show.venue_id,
        (response: IVenue) => {
          this.venue = response;
          this.updateSeatStatus(showid);
      });
    } else {
      this.updateSeatStatus(showid);
    }

    this.setState({
      page: 'seats',
      show: show,
      reservationExpirationTime: null,
      reservationError: null
    });
    Router.navigate('show/' + showid, {trigger: false});
    GA.pageview('/' + window.location.hash);
    setTimeout(function() {
      scrollToElem('.seat-selector');
    }, 100);
  }

  onSeatClicked(seat_id, section_id) {
    this.setState({
      page: 'seats',
      reservationExpirationTime: null,
      reservationError: null
    });
    if (this.state.chosenSeatIds.indexOf(seat_id) >= 0) {
      this.unselectSeat(seat_id);
      GA.event({category: 'Seat', action: 'Unselected', label: this.venue.sections[section_id].section_title, value: seat_id});
    } else {
      this.selectSeat(seat_id, section_id);
      GA.event({category: 'Seat', action: 'Selected', label: this.venue.sections[section_id].section_title, value: seat_id});
    }
    this.updateSeatStatus();
  }

  selectSeat(seat_id, section_id) {
    console.log('selecting', seat_id, section_id);
    var section = this.venue.sections[section_id];
    var seat = section.seats[seat_id];
    var price = this.state.show.sections[section_id].price;
    var discount_groups = this.state.show.discount_groups;
    this.tickets.push({seat: seat, section: section, price: price, discount_groups: discount_groups, discount_group_id: DISCOUNT_GROUP_DEFAULT});
  }

  unselectSeat(seat_id) {
    var removeTicket = _.findIndex(this.tickets, (t: ITicket) => t.seat.id === seat_id);
    this.tickets.splice(removeTicket, 1);
  }

  onReserveTickets() {
    var data = _.map(this.tickets, (t: ITicket) => {
      return {
        seat_id: t.seat.id,
        discount_group_id: t.discount_group_id
      };
    });
    $.ajax({
      url: 'api/shows/' + this.state.show.id + '/reserveSeats/',
      method: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function (response: IOrder) {
        this.order = response;
        this.startTimer();
        this.setState({page: 'contacts'});
        setTimeout(function () {
          scrollToElem('.contact-input');
        }, 0);
      }.bind(this),
      error: (model, response) => {
        this.updateSeatStatus();
        this.forceUpdate();
      }
    });
    GA.event({category: 'Tickets', action: 'Reserved', value: this.tickets.length});
  }

  onSaveOrderInfo(info) {
    this.order.name = info.name;
    this.order.email = info.email;
    this.order.discount_code = info.discount_code;
    this.order.wants_email = info.wants_email;

    $.ajax({
      url: 'api/orders/' + this.order.order_id,
      method: 'POST',
      data: JSON.stringify(this.order),
      contentType: 'application/json',
      success: function (response: IOrder) {
        this.order = response;
        this.setState({page: 'payment'});
        setTimeout(function() {
          scrollToElem('.final-confirmation');
        }, 0);
      }.bind(this),
      error: (response) => {
        console.log('order info saving failed'); // TODO
      }
    });
    GA.event({category: 'Contacts', action: 'Saved'});
  }

  onProceedToPayment() {
    clearTimeout(this.timer);
    this.setState({paymentBegun: true, reservationExpirationTime: null});

    $.post('api/orders/' + this.order.order_id + '/preparePayment',
      function(res) {
        if (res.err) {
          this.setState({page: 'seats', paymentBegun: false});
        } else {
          if (res.url[0] === '#') { // when skipping Paytrail
            this.setState(this._getInitialState(this.props));
          }
          window.location.href = res.url;
        }
      }.bind(this));
    GA.event({category: 'Payment', action: 'Started', value: this.order.order_price});
  }

  helpText() {
    var result;
    if (this.props.action === 'ok') {
      var order_id = this.props.args[0];
      var order_hash = this.props.args[1];
      result = (
        <div className='alert alert-success'><p>Tilaus onnistui!</p>
          <p>Lähetimme liput sähköpostitse. Mikäli lippuja ei näy, tarkistathan roskapostikansiosi.
          Ongelmatapauksissa auttaa <a className='alert-link' href='mailto:liput@teekkarispeksi.fi'>liput@teekkarispeksi.fi</a>.
          Voit myös <a className='alert-link' href={'api/orders/' + order_id + '/' + order_hash + '/tickets.pdf'}>ladata liput tästä.</a></p>
        </div>
      );
      GA.event({category: 'Payment', action: 'Succesfull'});
    } else if (this.props.action === 'fail') {
      result = (<div className='alert alert-warning'>Keskeytit tilauksesi ja varaamasi paikat on vapautettu myyntiin.</div>);
      GA.event({category: 'Tickets', action: 'Canceled'});
    }
    var rawProductionDescriptionMarkup = Marked(this.production.description, {sanitize: true}); // should be safe to inject
    return (
      <div className='shopping-stage help-text'>
        {result}
        <span dangerouslySetInnerHTML={{__html: rawProductionDescriptionMarkup}} />
      </div>
    );
  }

  render() {
    var seatSelectorElem, shoppingCartElem, contactsElem, finalConfirmationElem;
    if (!this.production) {
      return <div></div>;
    }
    var opens = Moment(this.production.opens);
    if (opens > Moment() && !this.state.auth) {
      return <div className='shopping-stage'>Lippukauppa aukeaa {opens.format('DD.MM. [klo] H:mm')}.</div>;
    }
    /* tslint:disable:no-switch-case-fall-through switch-default */
    switch (this.state.page) {
      case 'home':
        seatSelectorElem = this.helpText();
        break;

      // No breaks -> fallthrough-magic!
      case 'payment':
        finalConfirmationElem = <FinalConfirmation order={this.order} paymentBegun={this.state.paymentBegun} onProceedToPayment={this.onProceedToPayment.bind(this)} />;
        /* fall through */
      case 'contacts':
        contactsElem = <Contacts active={this.state.page === 'contacts'} onSaveOrderInfo={this.onSaveOrderInfo.bind(this)} />;
        /* fall through */
      case 'seats':
        var active = this.state.page === 'seats' && Moment(this.state.show.inactivate_time) > Moment() && Moment(this.state.show.time) > Moment() && this.state.show.reserved_percentage < 100;
        if (!this.state.show || !this.venue) {
          seatSelectorElem = <div className='shopping-stage seat-selector'></div>;
        } else if (this.venue.ticket_type === 'generic-tickets') {
          seatSelectorElem = <TicketCountSelector active={active} onSeatClicked={this.onSeatClicked.bind(this)} show={this.state.show} venue={this.venue}
            chosenSeatIds={this.state.chosenSeatIds} reservedSeatIds={this.state.reservedSeatIds} />;
        } else {
          seatSelectorElem = <SeatSelector active={active} onSeatClicked={this.onSeatClicked.bind(this)} show={this.state.show} venue={this.venue}
            conflictingSeatIds={this.state.conflictingSeatIds} chosenSeatIds={this.state.chosenSeatIds} reservedSeatIds={this.state.reservedSeatIds} />;
        }
        if (this.tickets.length > 0 || this.state.reservationError) {
          shoppingCartElem = (<ShoppingCart
            tickets={this.tickets}
            conflictingSeatIds={this.state.conflictingSeatIds}
            active={active}
            reservationExpirationTime={this.state.reservationExpirationTime}
            onReserveTickets={this.onReserveTickets.bind(this)}
            onSeatClicked={this.onSeatClicked.bind(this)}
            error={this.state.reservationError} />);
        }
    }
    /* tslint:enable:no-switch-case-fall-through */

    var admin = this.state.auth ? (
      <div id='admin' className='shopping-stage'>
      <h4>Hei, {this.state.auth}!</h4>
      <p>Siirry admin-puolelle <a href='admin'>tästä</a>.</p>
      <p><Bootstrap.Button disabled={this.tickets.length === 0} onClick={() => {this.tickets.forEach((t) => t.discount_group_id = 3); this.forceUpdate();}}>Ilmaislipuiksi</Bootstrap.Button></p>
      </div>
    ) : null;

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect.bind(this)} shows={this.shows} selectedShow={this.state.show} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
        {finalConfirmationElem}
        {admin}
      </div>
    );
  }

}
