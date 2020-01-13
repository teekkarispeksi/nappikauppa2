/**
 * Healtcheck process file for nappikauppa2
 * currently makes http request to endpoint /api/productions/latest
 * and expects response status code 200
 */

const config = require('./config/config');
const http = require('http');

const options = {
  host: '127.0.0.1',
  port: config.port || '3000',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode == 200) {
    process.exit(0);
  }
  else {
    console.error(`HEALTCHECK ERROR STATUS: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('HEALTCHECK ERROR');
  process.exit(1);
})

request.end();

