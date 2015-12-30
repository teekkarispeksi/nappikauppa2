'use strict';

import db = require('./db');
import log = require('./log');
import order = require('./order');
import _ = require('underscore');
import promise = require('es6-promise');

var Promise = promise.Promise;

export interface IShow {
  active: boolean;
  description: string;
  id: number;
  inactive_time: string;
  reserved_percentage: number;
  sections: _.Dictionary<IShowSection>; // TODO: ideally just IShowSection[] :(
  time: string;
  title: string;
  venue_id: number;
}

export interface IShowSection {
  section_id: number;
  discount_groups: IDiscountGroup[];
}

export interface IDiscountGroup {
  id: number;
  price: number;
  title: string;
}

export interface IReservedSeats {
  reserved_seats: number[];
}

export function getAll(): Promise<IShow[]> {
  return db.query('select \
      shows.*, \
      (100.0 * reserved.seatcount / total.seatcount) as reserved_percentage, \
      prices.section_id, prices.price, \
      groups.id as discount_group_id, groups.title as discount_group_title, groups.eur as discount_group_discount \
    from nk2_shows shows \
    join nk2_prices prices on shows.id = prices.show_id and prices.active = true \
    left join ( \
      select show_id, count(*) seatcount \
      from nk2_tickets tickets \
      join nk2_orders orders on tickets.order_id = orders.id \
      where orders.status in ("seats-reserved", "payment-pending", "paid") \
      group by show_id \
    ) as reserved on reserved.show_id = shows.id \
    join ( \
      select shows.id as show_id, count(*) seatcount \
      from nk2_shows shows \
      join nk2_sections sections on sections.venue_id = shows.venue_id \
      join nk2_seats seats on seats.section_id = sections.id and seats.bad_seat = false \
      join nk2_prices prices on shows.id = prices.show_id and sections.id = prices.section_id and prices.active = true \
      group by show_id \
    ) as total on total.show_id = shows.id \
    left join nk2_discount_groups groups on \
      (shows.id = groups.show_id or groups.show_id is null) \
      and groups.admin_only = false \
      and groups.active = true')
    .then((rows) => {
      var grouped = _.groupBy(rows, 'id');
      var shows = _.mapObject(grouped, function(showRows: any[]) {
        var show: IShow = _.pick(showRows[0], ['id', 'title', 'venue_id', 'time', 'active', 'inactivate_time', 'description', 'reserved_percentage']);
        var sections = _.groupBy(showRows, 'section_id');
        show.sections = _.mapObject(sections, function(sectionRows: any[]) {
          var basePrice = sectionRows[0].price;
          var section = {section_id: sectionRows[0].section_id, discount_groups: null};
          section.discount_groups = _.map(sectionRows, function(groupRow: any) {
            return {
              'id': groupRow.discount_group_id,
              'title': groupRow.discount_group_title,
              'price': basePrice - groupRow.discount_group_discount
            };
          });
          return section;
        });
        return show;
      });
      return _.values(shows);
    });
}

export function get(show_id): Promise<any> {
  return db.query('select * from nk2_shows where id=:show_id',
    {show_id: show_id})
  .then((rows) => rows[0])
  .catch((err) => {
    log.error('Getting a show failed', {error: err});
    throw err;
  });
}

export function getReservedSeats(show_id): Promise<IReservedSeats> {
  return order.checkExpired()
    .then(() => db.query('select distinct seat_id \
        from nk2_tickets tickets \
        join nk2_orders orders on tickets.order_id = orders.id \
        where show_id = :show_id \
          and orders.status in ("seats-reserved", "payment-pending", "paid") \
        order by seat_id',
        {show_id: show_id}))
    .then((res) => {
      var reserved_seats = _.map(res, (s) => s['seat_id']);
      return {'reserved_seats': reserved_seats}
    })
    .catch((err) => {
      log.error('Getting reserved seats failed', {error: err, show_id: show_id});
      throw err;
      return null;
    });
}
