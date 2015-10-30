'use strict';

var db = require('./db.js');
var log = require('./log.js');
var order = require('./order.js');
var _ = require('underscore');

var show = {

  getAll: function(cb) {
    db.query('select \
        shows.*, \
        (100.0 * reserved.seatcount / total.seatcount) as reserved_percentage, \
        prices.section_id, prices.price, \
        groups.id as discount_group_id, groups.title as discount_group_title, groups.eur as discount_group_discount \
      from nk2_shows shows \
      join nk2_prices prices on shows.id = prices.show_id \
      join ( \
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
        join nk2_seats seats on seats.section_id = sections.id \
        group by show_id \
      ) as total on total.show_id = shows.id \
      left outer join nk2_discount_groups groups on \
        (shows.id = groups.show_id or groups.show_id is null) \
        and groups.admin_only = false \
        and groups.active = true',
      function(err, rows, fields) {
        if (err) {
          log.error('Getting all shows failed', {error: err});
        }
        var grouped = _.groupBy(rows, 'id');
        var shows = _.mapObject(grouped, function(showRows) {
          var show = _.pick(showRows[0], ['id', 'title', 'venue_id', 'time', 'active', 'inactivate_time', 'description', 'reserved_percentage']);
          var sections = _.groupBy(showRows, 'section_id');
          show.sections = _.mapObject(sections, function(sectionRows) {
            var basePrice = sectionRows[0].price;
            var section = {section_id: sectionRows[0].section_id};
            section.discount_groups = _.map(sectionRows, function(groupRow) {
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
        cb(_.values(shows));
      });
  },

  get: function(show_id, cb) {
    db.query('select * from nk2_shows where id=:show_id',
      {show_id: show_id},
      function(err, rows, fields) {
        if (err) {
          log.error('Getting a show failed', {error: err});
          return;
        }
        cb(rows[0]);
      });
  },

  getReservedSeats: function(show_id, cb) {
    order.checkExpired(function() {
      db.query('select distinct seat_id \
        from nk2_tickets tickets \
        join nk2_orders orders on tickets.order_id = orders.id \
        where show_id = :show_id \
          and orders.status in ("seats-reserved", "payment-pending", "paid") \
        order by seat_id',
        {show_id: show_id},
        function(err, res) {
          if (err) {
            log.error('Getting reserved seats failed', {error: err, show_id: show_id});
            return;
          }

          cb({
            'reserved_seats': _.pluck(res, 'seat_id')
          });
        });
    });
  }
};

module.exports = show;
