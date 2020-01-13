'use strict';

import db = require('./db');
import log = require('./log');
import _ = require('underscore');
import Dictionary = _.Dictionary;

export interface ISeat {
  id: number;
  row: string;
  number: string;
  x_coord: number;
  y_coord: number;
  inactive: boolean;
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
    inactive \
  FROM nk2_venues venue \
  LEFT JOIN nk2_sections section ON venue.id = section.venue_id \
  LEFT JOIN nk2_seats seat ON section.id = seat.section_id '
  + (venue_id ? 'WHERE venue.id = :venue_id' : ''), {venue_id: venue_id})
  .then((dbRows0) => {
    var venues = _.values(_.groupBy(dbRows0, (dbRow: any) => dbRow.venue_id)).map((dbRows) => {
      var first = dbRows[0];
      // convert the sql results into a json tree
      // begins with venue info
      var res: IVenue = _.pick(first, ['venue_title', 'description', 'ticket_type', 'layout_src']) as IVenue;
      res.id = first.venue_id;

      // groupBy creates a dictionary (object) containing lists
      // so convert those lists into objects with section info
      var sections = _.groupBy(dbRows, (dbRow: any) => dbRow.section_id );
      res.sections = _.mapObject(sections, (dbRowsForSection: any) => {
        first = dbRowsForSection[0]; // dbRowsForSection is a list of seats

        var section: ISection = _.pick(first, ['section_title', 'row_name']) as ISection;
        section.id = first.section_id; // we want to call this 'id' instead of 'section_id'

        // turn seats into a dictionary with indexBy and use mapObject to strip venue & section info
        var seats = _.indexBy(dbRowsForSection, (dbRow: any) => dbRow.seat_id);
        section.seats = _.mapObject(seats, (dbRowForSeat: any) => {
          var seat: ISeat = _.pick(dbRowForSeat, ['seat_id', 'row', 'number', 'x_coord', 'y_coord', 'inactive']) as unknown as ISeat;
          seat.id = dbRowForSeat.seat_id; // we want to call this 'id' instead of 'seat_id'
          return seat;
        });
        return section;
      });
      if ('null' in res.sections) {
        delete res.sections['null']; // left join produces nulls when there are no sections
      }
      return res;
    });
    return venues;
  })
  .catch((err) => {
    log.error('Getting all venues failed', {error: err});
    return Promise.reject(err);
  });
}

export function get(venue_id): Promise<IVenue> {
  return getAll(venue_id).then((venues: IVenue[]) => venues[0])
  .catch((err) => {
    log.error('Getting a venue failed', {error: err});
    return Promise.reject(err);
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
    var query_start = 'insert into nk2_seats (id, section_id, row, number, x_coord, y_coord, inactive) values ';

    var insert_values = _.values(_.mapObject(venue.sections, (section) =>
      _.values(section.seats).map((seat) => db.format('(:id, :section_id, :row, :number, :x_coord, :y_coord, :inactive)', _.extend({section_id: section.id}, seat)))
    ));
    var query_end = ' on duplicate key update section_id = values(section_id), row = values(row), number = values(number), \
    x_coord = values(x_coord), y_coord = values(y_coord), inactive = values(inactive)';

    return db.query(query_start + insert_values.join(',') + query_end).then(() => {
      log.info('ADMIN: Seats updated, returning venue');
      return get(venue_id);
    });
  })
  .catch((err) => {
    log.error('ADMIN: Updating a venue failed', {error: err});
    return Promise.reject(err);
  });
}

export function create(venue: IVenue): Promise<IVenue> {
  log.info('ADMIN: Beginning venue creationg');
  var venue_id: number = null;
  return db.query('insert into nk2_venues (title, ticket_type, layout_src, description) values (:venue_title, :ticket_type, :layout_src, :description)', venue)
  .then((res) => {
    venue_id = res.insertId;
    log.info('ADMIN: Venue created, creating sections', {venue_id: venue_id});
    return _.values(venue.sections).reduce((promise, section) => {
      return promise.then(() => db.query('insert into nk2_sections (venue_id, title, row_name) values (:venue_id, :section_title, :row_name)', _.extend({venue_id: venue_id}, section)))
      .then((res2) => {
        var section_id = res2.insertId;
        log.info('ADMIN: Section created, creating seat', {section_id: section_id});
        var query_start = 'insert into nk2_seats (section_id, row, number, x_coord, y_coord, inactive) values ';
        var insert_values = _.values(section.seats).map((seat: ISeat) => db.format('(:section_id, :row, :number, :x_coord, :y_coord, :inactive)', _.extend({section_id: section_id}, seat)));
        return db.query(query_start + insert_values.join(','));
      });
    }, Promise.resolve());
  })
  .then((res) => {
    log.info('ADMIN: New venue created, returning');
    return get(venue_id);
  })
  .catch((err) => {
    log.error('ADMIN: Creating a venue failed', {error: err});
    return Promise.reject(err);
  });
}
