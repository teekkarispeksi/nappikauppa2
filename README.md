Nappikauppa 2
=============

Initial setup
-------------

1. Copy config/config-sample.js to config/config.js and modify as needed
2. Run db/tables.sql, db/venues.sql and db/test-data.sql against your database (e.g. `mysql nappikauppa2 < db/tables.sql)


Running the dev enviroment
-------------

( Assuming that you have [npm](https://www.npmjs.com/) installed )

1. `npm install` for installing dependencies
2. Run `gulp`
3. Go to [http://localhost:3000/](http://localhost:3000/)

Deploying to production
-------------

Only deploy from clean `main` branch to real production!

First time:

1. Run `./build_tar.sh`
2. Run `./deploy_tar.sh TARFILE HOST DIRECTORY --deploy-only`
to upload and unpack the package into HOST:DIRECTORY (must exist).
3. Do initial setup on server (see above)
4. Start using `bin/start.sh`

Afterwards:
1. Run `./build_tar.sh`
2. Run `./deploy_tar.sh TARFILE HOST DIRECTORY --deploy-only`


Adding typings
-------------

Use `typings` (e.g. `npm install --global typings`)
