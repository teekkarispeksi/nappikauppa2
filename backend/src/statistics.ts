'use strict';

import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export function stats(): Promise<any> {
  var stats = {tickets: null, orders: null, status: null, groups: null, codes: null, byShow: null, byDate: null};
  return db.query('select sum(price) as revenue, count(*) as count from nk2_tickets').then((res) => {
    stats.tickets = res[0];
  }).then(() => {
    return db.query('select sum(price) as revenue, count(*) as count from nk2_orders').then((res) => {
      stats.orders = res[0];
    });
  }).then(() => {
    return db.query('select status, sum(price) as revenue, count(*) as count from nk2_orders group by status').then((res) => {
      stats.status = res;
    });
  }).then(() => {
    return db.query('select title, count(*) as count, sum(t.price) as revenue \
        from nk2_tickets t \
        join nk2_discount_groups dg on t.discount_group_id = dg.id \
        join nk2_orders o  on t.order_id = o.id \
        where o.status = "paid" group by discount_group_id').then((res) => {
      stats.groups = res;
    });
  }).then(() => {
    return db.query('select code_group, count(distinct dc.code) as created, count(o.id) as used \
        from nk2_discount_codes dc \
        left join nk2_orders o on o.discount_code = dc.code \
        group by dc.code_group').then((res) => {
      stats.codes = res;
    });
  }).then(() => { // the upper is there just to convert the DATE to a STRING
    return db.query('select upper(date(o.time)) as date, sum(t.price) as revenue, count(*) as count  \
                     from nk2_tickets t join nk2_orders o on t.order_id = o.id group by upper(date(o.time))').then((res) => {
      stats.byDate = res;
    });
  }).then(() => {
    return db.query('select show_id, s.title, sum(price) as revenue, count(*) as count, count(used_time) as used_count \
        from nk2_tickets t \
        join nk2_shows s on t.show_id = s.id \
        group by show_id').then((res) => {
      stats.byShow = res;
    });
  }).then(() => {
    return stats;
  });
}
