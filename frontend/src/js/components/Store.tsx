'use strict';

import React = require('react');
import Backbone = require('backbone');
Backbone.emulateHTTP = true; // PATCH's don't work with our mod_rewrites
import $ = require('jquery');
import _ = require('underscore');
import { marked } from 'marked';
import Moment = require('moment-timezone');
import Bootstrap = require('react-bootstrap');

import Button from './Button';
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
import event = require('../event');

// TODO: get this from backend, as it should match as closely as possible to backend's timer
const EXPIRATION_IN_MINUTES = 15;
const DISCOUNT_GROUP_DEFAULT = 1;

/**
 * Helper for scrolling page to specific element
 * If element queried with elemstr is not found,
 * helper does nothing
 */
function scrollToElem(elemstr: string) {
  const elem = $(elemstr)[0];
  if (elem && elem.offsetTop) {
    $('html, body').animate({
      scrollTop: elem.offsetTop
    });
  }
}

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
  page?: 'home' | 'seats' | 'contacts' | 'payment';
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
    super(props);

    this.shows = [];
    this.tickets = [];
    this.production = null;

    this.state = this._getInitialState(props);
  }

  componentWillMount() {
    if (this.props.action) {
      // clean the ok/fail hash in the url
      window.history.pushState('', '', window.location.pathname);
    }
    var order;
    $.getJSON('api/productions/latest')
    .then((resp: IProduction) => {
      this.production = resp;
      this.forceUpdate();

      return $.getJSON('api/shows', {production_id: this.production.id});
    }).then((resp2: IShow[]) => {
      this.shows = resp2;

      return $.get('api/orders/continue');
    }).then((resp3: IOrder, statusCode, xhr: JQueryXHR) => {
      if (!resp3 || xhr.status === 204 || resp3.status !== 'seats-reserved') {
        return; // no or unsupperted existing order to load
      }
      order = resp3;
      this.onShowSelect(order.tickets[0].show_id, (show: IShow) => {
        this.order = order;
        this.tickets = order.tickets.map(t => {
          var section = this.venue.sections[t.section_id];
          var seat = section.seats[t.seat_id];
          return {
            seat: seat,
            section: section,
            price: t.ticket_price + _.findWhere(show.discount_groups, {id: t.discount_group_id}).discount,
            discount_group_id: t.discount_group_id,
            discount_groups: show.discount_groups
          };
        });
        this.startTimer(this.order.time);
        if (!this.order.name) {
          this.setState({page: 'contacts'});
        } else {
          this.setState({page: 'payment'});
        }
        this.updateSeatStatus(undefined, false); // here the chosen and reserved seats will always conflict
      });
    })
    .always(() => {
      if (this.props.showid != null && !order) {
        this.onShowSelect(this.props.showid);
      }
      this.forceUpdate();
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
    event.cancelled('expired');
  }

  startTimer(timeFrom?: string) {
    var timeoutMilliseconds = EXPIRATION_IN_MINUTES * 60 * 1000;
    if (timeFrom) {
      timeoutMilliseconds -= Moment().diff(Moment.tz(timeFrom, 'Europe/Helsinki'));
    }

    this.timer = setTimeout(this.onTimeout.bind(this), timeoutMilliseconds);
    this.setState({reservationExpirationTime: new Date(Date.now() + timeoutMilliseconds)});
  }

  updateSeatStatus(showid = undefined, checkConflicts = true) {
    if (showid === undefined) {
      showid = this.state.show.id;
    }

    var chosenSeatIds = this.tickets.map((t: ITicket) => t.seat.id);
    this.setState({chosenSeatIds: chosenSeatIds});
    $.ajax({
      url: 'api/shows/' + showid + '/reservedSeats',
      success: (response: IReservedSeats) => {
        var reservedSeatIds = response.reserved_seats;
        var conflictingSeatIds = checkConflicts ? _.intersection(reservedSeatIds, chosenSeatIds) : []; // when loading existing order, there is always a 'conflict' so we want to skip that
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
              var freeSeatIds: number[] = _.shuffle(_.filter(
                sectionSeatIds,
                id => !_.contains(reservedSeatIds, id) &&  !_.contains(chosenSeatIds, id),
              ));
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

  onShowSelect(showid: number, callback?: (IShow) => void) {
    this.tickets = [];
    this.order = null;

    var show = _.findWhere(this.shows, {id: showid});

    if (!show) {
      Router.navigate('', {trigger: true});
      return;
    }

    this.setState({
      page: 'seats',
      show: show,
      reservationExpirationTime: null,
      reservationError: null
    });
    Router.navigate('show/' + showid, {trigger: false});
    event.page();
    setTimeout(() => scrollToElem('.seat-selector'), 100);

    if (!this.venue || this.venue.id !== show.venue_id) {
      $.getJSON('api/venues/' + show.venue_id, (response: IVenue) => {
          this.venue = response;
          if (callback && 'function' === typeof callback) {
            callback(show);
          } else {
            this.updateSeatStatus(showid);
          }
      });
    } else {
      if (callback && 'function' === typeof callback) {
        callback(show);
      } else {
        this.updateSeatStatus(showid);
      }
    }
  }

  onSeatClicked(seat_id, section_id) {
    this.setState({
      page: 'seats',
      reservationExpirationTime: null,
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
    var section = this.venue.sections[section_id];
    var seat = section.seats[seat_id];
    var price = this.state.show.sections[section_id].price;
    var discount_groups = this.state.show.discount_groups;
    event.addToCart(price, this.venue.sections[section_id].section_title, seat_id);
    this.tickets.push({seat: seat, section: section, price: price, discount_groups: discount_groups, discount_group_id: DISCOUNT_GROUP_DEFAULT});
  }

  unselectSeat(seat_id) {
    var indexToRemove = _.findIndex(this.tickets, (t: ITicket) => t.seat.id === seat_id);
    event.removeFromCart(this.venue.sections[this.tickets[indexToRemove].section.id].section_title, seat_id);
    this.tickets.splice(indexToRemove, 1);
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
      success: ( (response: IOrder) => {
        this.order = response;
        event.reserve(this.order.tickets.reduce((a, b) => a + b.ticket_price, 0));
        this.startTimer();
        this.setState({page: 'contacts'});
        setTimeout( () => {
          scrollToElem('.contact-input');
        }, 0);
      }).bind(this),
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
    this.order.wants_email = info.wants_email;

    $.ajax({
      url: 'api/orders/' + this.order.order_id,
      method: 'POST',
      data: JSON.stringify(this.order),
      contentType: 'application/json',
      success: ( (response: IOrder) => {
        this.order = response;
        this.setState({page: 'payment'});
        setTimeout( () => {
          scrollToElem('.final-confirmation');
        }, 0);
      }).bind(this),
      error: (response) => {
        console.log('order info saving failed'); // TODO
      }
    });
    event.orderInfoSaved();
  }

  onProceedToPayment() {
    clearTimeout(this.timer);
    this.setState({paymentBegun: true, reservationExpirationTime: null});

    $.post('api/orders/' + this.order.order_id + '/preparePayment',
      ((res) => {
              if (res.err) {
                this.setState({page: 'seats', paymentBegun: false});
              } else {
                if (res.redirect_url[0] === '#') { // when skipping payment
                  this.setState(this._getInitialState(this.props));
                }
                window.location.href = res.redirect_url;
              }
            }).bind(this));
    event.purchaseInitiated(this.order.order_price);
  }

  onCancel() {
    $.post('api/orders/' + this.order.order_id + '/' + this.order.order_hash + '/cancel');
    this.order = null;
    this.setState({page: 'seats', reservationExpirationTime: null});
    event.cancelled('');
  }

  helpText() {
    var result;
    if (this.props.action === 'ok') {
      var order_id = this.props.args[0];
      var order_hash = this.props.args[1];
      var order_price = parseInt(atob(this.props.args[2]));
      result = (
        <div className='alert alert-success'><p>Tilaus onnistui!</p>
          <p>Lähetimme liput sähköpostitse. Mikäli lippuja ei näy, tarkistathan roskapostikansiosi.
          Ongelmatapauksissa auttaa <a className='alert-link' href='mailto:liput@teekkarispeksi.fi'>liput@teekkarispeksi.fi</a>.
          Voit myös <a className='alert-link' href={'api/orders/' + order_id + '/' + order_hash + '/tickets.pdf'}>ladata liput tästä.</a></p>
        </div>
      );
      event.purchaseCompleted(order_price);
    } else if (this.props.action === 'fail') {
      result = (<div className='alert alert-warning'>Keskeytit tilauksesi ja varaamasi paikat on vapautettu myyntiin.</div>);
      event.cancelled('payment');
    }
    var rawProductionDescriptionMarkup = marked.parse(this.production.description, {sanitize: true}); // should be safe to inject
    return (
      <div className='shopping-stage help-text'>
        {result}
        <span dangerouslySetInnerHTML={{__html: rawProductionDescriptionMarkup}} />
      </div>
    );
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
    } as IStoreState;
  }

  // tslint:disable-next-line: member-ordering
  render() {
    var seatSelectorElem, shoppingCartElem, contactsElem, finalConfirmationElem;
    if (!this.production) {
      return <div></div>;
    }
    var opens = Moment.tz(this.production.opens, 'Europe/Helsinki');
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
        finalConfirmationElem = <FinalConfirmation order={this.order} paymentBegun={this.state.paymentBegun} canCancel={this.order.status === 'seats-reserved'}
          onProceedToPayment={this.onProceedToPayment.bind(this)} onCancel={this.onCancel.bind(this)}/>;
        /* fall through */
      case 'contacts':
        contactsElem = <Contacts active={this.state.page === 'contacts'} onSaveOrderInfo={this.onSaveOrderInfo.bind(this)} onCancel={this.onCancel.bind(this)}
          production_id={this.production.id} name={this.order.name} email={this.order.email} discount_code={this.order.discount_code}  />;
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
      <p><Button disabled={this.tickets.length === 0} onClick={() => {this.tickets.forEach((t) => t.discount_group_id = 3); this.forceUpdate(); }}>Ilmaislipuiksi</Button>
      <Button disabled={this.tickets.length === 0} onClick={() => {this.tickets.forEach((t) => t.discount_group_id = 9); this.forceUpdate(); }}>Ryhmälipuiksi</Button></p>
      </div>
    ) : null;

    return (
      <div>
        <ShowSelector active={this.state.page === 'home' || this.state.page === 'seats'} onShowSelect={this.onShowSelect.bind(this)} shows={this.shows} selectedShow={this.state.show} />
        {seatSelectorElem}
        {shoppingCartElem}
        {contactsElem}
        {finalConfirmationElem}
        {admin}
      </div>
    );
  }

}
