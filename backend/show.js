var db = require('./db.js');

var show = {

  getAll: function (cb) {
    db.query('select * from nk2_shows', function(err, rows, fields) {
      cb(rows);
    });
  },

  get: function (show_id, cb) {
    db.query('select * from nk2_shows where id=?',
      [show_id],
      function(err, rows, fields) {
        cb(rows[0]);
      });
  }
};

module.exports = show;
