#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
source $DIR/config.sh

kill $(cat $PIDFILE)
