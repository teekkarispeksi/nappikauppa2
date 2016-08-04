Nappikauppa 2
=============

Initial setup (database)
-------------

1. Copy config/config-sample.js to config/config.js and modify as needed
2. Run db/tables.sql, db/venues.sql and db/test-data.sql against your database (e.g. `mysql -u root nappikauppa2 < db/tables.sql)


Running the enviroment
-------------

( Assuming that you have [npm](https://www.npmjs.com/) installed )

1. `npm install` for installing dependencies
2. Run `gulp`
3. Go to [http://localhost:3000/](http://localhost:3000/)