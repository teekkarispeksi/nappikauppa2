#!/bin/bash

# Packages built code to a tar ball that can then be deployed somewhere without using npm or gulp.

PREFIX="nappikauppa2"
OUT="${PREFIX}.tar.gz"

pushd build/ > /dev/null
yarn install --production

tar -czf ../${OUT} *
popd > /dev/null
