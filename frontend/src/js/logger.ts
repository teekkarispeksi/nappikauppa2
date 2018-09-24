'use strict';

var $ = require('jquery');
const LOGGER_API_URL = 'api/log';

export function log(level: string, msg: string, meta: any) {
  $.ajax({
    url: LOGGER_API_URL,
    data: JSON.stringify({level: level, msg: msg, meta: meta}),
    dataType: 'json',
    method: 'POST',
    contentType: 'application/json'
  });
}

export function info(msg: string, meta: any) {
  log('info', msg, meta);
}

export function error(msg: string, meta: any) {
  log('error', msg, meta);
}

