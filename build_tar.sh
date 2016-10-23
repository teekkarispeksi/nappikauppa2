#!/bin/bash

# Builds the project and packages it to a tar ball that can then be deployed somewhere without using node or gulp.

DATE=`date +%Y%m%d-%H%M%S`
PREFIX="nappikauppa2"
OUT="${PREFIX}-${DATE}.tar.gz"

rm -r build

gulp build

mkdir build
mkdir build/log
cp -r app.js  assets/ checker/ prod.js build/
mkdir build/backend
cp -r backend/build build/backend/
ln -rs build/config build/backend/config
mkdir build/bin
cp bin/start.sh bin/stop.sh bin/config.sh build/bin
mkdir build/frontend
cp -r frontend/build build/frontend/
mkdir build/config
cp config/*-sample.js build/config/
mkdir build/db
cp db/tables.sql db/venues.sql build/db/
cp package.json build/

cd build/
npm install --production

tar -czf ../${OUT} *

cd ..

echo $OUT