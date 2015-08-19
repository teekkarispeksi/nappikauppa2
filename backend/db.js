var config = require('../config/config.js');
var mysql = require('mysql');

var db = mysql.createConnection(config.db);

module.exports = db;
