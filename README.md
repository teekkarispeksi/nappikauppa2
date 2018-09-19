Nappikauppa 2
=============
[![CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2.svg?style=svg)](https://circleci.com/gh/teekkarispeksi/nappikauppa2)


Running the dev enviroment
-------------

(Assuming that you have [docker](https://www.docker.com) installed)

( Assuming that you have [yarn](https://yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/) installed. If using `npm`, just substitue `yarn` with `npm` in the commands below. )

1. `yarn install` for installing dependencies (including typing infos)
2. Build code and start a server.
  Run `yarn run dev`. Following steps will be executed:
  * Test if relevant config files are found, if not those files are created.
  * Builds database container for test enviroment if not found.
  * Starts database container for test enviroment.
  * Builds dev version using [gulp4](https://github.com/gulpjs/gulp/tree/4.0)
  * Starts developement server
  * Does incremental builds when source files are updated
  * After backend build, server is automatically restarted. For front-end livereload can be used for automatic reload. 
3. Go to [http://localhost:3000/](http://localhost:3000/). For admin site go to [http://localhost:3000/admin](http://localhost:3000/admin). Default username is admin and password nappiadmin5.

Initial setup for production
-------------
( Assuming that you have [mysql (maridb)](https://mariadb.org/) installed )

1. Copy config/config-sample.js to config/config.js and modify as needed
2. Copy config/public/frontend-sample.js to config/public/frontend.js and modify as needed
3. Run db/tables.sql, db/venues.sql and db/test-data.sql against your database (e.g. `mysql nappikauppa2 < db/tables.sql`)
4. Run db/evolutions/01_add_production_to_discount_code.sql against your database

**NOTICE!!!
DO NOT USE DEVELOPEMENT DOCKER DATABASE IN PRODUCTION**

Deploying to production using CircleCI
-------------

We use [pm2](http://pm2.keymetrics.io/) to run the app reliably in production. See for example [this DigitalOcean help](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04#install-pm2) for instructions on how to set it up.

We also use [CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2/) to automatically deploy new tags to a staging environment, and to deploy into production after manual approval.
To set the auto-deployment the following env variables are needed in CircleCI

`HOST`	hostname where to deploy, e.g. `user@host`
`HOST_SSHKEY`	public key of the host, i.e. result of `ssh-keyscan host`
`PRODUCTION_DIR` directory on `host` where the production app resides, e.g. `www/nappikauppa2`
`STAGING_DIR` directory on `host` where the staging app resides, e.g. `www/nappikauppa2-staging`

See `scripts/deploy_tar.sh` and `.circleci/config.yml` for details.

Deploying to production manually
-------------
We use [pm2](http://pm2.keymetrics.io/) to run the app reliably in production. See for example [this DigitalOcean help](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04#install-pm2) for instructions on how to set it up.

First time:
1. When a tag is created, CircleCI builds a `.tar.gz` artifact. Download that artifact (later known as `TARFILE`) from [CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2/).
2. Run `./scripts/deploy_tar.sh -f TARFILE -h HOST -d DIRECTORY -D`
to upload and unpack the package into HOST:DIRECTORY (must exist) without starting the app (`-D`)
3. Do initial setup on server (see above)
4. Start using `pm2 start app.js --name APPNAME`.

Afterwards:
1. Download the latest artifact from [CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2/)
2. Run `./scripts/deploy_tar.sh -f TARFILE -h HOST -d DIRECTORY -n APPNAME`

To run without `pm2`, use the deploy-only (`-D`) option of `deploy_tar.sh` or upload and unpack the tar manually, and start by running `node app.js`, `yarn start` or `npm start` on the host.
