Nappikauppa 2
=============

Initial setup
-------------
( Assuming that you have [mysql (maridb)](https://mariadb.org/) installed )

1. Copy config/config-sample.js to config/config.js and modify as needed
2. Copy config/public/frontend-sample.js to config/public/frontend.js and modify as needed
3. Run db/tables.sql, db/venues.sql and db/test-data.sql against your database (e.g. `mysql nappikauppa2 < db/tables.sql`)
4. Run db/evolutions/01_add_production_to_discount_code.sql against your database

Running the dev enviroment
-------------

( Assuming that you have [yarn](https://yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/) installed. If using `npm`, just substitue `yarn` with `npm` in the commands below. )

1. `yarn install` for installing dependencies (including typing infos)
2. Build code and start a server. There are two options:
  * Run `yarn run dev`. This The step builds the dev version (i.e., non-minimized) using [gulp](https://gulpjs.com/) and starts a `gulp watch-and-server` process.
  * Run `yarn run build` followed by `yarn run`. This The step builds the production version (i.e., minimized) using [gulp](https://gulpjs.com/) and starts a the app server directly.
3. Go to [http://localhost:3000/](http://localhost:3000/)

`gulp` provides also other modes for building and running the server, see `gulpfile.js` for more info. Remember to either install `gulp` globally or call `./node_modules/gulp/bin/gulp.js`.

Deploying to production
-------------

Only deploy from clean `master` branch to real production!

First time:

1. Run `./build_tar.sh`
2. Run `./deploy_tar.sh TARFILE HOST DIRECTORY --deploy-only`
to upload and unpack the package into HOST:DIRECTORY (must exist).
3. Do initial setup on server (see above)
4. Start using `bin/start.sh` or alternatively use `npm start`for execution.

Afterwards:
1. Run `./build_tar.sh`
2. Run `./deploy_tar.sh TARFILE HOST DIRECTORY --deploy-only`
