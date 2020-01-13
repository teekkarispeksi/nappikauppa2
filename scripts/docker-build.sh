#!/bin/sh

set -e

# Move to workspace directory
cd /workspace

# Build project
gulp build

# Create build bundle
mkdir build
mkdir build/log
cp -r app.js  assets/ checker/ build/
mkdir build/backend
cp -r backend/build build/backend/
mkdir build/frontend
cp -r frontend/build build/frontend/
mkdir build/config
cp config/*-sample.js build/config/
mkdir build/config/public
cp config/public/*-sample.js build/config/public/
mkdir build/db
cp db/tables.sql db/venues.sql build/db/
cp -r db/evolutions build/db/
cp package.json package-lock.json build/
