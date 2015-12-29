import {IOrder} from "../../../../backend/src/order";
'use strict';

import React = require('react');
import Backbone = require('backbone');
Backbone.emulateHTTP = true; // PATCH's don't work with our mod_rewrites
import $ = require('jquery');
import _ = require('underscore');

import ShowSelector from './ShowSelector.tsx';
import SeatSelector from './SeatSelector.tsx'; // for numbered seats
import TicketCountSelector from './TicketCountSelector.tsx'; // for non-numbered seats
import ShoppingCart from './ShoppingCart.tsx';
import Contacts from './Contacts.tsx';
import FinalConfirmation from './FinalConfirmation.tsx';

import {IShow, IReservedSeats} from "../../../../backend/src/show";
import {IVenue, ISeat} from "../../../../backend/src/venue";
import Ticket from '../models/ticket';

import Router = require('../router');

// TODO: get this from backend, as it should match as closely as possible to backend's timer
const EXPIRATION_IN_MINUTES = 15;
const DISCOUNT_GROUP_DEFAULT = 1;

var scrollToElem = function(elemstr) {
  $('html, body').animate({
    scrollTop: $(elemstr)[0].offsetTop
  });
};

export interface IStoreProps {
  action?: string;
  showid?: number;
  args?: string[];
}

export interface IStoreState {
  page?: string;
  show?: IShow;
  paymentBegun?: boolean;
  reservationError?: string;
  conflictingSeatIds?: number[];
  chosenSeatIds?: number[];
  reservedSeatIds?: number[];
  reservationHasExpired?: boolean;
  reservationExpirationTime?: Date;
}

export default class Store extends React.Component<IStoreProps, IStoreState> {
  shows: IShow[];
  tickets: Ticket[];
  order: IOrder;
  venue: IVenue;
  seats: any;
  timer: any;

  constructor(props: IStoreProps) {
    super();

    this.shows = [];
    this.tickets = [];

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
    }
  }

  componentWillMount() {
    if (this.props.action) {
      // clean the ok/fail hash in the url
      window.history.pushState('', '', window.location.pathname);
    }
    $.getJSON('api/shows', (resp: IShow[]) => {
      this.shows = resp;
      if (this.props.showid) {
        this.onShowSelect(this.props.showid);
      }

      this.forceUpdate();
    });

  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  onTimeout() {
    this.setState({page: 'seats', reservationExpirationTime: null, reservationHasExpired: true});
  }

  startTimer() {
    this.timer = setTimeout(this.onTimeout, EXPIRATION_IN_MINUTES * 60 * 1000);
    this.setState({reservationExpirationTime: new Date(Date.now() + EXPIRATION_IN_MINUTES * 60 * 1000), reservationHasExpired: false});
  }

  updateSeatStatus(showid = undefined) {
    if (showid === undefined) {
      showid = this.state.show.id;
    }

    var chosenSeatIds = this.tickets.map((t: Ticket): number => t.get('seat').id);
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
          if(this.venue.ticket_type === 'generic-tickets') {
            var enoughTicketsLeft = true;
            var conflictingTickets = _.filter(this.tickets, (t: Ticket) => _.contains(conflictingSeatIds, t.get('seat').id));
            chosenSeatIds = this.tickets.map((t: Ticket): number => t.get('seat').id);
            for(var i = 0; i < conflictingTickets.length; i++) {
              var ticket = conflictingTickets[i];
              var section = this.venue.sections[ticket.get('section').id];
              var sectionSeatIds = _.values(section.seats).map((s: ISeat) => s.id) // _.keys returns strings, we need ints
              var freeSeatIds = _.chain(sectionSeatIds)
               .difference(reservedSeatIds)
               .difference(chosenSeatIds)
               .shuffle().value()
              if(freeSeatIds.length === 0) {
                enoughTicketsLeft = false;
                break;
              }
              var freeSeatId = freeSeatIds[0]; // .sample() breaks type information
              var freeSeat = section.seats[freeSeatId];
              chosenSeatIds.push(freeSeatId);
              ticket.set('seat', freeSeat);
            };
            if(enoughTicketsLeft) {
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
      reservationHasExpired: null
    });
    Router.navigate('show/' + showid, {trigger: false});
    setTimeout(function() {
      scrollToElem('.seat-selector');
    }, 100);
  }

  onSeatClicked(seat_id, section_id) {
    this.setState({
      page: 'seats',
      reservationHasExpired: false,
      reservationError: null
    });
    if (this.state.chosenSeatIds.indexOf(seat_id) >= 0) {
      this.unselectSeat(seat_id);
    } else {
      this.selectSeat(seat_id, section_id);
    }
    this.updateSeatStatus();
  }

  selectSeat(seat_id, section_id) {
    console.log("selecting", seat_id, section_id);
    var section = this.venue.sections[section_id];
    var seat = section.seats[seat_id];
    var discount_groups = this.state.show.sections[section_id].discount_groups;
    this.tickets.push(new Ticket({seat: seat, section: section, discount_groups: discount_groups, discount_group_id: DISCOUNT_GROUP_DEFAULT}));
  }

  unselectSeat(seat_id) {
    var removeTicket = _.findIndex(this.tickets, (t: Ticket) => t.get('seat').id === seat_id);
    this.tickets.splice(removeTicket, 1);
  }

  onReserveTickets() {
    var data = _.map(this.tickets, (t: Ticket) => {
      return {
        seat_id: t.get('seat').id,
        discount_group_id: t.get('discount_group_id')
    }});

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
  }

  onSaveOrderInfo(info) {
    this.order.name = info.name;
    this.order.email = info.email;
    this.order.discount_code = info.discount_code;

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
  }

  helpText() {
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
  }

  render() {
    var seatSelectorElem, shoppingCartElem, contactsElem, finalConfirmationElem;

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
        if (!this.state.show || !this.venue) {
          seatSelectorElem = <div className='shopping-stage seat-selector'></div>
        }
        else if (this.venue.ticket_type === 'generic-tickets') {
          seatSelectorElem = <TicketCountSelector active={this.state.page === 'seats'} onSeatClicked={this.onSeatClicked.bind(this)} show={this.state.show} venue={this.venue}
            chosenSeatIds={this.state.chosenSeatIds} reservedSeatIds={this.state.reservedSeatIds} />;
        } else {
          seatSelectorElem = <SeatSelector active={this.state.page === 'seats'} onSeatClicked={this.onSeatClicked.bind(this)} show={this.state.show} venue={this.venue}
            conflictingSeatIds={this.state.conflictingSeatIds} chosenSeatIds={this.state.chosenSeatIds} reservedSeatIds={this.state.reservedSeatIds} />;
        }
        if (this.tickets.length > 0 || this.state.reservationError) {
          shoppingCartElem = (<ShoppingCart
            tickets={this.tickets}
            conflictingSeatIds={this.state.conflictingSeatIds}
            active={this.state.page === 'seats'}
            reservationExpirationTime={this.state.reservationExpirationTime}
            reservationHasExpired={this.state.reservationHasExpired}
            onReserveTickets={this.onReserveTickets.bind(this)}
            onSeatClicked={this.onSeatClicked.bind(this)}
            error={this.state.reservationError} />);
        }
    }

    return (
      <div>
        <ShowSelector onShowSelect={this.onShowSelect.bind(this)} shows={this.shows} selectedShow={this.state.show} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
        {finalConfirmationElem}
      </div>
    );
  }

}
