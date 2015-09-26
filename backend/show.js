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
    db.query('select distinct seat_id \
      from nk2_tickets tickets \
      join nk2_orders orders on tickets.order_id = orders.id \
      where show_id = :show_id \
        and (orders.payment_id is not null \
          or timestampdiff(minute, orders.time, now()) < 15) \
      order by seat_id',
      {show_id: show_id},
      function(err, res) {
        if(err) throw err;

        cb({
          'reserved_seats': _.pluck(res, 'seat_id')
        });
      });
  },

  reserveSeats: function(show_id, seats, cb) {
    // TODO first delete expired reservations

    db.beginTransaction(function(err) {
      if (err) throw err;

      db.query('insert into nk2_orders (time) values (now())', function(err, res) {
        if(err) return db.rollback(function() { throw err; });

        var order_id = res.insertId;

        // Blargh. We want to do multiple inserts in a single query AND have one value resolved
        // within the query, so need to hack a bit
        var query_start = 'insert into nk2_tickets \
          (order_id, show_id, seat_id, discount_group_id, price) \
          values ';

        // db.format() escapes everything properly
        var insert_values = seats.map(function(e) {
          return db.format('(:order_id, :show_id, :seat_id, :discount_group_id, \
            (select price from nk2_prices \
              where show_id = :show_id \
                and section_id = (select section_id from nk2_seats where id = :seat_id)) \
          )', {
            order_id: order_id,
            show_id: show_id,
            seat_id: e.seat.id,
            discount_group_id: 0
          });
        });

        // Actually fire what we generated above
        db.query(query_start + insert_values.join(','),
          function(err, res) {
            if(err) {
              return db.rollback(function() {
                cb({
                  error: true,
                  order_id: null
                })
              });
            }
            db.commit();
            cb({
              error: null,
              order_id: order_id
            });
          });
      });
    });
  }
};

module.exports = show;
