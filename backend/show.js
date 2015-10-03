'use strict';

var db = require('./db.js');
var order = require('./order.js');
var _ = require('underscore');

var show = {

  getAll: function(cb) {
    db.query('select \
        shows.*, \
        prices.section_id, prices.price, \
        groups.id as discount_group_id, groups.title as discount_group_title, groups.eur as discount_group_discount \
      from nk2_shows shows \
      join nk2_prices prices on shows.id = prices.show_id \
      left outer join nk2_discount_groups groups on \
        (shows.id = groups.show_id or groups.show_id is null) \
        and groups.admin_only = false \
        and groups.active = true',
      function(err, rows, fields) {
        console.log(err);
        var grouped = _.groupBy(rows, 'id');
        var shows = _.mapObject(grouped, function(showRows) {
          var show = _.pick(showRows[0], ['id', 'title', 'venue_id', 'time', 'active', 'inactivate_time', 'description']);
          var sections = _.groupBy(showRows, 'section_id');
          show.sections = _.mapObject(sections, function(sectionRows) {
            var basePrice = sectionRows[0].price;
            var section = {section_id: sectionRows[0].section_id};
            var groups = _.indexBy(sectionRows, 'discount_group_id');
            section.discount_groups = _.mapObject(groups, function(groupRow) {
              return {
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
            throw err;
          }

          cb({
            'reserved_seats': _.pluck(res, 'seat_id')
          });
        });
    });
  }
};

module.exports = show;
