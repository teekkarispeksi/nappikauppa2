var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

var order = require('./order.js');
var show = require('./show.js');
var venue = require('./venue.js');

var jsonParser = bodyParser.json();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/shows/', function(req, res) {
  show.getAll(function(data) { res.json(data) });
});

router.get('/shows/:showid', function(req, res) {
  show.get(req.params.showid, function(data) { res.json(data) });
});

router.get('/shows/:showid/reservedSeats', function(req, res) {
  show.getReservedSeats(req.params.showid, function(data) { res.json(data) });
});

router.post('/shows/:showid/reserveSeats', jsonParser, function(req, res) {
  order.reserveSeats(req.params.showid, req.body, function(data) {
    if(data.error) {
        res.status(409);
    }
    res.json(data)
  });
});

router.patch('/orders/:orderid', jsonParser, function(req, res) {
    order.createOrder(req.body.id, req.body, function(data) { res.json(data) });
});

router.post('/orders/:orderid/preparePayment', function(req, res) {
    order.preparePayment(req.params.orderid, function(data) { res.json(data); })
});

router.get('/orders/:orderid/success', function(req, res) {
    order.paymentDone(req.params.orderid, req.query, function() { res.redirect('/#ok'); }); // TODO redirect somewhere
})

router.get('/venues/:venueid', function(req, res) {
  venue.get(req.params.venueid, function(data) { res.json(data) });
});

module.exports = router;
