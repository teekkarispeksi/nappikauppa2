import Dictionary = _.Dictionary;
'use strict';

import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export interface ISeat {
  id: number;
  row: string;
  number: string;
  x_coord: number;
  y_coord: number;
  bad_seat: boolean;
}

export interface ISection {
  id: number;
  section_title: string;
  row_name: string;
  seats: Dictionary<ISeat>;
}

export interface IVenue {
  id: number;
  description: string;
  venue_title: string;
  ticket_type: string;
  layout_src?: string;
  sections: Dictionary<ISection>;
}

export function getAll(venue_id?: number): Promise<IVenue[]> {
  return db.query('SELECT \
    venue.id as venue_id, \
    venue.title as venue_title, \
    venue.description, \
    venue.ticket_type, \
    venue.layout_src, \
    section.id as section_id, \
    section.title as section_title, \
    section.row_name, \
    seat.id as seat_id, \
    seat.row, \
    seat.number, \
    seat.x_coord, \
    seat.y_coord, \
    bad_seat \
  FROM nk2_venues venue \
  LEFT JOIN nk2_sections section ON venue.id = section.venue_id \
  LEFT JOIN nk2_seats seat ON section.id = seat.section_id '
  + (venue_id ? 'WHERE venue.id = :venue_id' : ''), {venue_id: venue_id})
  .then((dbRows0) => {
    var venues = _.values(_.groupBy(dbRows0, (dbRow: any) => dbRow.venue_id)).map((dbRows) => {
      var first = dbRows[0];
      // convert the sql results into a json tree
      // begins with venue info
      var res: IVenue = _.pick(first, ['venue_title', 'description', 'ticket_type', 'layout_src']);
      res.id = first.venue_id;

      // groupBy creates a dictionary (object) containing lists
      // so convert those lists into objects with section info
      var sections = _.groupBy(dbRows, (dbRow: any) => dbRow.section_id );
      res.sections = _.mapObject(sections, (dbRowsForSection: any) => {
        first = dbRowsForSection[0]; // dbRowsForSection is a list of seats

        var section: ISection = _.pick(first, ['section_title', 'row_name']);
        section.id = first.section_id; // we want to call this 'id' instead of 'section_id'

        // turn seats into a dictionary with indexBy and use mapObject to strip venue & section info
        var seats = _.indexBy(dbRowsForSection, (dbRow: any) => dbRow.seat_id);
        section.seats = _.mapObject(seats, (dbRowForSeat: any) => {
          var seat: ISeat = _.pick(dbRowForSeat, ['seat_id', 'row', 'number', 'x_coord', 'y_coord', 'bad_seat']);
          seat.id = dbRowForSeat.seat_id; // we want to call this 'id' instead of 'seat_id'
          return seat;
        });
        return section;
      });
      return res;
    });
    return venues;
  })
  .catch((err) => {
    log.error('Getting all venues failed', {error: err});
    throw err;
    return null;
  });
}

export function get(venue_id): Promise<IVenue> {
  return getAll(venue_id).then((venues: IVenue[]) => venues[0])
  .catch((err) => {
    log.error('Getting a venue failed', {error: err});
    throw err;
    return null;
  });
}

export function update(venue_id: number, venue: IVenue): Promise<IVenue> {
  log.info('ADMIN: Beginning venue update', {id: venue.id});
  return db.query('update nk2_venues set title = :venue_title, ticket_type = :ticket_type, layout_src = :layout_src, description = :description where id = :id', venue)
  .then((res) => {
    log.info('ADMIN: Venue updated, updating sections');
    var query_start = 'insert into nk2_sections (id, venue_id, title, row_name) values ';
    var insert_values = _.values(venue.sections).map((section: ISection) => db.format('(:id, :venue_id, :section_title, :row_name)', _.extend({venue_id: venue_id}, section)));
    var query_end = ' on duplicate key update title = values(title), row_name = values(row_name)';
    return db.query(query_start + insert_values.join(',') + query_end);
  })
  .then((res) => {
    log.info('ADMIN: Sections updated, updating seats');
    var query_start = 'insert into nk2_seats (id, bad_seat) values ';
    var insert_values = _.flatten(_.values(venue.sections).map((section: ISection) => _.values(section.seats)))
                         .map((seat: ISeat) => db.format('(:id, :bad_seat)', _.extend({venue_id: venue_id}, seat)));
    var query_end = ' on duplicate key update bad_seat = values(bad_seat)';

    return db.query(query_start + insert_values.join(',') + query_end).then(() => {
      log.info('ADMIN: Seats updated, returning venue');
      return get(venue_id);
    });
  })
  .catch((err) => {
    log.error('ADMIN: Updating a venue failed', {error: err});
    throw err;
    return null;
  });
}
