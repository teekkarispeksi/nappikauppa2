'use strict';

import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export function stats(): Promise<any> {
  var stats = {tickets: null, orders: null, byShow: null, byDate: null};
  return db.query('select sum(price) as ticket_revenue from nk2_tickets').then((res) => {
    stats.tickets = res[0];
  }).then(() => {
    return db.query('select sum(price) as order_revenue from nk2_orders').then((res) => {
      stats.orders = res[0];
    });
  }).then(() => { // the upper is there just to convert the DATE to a STRING
    return db.query('select upper(date(o.time)) as date, sum(t.price) as revenue from nk2_tickets t join nk2_orders o on t.order_id = o.id group by upper(date(o.time))').then((res) => {
      stats.byDate = res;
    });
  }).then(() => {
    return db.query('select show_id, s.title, sum(price) as revenue from nk2_tickets t join nk2_shows s on t.show_id = s.id group by show_id').then((res) => {
      stats.byShow = res;
    });
  }).then(() => {
    return stats;
  });
}
