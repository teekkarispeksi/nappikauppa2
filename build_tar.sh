#!/bin/bash

# Builds the project and packages it to a tar ball that can then be deployed somewhere without using node or gulp.

DATE=`date +%Y%m%d-%H%M%S`
TAG=`git describe --tags`
PREFIX="nappikauppa2"
OUT="${PREFIX}-${TAG}.tar.gz"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo 'Commit first to get a unique tag description.'
  exit 1
fi

TMP=`mktemp -d 2>/dev/null || mktemp -d -t 'mytmpdir'`

echo 'Building in' ${TMP}

cp -r * ${TMP}/

pushd ${TMP} > /dev/null

rm -r build

gulp build

mkdir build
mkdir build/log
cp -r app.js  assets/ checker/ build/
mkdir build/backend
cp -r backend/build build/backend/
ln -rs build/config build/backend/config
mkdir build/bin
cp bin/start.sh bin/stop.sh bin/config.sh build/bin
mkdir build/frontend
cp -r frontend/build build/frontend/
mkdir build/config
cp config/*-sample.js build/config/
mkdir build/config/public
cp config/public/*-sample.js build/config/public/
mkdir build/db
cp db/tables.sql db/venues.sql build/db/
cp -r db/evolutions build/db/
cp package.json build/

pushd build/ > /dev/null
npm install --production

tar -czf ../${OUT} *
popd > /dev/null
popd > /dev/null

if cp ${TMP}/${OUT} ./; then
  rm -r ${TMP}
  echo $OUT
else
  echo 'Failed to copy archive back, check if' ${OUT} 'exists already'
fi
