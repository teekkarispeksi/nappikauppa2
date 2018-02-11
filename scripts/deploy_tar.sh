#!/bin/bash

# Deploys the packaged tar ball (see build_build.sh and .circleci/config.yml) somewhere.
# Usage: ./deploy_tar -f TARFILE -h HOST -d DIRECTORY [-s] [-D]

while getopts f:h:d:n:D option
do
 case "${option}"
 in
 f) FILE=${OPTARG};;
 h) HOST=${OPTARG};;
 d) DIR=${OPTARG};;
 n) APPNAME=${OPTARG};;
 D) DEPLOY_ONLY=true;;
 esac
done

#echo "scp $FILE $HOST:$DIR"
echo "Uploading..."
scp $FILE $HOST:$DIR

if [ -z $DEPLOY_ONLY ]
then
  echo "Stopping..."
  ssh $HOST "pm2 stop $APPNAME"
fi

echo "Cleaning old files..."
ssh $HOST "cd $DIR && rm -r node_modules backend checker frontend app.js"
echo "Unpacking $FILE..."
ssh $HOST "cd $DIR && tar -xf $FILE"

if [ -z $DEPLOY_ONLY ]
then
  echo "Starting..."
  ssh $HOST "pm2 start $APPNAME"
fi
