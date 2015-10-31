#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
source $DIR/config.sh

pid=$(NODE_TLS_REJECT_UNAUTHORIZED=0 nohup node $DIR/../prod.js 1>&2 & echo $!)
echo $pid > $PIDFILE
