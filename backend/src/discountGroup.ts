'use strict';

import db = require('./db');
import log = require('./log');
import mail = require('./mail');
import auth = require('./auth');
var config = require('../config/config.js');

export interface IDiscountGroup {
  id: number;
  discount: number;
  title: string;
  admin: boolean;
  show_id: number;
  active?: boolean;
}

export function getAll(): Promise<IDiscountGroup[]> {
  return db.query('select id, title, eur as discount, show_id, admin_only as admin, active from nk2_discount_groups');
}

export function update(groups: IDiscountGroup[]): Promise<IDiscountGroup[]> {
  log.info('ADMIN: updating discount groups', groups);
  var query_start = 'insert into nk2_discount_groups (id, title, eur, show_id, admin_only, active) values ';
  var insert_values = groups.map((group) => db.format('(:id, :title, :discount, :show_id, :admin, :active)', group));
  var query_end = ' on duplicate key update title = values(title), eur = values(eur), show_id = values(show_id), admin_only = values(admin_only), active = values(active)';
  return db.query(query_start + insert_values.join(',') + query_end)
  .then((res) => {
    log.info('ADMIN: discount groups updated');
    return getAll();
  });
}
