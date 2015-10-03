'use strict';

var config = require('../config/config.js');
var db = require('./db.js');
var md5 = require('md5');
var request = require('request');
var _ = require('underscore');

var order = {

  checkExpired: function(cb) {
    db.query('delete from nk2_orders \
      where status = "seats-reserved" \
        and timestampdiff(minute, time, now()) > :expire_minutes',
      {expire_minutes: config.expire_minutes},
      cb);
  },

  reserveSeats: function(show_id, seats, cb) {
    this.checkExpired(function() {
      db.beginTransaction(function(err) {
        if (err) {
          throw err;
        }
        db.query('insert into nk2_orders (time, status) values (now(), "seats-reserved")', function(err, res) {
          if (err) {
            return db.rollback(function() { throw err; });
          }

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
              discount_group_id: null
            });
          });

          // Actually fire what we generated above
          db.query(query_start + insert_values.join(','),
            function(err, res) {
              if (err) {
                return db.rollback(function() {
                  cb({
                    error: true,
                    order_id: null
                  });
                  throw err;
                });
              }
              db.commit();
              order.get(order_id, cb);
            });
        });
      });
    }); // pfft, that was a terrible callback-chain
  },

  createOrder: function(order_id, data, cb) {
    // make falsy to be a real NULL
    if (!data['discount_code']) {
      data['discount_code'] = null;
    }

    db.query('update nk2_orders set \
        name = :name, \
        email = :email, \
        discount_code = :discount_code, \
        status = "payment-pending" \
      where id = :id',
      data,
      function(err, res) {
        if (err) {
          throw err;
        }
        // TODO how we should really propagate these errors
        if (res.changedRows !== 1) {
          cb({
            err: true,
            errmsg: 'Should have updated one row, updated really ' + res.changedRows + ' rows'
          });
        }
        order.get(order_id, cb);
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
        orders.status, \
        \
        shows.title show_title \
      from nk2_orders orders \
      join nk2_tickets tickets on orders.id = tickets.order_id \
      join nk2_shows shows on tickets.show_id = shows.id \
      where orders.id = :id',
      {id: order_id},
      function(err, rows) {
        var first = rows[0];
        var res = _.pick(first, ['order_id', 'name', 'email', 'discount_code', 'time', 'order_price', 'payment_id',
          'reserved_until', 'reserved_session_id', 'status']);

        res.tickets = _.map(rows, function(row) {
          return _.pick(row, ['ticket_id', 'show_id', 'show_title', 'seat_id', 'discount_group_id', 'hash', 'ticket_price', 'used_time']);
        });
        cb(res);
      });
  },

  preparePayment: function(order_id, cb) {
    this.get(order_id, function(order) {
      var ticket_rows = _.map(order.tickets, function(ticket) {
        return {
          'title': 'Pääsylippu: ' + config.title + ' / ' + ticket.show_title,
          'code': ticket.ticket_id,
          'amount': '1.00',
          'price': ticket.ticket_price,
          'vat': '0.00',
          'discount': '0.00', // No discounts here. Price includes everything.
          'type': '1'
        };
      });

      var payment = {
        'orderNumber': order_id,
        'currency': 'EUR',
        'locale': 'fi_FI',
        'urlSet': {
          'success': config.base_url + '/api/orders/' + order_id + '/success',
          'failure': config.base_url + '/api/orders/' + order_id + '/failure',
          'notification': config.base_url + '/api/orders/' + order_id + '/notification',
        },
        'orderDetails': {
          'includeVat': '1',
          'contact': {
            'email': order.email,
            'firstName': order.name,
            'lastName': ' ', // these one-space-only fields are required by Paytrail, must be non-empty
            'address': {
              'street': ' ',
              'postalCode': ' ',
              'postalOffice': ' ',
              'country': 'FI'
            }
          },
          'products': ticket_rows
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
        cb({url: body.url});
      });
    });
  },

  paymentCancelled: function(order_id, params, cb) {
    var verification = [order_id, params.TIMESTAMP, config.paytrail.password].join('|');
    var verification_hash = md5(verification).toUpperCase();

    if (verification_hash === params.RETURN_AUTHCODE) {
      db.query('update nk2_orders set status = "cancelled" where id = :order_id',
        {order_id: order_id},
        function(err, res) {
          if (err) {
            throw err;
          }
          cb(res);
        });
    } else {
      // Something went terribly wrong
      // TODO: how to propagate these errors
    }
  },

  paymentDone: function(order_id, params, cb) {
    var verification = [order_id, params.TIMESTAMP, params.PAID, params.METHOD, config.paytrail.password].join('|');
    var verification_hash = md5(verification).toUpperCase();

    if (verification_hash === params.RETURN_AUTHCODE) {
      db.beginTransaction(function() {
        // TODO create ticket hash ids
        db.query('update nk2_orders set \
            status = "paid", \
            payment_id = :payment_id \
          where id = :order_id',
          {
            order_id: order_id,
            payment_id: params.PAID
          },
          function(err, res) {
            if (err) {
              db.rollback();
              throw err;
            }

            db.commit();
            cb(res);
          });
      });
    } else {
      console.log('ERRR');
      console.log('I calculated a hash of', verification_hash);
      console.log('It should have been   ', params.RETURN_AUTHCODE);
      console.log('The string was',verification);
      // Something went terribly wrong
      // TODO: how to propagate these errors
    }
  }
};

module.exports = order;
