var express = require('express');
var router = express.Router();

var show = require('./show.js');

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

module.exports = router;
