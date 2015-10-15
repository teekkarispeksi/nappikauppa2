'use strict';

var db = require('./db.js');
var log = require('./log.js');
var _ = require('underscore');

var venue = {

  get: function(venue_id, cb) {
    db.query('SELECT \
      venue.id as venue_id, \
      venue.title as venue_title, \
      venue.description, \
      venue.ticket_type, \
      section.id as section_id, \
      section.title as section_title, \
      section.row_name, \
      section.seat_count, \
      seat.id as seat_id, \
      seat.row, \
      seat.number, \
      seat.x_coord, \
      seat.y_coord, \
      bad_seat \
    FROM nk2_venues venue \
    JOIN nk2_sections section ON venue.id = section.venue_id \
    LEFT OUTER JOIN nk2_seats seat ON section.id = seat.section_id \
    WHERE venue.id=:venue_id',
      {venue_id: venue_id},
      function(err, rows, fields) {
        if (err) {
          log.error('Getting venue details failed', {venue_id: venue_id});
          return;
        }
        var first = rows[0];
        // convert the sql results into a json tree
        // begins with venue info
        var res = {
          id: first.venue_id,
          title: first.venue_title,
          description: first.description,
          ticket_type: first.ticket_type,
          sections: _.groupBy(rows, function(row) { return row.section_id;})
        };

        // groupBy creates a dictionary (object) containing lists
        // so convert those lists into objects with section info
        res.sections = _.mapObject(res.sections, function(rows) {
          first = rows[0]; // rows is a list of seats
          var section = {
            id: first.section_id,
            title: first.section_title,
            row_name: first.row_name,
            seat_count: first.seat_count
          };

          // if the theather has numbered seats, turn them into a dictionary
          // with indexBy and use mapObject to strip venue & section info
          if (res.ticket_type === 'numbered-seats') {
            var seats = _.indexBy(rows, function(row) { return row.seat_id;});
            seats = _.mapObject(seats, function(seat) {
              return {
                id: seat.seat_id,
                row: seat.row,
                number: seat.number,
                x: seat.x_coord,
                y: seat.y_coord,
                is_bad: seat.bad_seat
              };
            });
            section.seats = seats;
          }
          return section;
        });
        cb(res);
      });
  }
};

module.exports = venue;
