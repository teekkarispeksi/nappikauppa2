var db = require('./db.js');

var shows = [
  {
    id: 0, // 1
    title : 'Enskari', // 'Enskari'
    date: '2015-03-01 19:00', // '2015-03-01 19:00'
    status: 'ON_SALE', // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
    location: 'Aleksanterin teatteri, Helsinki', // 'Aleksanterin teatteri, Helsinki'
  },
  {
    id: 1, // 1
    title : 'Toiskari', // 'Enskari'
    date: '2015-03-02 19:00', // '2015-03-01 19:00'
    status: 'ON_SALE', // INACTIVE, ON_SALE, SOLD_OUT, AT_DOORS_ONLY
    location: 'Gloria, Helsinki', // 'Aleksanterin teatteri, Helsinki'
  }
];

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
