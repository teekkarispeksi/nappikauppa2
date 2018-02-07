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

( Assuming that you have [npm](https://www.npmjs.com/) and [gulp](https://gulpjs.com/) installed )

1. `npm install` for installing dependencies (including typing infos)
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
4. Start using `bin/start.sh` or alternatively use `npm start`for execution.

Afterwards:
1. Run `./build_tar.sh`
2. Run `./deploy_tar.sh TARFILE HOST DIRECTORY --deploy-only`

Typescript Errors
--------------
In the case of 

In file `node_modules/@types/requirejs/index.d.ts` change the line `declare var require: Require;` into `declare var require: NodeRequire;`, and in `node_modules/@types/node/index.d.ts` change the line `declare var require: NodeRequire;` into `declare var require: NodeRequire;`

Not that this is a workaround and will be undone when the types for `node` and/or `requirejs` are updated.
