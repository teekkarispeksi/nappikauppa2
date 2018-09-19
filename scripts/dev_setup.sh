#!/bin/bash

# Copies default configuration files, if no config files are presented
if [ ! -f config/public/frontend-sample.js ]; then
  echo "No frontend config file presented"
  echo "Copying config/public/frontend-sample.js to config/public/frontend.js..."
  cp config/public/frontend-sample.js config/public/frontend.js
fi

if [ ! -f config/config.js ]; then
  echo "No backend config file"
  echo "Copying config/config-sample.js to config/config.js..."
  cp config/config-sample.js config/config.js
fi

# Starting test docker database with rebuilding database container
echo "Starting test database container..."
cd docker/nappikauppa2-test/
docker-compose up -d --build