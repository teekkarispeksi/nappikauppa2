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
