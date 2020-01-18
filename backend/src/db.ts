'use strict';

var config = require('../config/config.js');
import log = require('./log');
import mysql = require('mysql');


config.db.dateStrings = true;
var db = mysql.createPool(config.db);

db.on('error', function(err) {
  log.error('Database query failed without callbacks', {error: err});
  throw err;
});

/**
 * Helper for handling database errror logging
 * @param err Mysql error
 */
function logDbError(err: mysql.IError) {
  // Log error if this is not mysql error
  if (!err.errno) {
    log.error('DB: Node or protocol error', {error: err});
    return;
  }

  switch (err.errno) {
    case 1062:
      // ER_DUP_ENTRY
      // Duplicate entry error
      log.warn(`DB: ${err.message}`, {error: err});
      break;
    default:
      // Default error handling
      log.error(`DB: Database error: ${err.message}`, {error: err});
      break;
  }
}

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
        logDbError(err);
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


