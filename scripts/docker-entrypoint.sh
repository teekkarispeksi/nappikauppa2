#!/bin/sh

set -e

if [! -f "/app/config/config.js" ]; then
  cp /app/config/config-sample.js /app/config/config.js
fi

if [! -f "/app/config/public/frontend-sample.js"]; then
  cp /app/config/public/frontend-sample.js /app/config/public/frontend.js
fi

exec "node $@"
