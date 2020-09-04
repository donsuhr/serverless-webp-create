#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
layerDir="$__dirname/../layers/GetFirebaseToken/nodejs"

docker run --rm \
   --interactive --tty \
   --volume "$layerDir":/opt/nodejs \
   --workdir /opt/nodejs \
   lambci/lambda:build-nodejs12.x \
   bash

