'use strict';

var config = require('../config/config.js');
import db = require('./db');
import log = require('./log');
import _ = require('underscore');

export interface ITicket {
  id: number;
  hash: string;
  order_id: number;
  used_time: Date;
  show_id: number;
  show_date: Date;
  show_title: string;
  discount_group: string;
}

export function getAll(): Promise<ITicket[]> {
  return db.query('select \
      tickets.id id,  \
      tickets.show_id,\
      tickets.hash hash, \
      tickets.used_time,\
      \
      orders.id order_id,\
      \
      shows.title show_title, \
      date_format(shows.time, "%e.%c.%Y") show_date,  \
      \
      seats.row row, \
      seats.number seat, \
      \
      sections.title section_title, \
      sections.row_name row_name, \
      \
      discount_groups.title discount_group \
    from nk2_orders orders \
    join nk2_tickets tickets on orders.id = tickets.order_id \
    join nk2_shows shows on tickets.show_id = shows.id \
    join nk2_seats seats on tickets.seat_id = seats.id \
    join nk2_sections sections on seats.section_id = sections.id \
    join nk2_discount_groups discount_groups on tickets.discount_group_id = discount_groups.id');
}

export function use(tickets: any[]): Promise<any> {
  console.log(tickets);
  var query = 'insert into nk2_tickets (id, used_time) values ';
  query += tickets.map((ticket) => db.format('(:id, :used_time)', {id: ticket.id, used_time: new Date(ticket.used_time)})).join(',');
  query += ' on duplicate key update used_time = values(used_time)';
  console.log(query);
  return db.query(query);
}
