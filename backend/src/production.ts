'use strict';

import db = require('./db');
import log = require('./log');
import order = require('./order');
import _ = require('underscore');
import promise = require('es6-promise');
import moment = require('moment-timezone');

export interface IProduction {
  id: number;
  title: string;
  performer: string;
  opens: string;
  active: boolean;
  description: string;
}

export function getLatestActive(): Promise<IProduction> {
  return db.query('SELECT \
      id, title, performer, opens, active, description \
    FROM nk2_productions \
    WHERE active = TRUE \
    ORDER BY opens DESC \
    LIMIT 1')
  .then((rows) => {
    var production: IProduction = rows[0];
    production.opens = moment(production.opens).tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss'); // convert times to local (Helsinki) time strings
    return production;
  })
  .catch((err) => {
    log.error('Getting the latest active production failed', {error: err});
    throw err;
    return null;
  });
}

export function getAll(production_id?: number): Promise<IProduction[]> {
  return db.query('SELECT \
      id, title, performer, opens, active, description \
    FROM nk2_productions ' +
    (production_id ? 'WHERE id = :id' : ''), {id: production_id})
  .then((rows) => {
    var productions: IProduction[] = rows.map((production) => {
      production.opens = moment(production.opens).tz('Europe/Helsinki').format('YYYY-MM-DDTHH:mm:ss'); // convert times to local (Helsinki) time strings
      return production;
    });
    return productions;
  })
  .catch((err) => {
    log.error('Getting the latest active production failed', {error: err});
    throw err;
    return null;
  });
}

export function get(production_id): Promise<IProduction> {
  return getAll(production_id).then((productions: IProduction[]) => productions[0])
  .catch((err) => {
    log.error('Getting a production failed', {error: err});
    throw err;
    return null;
  });
}

export function create(production: IProduction): Promise<IProduction> {
  log.info('ADMIN: Beginning production creation', production);
  return db.query('insert into nk2_productions (title, performer, opens, active, description) values (:title, :performer, :opens, :active, :description)', production)
  .then((res) => {
    var production_id = parseInt(res.insertId);
    log.info('ADMIN: Production created, returning production', {production_id: production_id});
    return get(production_id);
  })
  .catch((err) => {
    log.error('ADMIN: Creating a production failed', {error: err});
    throw err;
    return null;
  });
}

export function update(production_id: number, production: IProduction): Promise<IProduction> {
  log.info('ADMIN: Beginning production update', production);
  return db.query('update nk2_productions set title = :title, performer = :performer, opens = :opens, active = :active, description = :description where id = :id', production)
  .then((res) => {
    log.info('ADMIN: Production updated', {production_id: production_id});
    return get(production_id);
  })
  .catch((err) => {
    log.error('ADMIN: Updating a production failed', {error: err});
    throw err;
    return null;
  });
}
