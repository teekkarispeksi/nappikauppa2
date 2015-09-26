var db = require('./db.js');
var _ = require('underscore');

var show = {

  getAll: function (cb) {
    db.query('select * from nk2_shows', function(err, rows, fields) {
      cb(rows);
    });
  },

  get: function (show_id, cb) {
    db.query('select * from nk2_shows where id=:show_id',
      {show_id:show_id},
      function(err, rows, fields) {
        cb(rows[0]);
      });
  },

  getReservedSeats: function(show_id, cb) {
    // TODO: we might want to get rid of the time check if we have something that's deleting expired reservations often enough
    db.query('select distinct seat_id \
      from nk2_tickets tickets \
      join nk2_orders orders on tickets.order_id = orders.id \
      where show_id = :show_id \
        and (orders.status in ("payment-pending", "paid") \
          or (orders.status = "seats-reserved" and timestampdiff(minute, orders.time, now()) < 15) \
        ) \
      order by seat_id',
      {show_id: show_id},
      function(err, res) {
        if(err) throw err;

        cb({
          'reserved_seats': _.pluck(res, 'seat_id')
        });
      });
  }
};

module.exports = show;
