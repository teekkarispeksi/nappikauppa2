'use strict';

declare var config: {analytics: {google: string, fb: string}};


let GA = config.analytics.google ? require('react-ga') : null;
let FB = config.analytics.fb ? require('react-facebook-pixel') : null;

export function page() {
  if (GA) { GA.pageview('/' + window.location.hash); }
  if (FB) { FB.pageView(); }
}

export function init() {
  if (GA) { GA.initialize(config.analytics.google); }
  if (FB) { FB.init(config.analytics.fb); }
  page();
}

export function addToCart(value: number, section: string, seat_id: number) {
  if (GA) { GA.event({category: 'Seat', action: 'Selected', label: section, value: seat_id}); }
  if (FB) { FB.track('AddToCart', {
    value: value,
    currency: 'EUR',
  }); }
}

export function removeFromCart(section: string, seat_id: number) {
  if (GA) { GA.event({category: 'Seat', action: 'Unselected', label: section, value: seat_id}); }
}

export function reserve(value: number) {
  if (GA) { GA.event({category: 'Order', action: 'Tickets reserved', value: value}); }
  if (FB) { FB.track('InitiateCheckout', {
    value: value,
    currency: 'EUR',
  }); }
}

export function orderInfoSaved() {
  if (GA) { GA.event({category: 'Order', action: 'Contacts saved'}); }
}

export function purchaseInitiated(value: number) {
  if (GA) { GA.event({category: 'Order', action: 'Payment started', value: value}); }
  if (FB) { FB.track('AddPaymentInfo', {
    value: value,
    currency: 'EUR',
  }); }
}

export function purchaseCompleted() {
  if (GA) { GA.event({category: 'Order', action: 'Payment succesfull'}); }
  if (FB) { FB.track('Purchase', {
    value: 0,
    currency: 'EUR',
  }); }
}

export function cancelled(where: string) {
  if (GA) { GA.event({category: 'Order', action: 'Cancelled' + (where ? ' - ' + where : null)}); }
}
