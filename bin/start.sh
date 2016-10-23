#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
source $DIR/config.sh

pid=$(NODE_TLS_REJECT_UNAUTHORIZED=0 nohup node $DIR/../app.js > nohup.out 2>&1 < /dev/null & echo $!)
echo $pid > $PIDFILE
