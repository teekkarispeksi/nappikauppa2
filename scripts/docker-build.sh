#!/bin/sh

set -e

# Move to workspace directory
cd /workspace

# Build project
gulp build

# Create build bundle
mkdir -p build/{log,backend,frontend,config/public,db}
cp -r app.js  assets/ checker/ build/
cp -r backend/build build/backend/
ln -rs build/config build/backend/config
cp -r frontend/build build/frontend/
cp config/*-sample.js build/config/
cp config/public/*-sample.js build/config/public/
cp db/tables.sql db/venues.sql build/db/
cp -r db/evolutions build/db/
cp package.json package-lock.json build/
