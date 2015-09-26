var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();

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
  show.reserveSeats(req.params.showid, req.body, function(data) {
    if(data.error) {
        res.status(409);
    }
    res.json(data)
  });
});

router.get('/venues/:venueid', function(req, res) {
  venue.get(req.params.venueid, function(data) { res.json(data) });
});

module.exports = router;
