Nappikauppa 2
=============
[![CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2.svg?style=svg)](https://circleci.com/gh/teekkarispeksi/nappikauppa2)

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
2. Run `./deploy_tar.sh -f TARFILE -h HOST -d DIRECTORY -D`
to upload and unpack the package into HOST:DIRECTORY (must exist) without starting the app (`-D`)
3. Do initial setup on server (see above)
4. Start using `pm2 start app.js --name APPNAME`.

Afterwards:
1. Download the latest artifact from [CircleCI](https://circleci.com/gh/teekkarispeksi/nappikauppa2/)
2. Run `./deploy_tar.sh -f TARFILE -h HOST -d DIRECTORY -n APPNAME`

