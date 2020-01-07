#!/bin/sh

# Move to workspace
cd /workspace

# Test if package.json file is found
if [ -f /workspace/package.json ]; then
  # Install node_modules
  npm install
fi
