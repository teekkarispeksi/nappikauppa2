'use strict';

declare var config: {analytics: {google: string, fb: string}};


let GA = config.analytics.google ? require('react-ga') : null;

// .default is required in import
// Javascript, URHG :(
let FB = config.analytics.fb ? require('react-facebook-pixel').default : null;

export function page() {
  if (GA) { GA.pageview('/' + window.location.hash); }
}

export function init() {
  if (GA) { GA.initialize(config.analytics.google); }
  if (FB) { FB.init(config.analytics.fb); }
  if (FB) { FB.pageView(); }
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

export function purchaseCompleted(value: number) {
  if (GA) { GA.event({category: 'Order', action: 'Payment succesfull', value: value}); }
  if (FB) { FB.track('Purchase', {
    value: value,
    currency: 'EUR',
  }); }
}

export function cancelled(where: string) {
  if (GA) { GA.event({category: 'Order', action: 'Cancelled' + (where ? ' - ' + where : null)}); }
}
