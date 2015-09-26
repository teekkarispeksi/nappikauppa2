var db = require('./db.js');
var _ = require('underscore');

var order = {

  reserveSeats: function(show_id, seats, cb) {
    // TODO first delete expired reservations

    db.beginTransaction(function(err) {
      if (err) throw err;

      db.query('insert into nk2_orders (time, status) values (now(), "seats-reserved")', function(err, res) {
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
  },

  createOrder: function(order_id, data, cb) {
    db.query('update nk2_orders set \
        name = :name, \
        email = :email, \
        discount_code = :discount_code, \
        status = "payment-pending" \
      where id = :id',
      data,
      function(err, res) {
        if(err) throw err;
        // TODO how we should really propagate these errors
        if(res.changedRows != 1) {
          return {
            err: true,
            errmsg: 'Should have updated one row, updated really ' + res.changedRows + ' rows'
          }
        }
        cb(res);
    });
  },

  paymentDone: function(order_id, cb) {
    // TODO create ticket hash ids
    // TODO verify payment

    db.query('update nk2_orders set \
        status = "paid" \
      where id = :id',
      {id: order_id},
      function(err, res) {
        if(err) throw err;

        cb(res);
    });
  }
}

module.exports = order;
