#!/bin/bash

# Copies default configuration files, if no config files are presented
if [ ! -f config/public/frontend.js ]; then
  echo "No frontend config file present"
  echo "Copying config/public/frontend-sample.js to config/public/frontend.js..."
  cp config/public/frontend-sample.js config/public/frontend.js
fi

if [ ! -f config/config.js ]; then
  echo "No backend config file present"
  echo "Copying config/config-sample.js to config/config.js..."
  cp config/config-sample.js config/config.js
fi
