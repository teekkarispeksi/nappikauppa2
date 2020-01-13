#!/bin/sh

set -e

if [ ! -f "/app/config/config.js" ]; then
  cp /app/config/config-sample.js /app/config/config.js
fi

if [ ! -f "/app/config/public/frontend-sample.js" ]; then
  cp /app/config/public/frontend-sample.js /app/config/public/frontend.js
fi

# Check if config directory symlink exists
# and create it if not
if [ ! -L /app/backend/config ]; then
  ln -s /app/config /app/backend/config
fi

exec "$@"
