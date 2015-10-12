// run with 'node prod.js' to launch the server
var config = require('./config/config.js');
var app = require('./app.js');
app.listen(config.port);
