import {IError} from "mysql";
'use strict';

var config = require('../config/config.js');
import log = require('./log');
import mysql = require('mysql');
import promise = require('es6-promise');

var Promise = promise.Promise;

var db = mysql.createConnection(config.db);

db.on('error', function(err) {
  log.error('Database query failed without callbacks', {error: err});
  throw err;
});

// prevent connection time-out
setInterval(function() {
  db.query('SELECT 1');
}, 5000);

// Use :param style binding instead of question marks
db.config.queryFormat = function(query: string, values?: string[]) {
  if (!values) {
    return query;
  }

  return query.replace(/:(\w+)/g, function(txt, key) {
    if (values.hasOwnProperty(key)) {
      return this.escape(values[key]);
    }
    return txt;
  }.bind(this));
};

export function beginTransaction(): Promise<any> {
  return new Promise((resolve, reject) => {
    db.beginTransaction(function(err) {
      err ? reject(err) : resolve();
    });
  });
}

export function query(query: string, params?: {}): Promise<any> {
  return new Promise((resolve, reject) => {
    db.query(query, params, function(err, res) {
      err ? reject(err): resolve(res);
    });
  });
}

export function commit(): Promise<any> {
  return new Promise((resolve, reject) => {
    db.commit(function(err) {
      err ? reject(err) : resolve();
    });
  });
}

export function rollback(): Promise<any> {
  return new Promise((resolve, reject) => {
    db.rollback(resolve);
  });
}

export function format(sql: string, values?: any) {
  return db.format(sql, values);
}
