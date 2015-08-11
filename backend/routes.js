var express = require('express');
var router = express.Router();

var show = require('./show.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/shows/', function(req, res) {
  res.json(show.getAll());
});
router.get('/shows/:showid', function(req, res) {
  res.json(show.get(req.params.showid));
});

module.exports = router;
