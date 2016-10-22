#!/bin/bash

# Deploys the packaged tar ball (see build_tar.sh) somewhere.

echo "scp $1 $2:$3"
scp $1 $2:$3

if [ ! "$4" = "--deploy-only" ]
then
  echo "Stopping..."
  ssh $2 "cd $3 && bin/stop.sh"
fi

echo "Cleaning old files..."
ssh $2 "cd $3 && rm -r node_modules backend checker frontend prod.js"
echo "Unpacking $1..."
ssh $2 "cd $3 && tar -xf $1"

if [ ! "$4" = "--deploy-only" ]
then
  echo "Starting..."
  ssh $2 "cd $3 && bin/start.sh"
fi
