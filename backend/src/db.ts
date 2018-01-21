'use strict';

var config = require('../config/config.js');
import log = require('./log');
import mysql = require('mysql');
import promise = require('es6-promise');

var Promise = promise.Promise;

config.db.dateStrings = true;
var db = mysql.createPool(config.db);

db.on('error', function(err) {
  log.error('Database query failed without callbacks', {error: err});
  throw err;
});

// Use :param style binding instead of question marks
export function format(query: string, values?: {}) {
  if (!values) {
    return query;
  }

  return query.replace(/:(\w+)/g, ((txt, key) => {
    if (values.hasOwnProperty(key)) {
      return mysql.escape(values[key]);
    }
    return txt;
  }).bind(this));
};

export function beginTransaction(): Promise<mysql.IConnection> {
  return new Promise<mysql.IConnection>((resolve, reject) => {
    db.getConnection((err, connection) => {
      err ? reject(err) : connection.beginTransaction((err2) => {
        err ? reject(err2) : resolve(connection);
      });
    });
  });
}

export function query(query: string, params?: {}, connection?: mysql.IConnection): Promise<any> {
  return new Promise((resolve, reject) => {
    var sql = format(query, params);
    var handle = connection || db;
    handle.query(sql, (err, res) => {
      if (err) {
        log.error('DB error when executing query: \n', sql);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

export function commit(connection: mysql.IConnection): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.commit((err) => {
      connection.release();
      err ? reject(err) : resolve();
    });
  });
}

export function rollback(connection: mysql.IConnection): Promise<any> {
  return new Promise((resolve, reject) => {
    connection.rollback(resolve);
    connection.release();
  });
}
