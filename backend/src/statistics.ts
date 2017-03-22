'use strict';

import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export interface IRawStatistic {
  show_id: number;
  title: string;
  count: number;
  revenue: number;
  date: string;
}

export interface IStatistics {
  tickets: any[];
  orders: any[];
  status: any[];
  groups: any[];
  codes: any[];
  byShow: any[];
  byDate: any[];
}

export function raw(production_id: number): Promise<IRawStatistic[]> {
  return db.query('select t.show_id, s.title, COUNT(*) as count, SUM(t.price) as revenue, UPPER(DATE(o.time)) as date \
      from nk2_tickets t \
      join nk2_shows s on t.show_id = s.id \
      join nk2_orders o on t.order_id = o.id \
      where s.production_id = :production_id \
      group by UPPER(DATE(o.time)), t.show_id', {production_id: production_id});
}

export function stats(): Promise<IStatistics> {
  var stats: IStatistics = {tickets: null, orders: null, status: null, groups: null, codes: null, byShow: null, byDate: null};
  return db.query('select sum(price) as revenue, count(*) as count from nk2_tickets').then((res) => {
    stats.tickets = res[0];
  }).then(() => {
    return db.query('select sum(price) as revenue, count(*) as count from nk2_orders').then((res) => {
      stats.orders = res[0];
    });
  }).then(() => {
    return db.query('select status, sum(price) as revenue, count(*) as count from nk2_orders where id in (select distinct order_id from nk2_tickets) group by status').then((res) => {
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
