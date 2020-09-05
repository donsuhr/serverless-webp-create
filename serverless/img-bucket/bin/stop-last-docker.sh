#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
# foo="$(docker ps)"
last=`docker ps | awk 'FNR==2{print $1}'`
eval "docker stop $last"
