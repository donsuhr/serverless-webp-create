#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
layerDir="$__dirname/../layers/GetFirebaseToken/nodejs"

docker run --rm \
   --volume "$layerDir":/var/task \
   lambci/lambda:build-nodejs12.x \
   npm install --only=production 

