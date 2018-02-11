#!/bin/bash

# Copies important parts of the already-built project into "build/"

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
cp package.json yarn.lock build/
