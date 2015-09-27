var config = require('../config/config.js');
var db = require('./db.js');
var request = require('request');
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

  get: function(order_id, cb) {
    db.query('select \
        tickets.id ticket_id,  \
        tickets.show_id,\
        tickets.seat_id,\
        tickets.discount_group_id, \
        tickets.hash, \
        tickets.price ticket_price, \
        tickets.used_time,\
        \
        orders.id order_id,\
        orders.name,\
        orders.email,\
        orders.discount_code,\
        orders.time,\
        orders.price order_price,\
        orders.payment_id,\
        orders.reserved_until,\
        orders.reserved_session_id,\
        orders.status \
      from nk2_orders orders \
      join nk2_tickets tickets on orders.id = tickets.order_id \
      where orders.id = :id',
      { id: order_id },
      function(err, rows) {
        var first = rows[0];
        var res = _.pick(first, ['order_id', 'name', 'email', 'discount_code', 'time', 'order_price', 'payment_id',
          'reserved_until', 'reserved_session_id', 'status']);

        res.tickets = _.map(rows, function(row) {
          return _.pick(row, ['ticket_id', 'show_id', 'seat_id', 'discount_group_id', 'hash', 'ticket_price', 'used_time'])
        })
        cb(res);
      });
  },

  preparePayment: function(order_id, cb) {
    this.get(order_id, function(order) {
      var ticket_rows = _.map(order.tickets, function(ticket) {
        return {
          "title": "Lippu", // TODO a better description, e.g. show name
          "code": ticket.ticket_id,
          "amount": "1.00",
          "price": ticket.ticket_price,
          "vat": "0.00",
          "discount": "0.00", // TODO from discount_group
          "type": "1"
        };
      });

      var payment = {
        "orderNumber": order_id,
        "currency": "EUR",
        "locale": "fi_FI",
        "urlSet": {
          "success": config.base_url + "/api/orders/" + order_id + "/success",
          "failure": config.base_url + "/api/orders/" + order_id + "/failure",
          "notification": config.base_url + "/api/orders/" + order_id + "/notification",
        },
        "orderDetails": {
          "includeVat": "1",
          "contact": {
            "email": order.email,
            "firstName": order.name,
            "lastName": " ", // these one-space-only fields are required by Paytrail, must be non-empty
            "address": {
              "street": " ",
              "postalCode": " ",
              "postalOffice": " ",
              "country": "FI"
            }
          },
          "products": ticket_rows
        }
      };

      request({
        uri: 'https://payment.paytrail.com/api-payment/create',
        method: 'POST',
        json: true,
        body: payment,
        headers: {
          'X-Verkkomaksut-Api-Version': '1'
        },
        auth: {
          'user': config.paytrail.user,
          'password': config.paytrail.password,
          'sendImmediately': true
        }
      }, function(err, response, body) {
        cb(body.url);
      });
    });
  },

  paymentDone: function(order_id, params, cb) {
    // TODO create ticket hash ids
    // TODO actually verify payment http://docs.paytrail.com/fi/index-all.html#idm133371471696

    db.query('update nk2_orders set \
        status = "paid", \
        payment_id = :payment_id \
      where id = :order_id',
      {
        order_id: order_id,
        payment_id: params.paid
      },
      function(err, res) {
        if(err) throw err;

        cb(res);
    });
  }
}

module.exports = order;
