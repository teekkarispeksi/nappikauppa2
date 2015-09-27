var config = require('../config/config.js');
var mysql = require('mysql');

var db = mysql.createConnection(config.db);

// Use :param style binding instead of question marks
db.config.queryFormat = function (query, values) {
  if (!values) return query;
  return query.replace(/\:(\w+)/g, function (txt, key) {
    if (values.hasOwnProperty(key)) {
      return this.escape(values[key]);
    }
    return txt;
  }.bind(this));
};

module.exports = db;
