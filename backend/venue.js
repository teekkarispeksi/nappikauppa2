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
        var res = _.pick(first, ['venue_title', 'description', 'ticket_type']);

        // groupBy creates a dictionary (object) containing lists
        // so convert those lists into objects with section info
        var sections = _.groupBy(rows, function(row) { return row.section_id;});
        res.sections = _.mapObject(sections, function(rowsForSection) {
          first = rowsForSection[0]; // rowsForSection is a list of seats
          var section = _.pick(first, ['section_title', 'row_name', 'seat_count']);
          section.id = first.section_id;

          // turn seats into a dictionary with indexBy and use mapObject to strip venue & section info
          var seats = _.indexBy(rowsForSection, function(row) { return row.seat_id;});
          section.seats = _.mapObject(seats, function(rowForSeat) {
            var seat = _.pick(rowForSeat, ['seat_id', 'row', 'number', 'x_coord', 'y_coord', 'bad_seat']);
            seat.id = rowForSeat.seat_id;
            return seat;
          });
          return section;
        });
        cb(res);
      });
  }
};

module.exports = venue;
