#!/bin/bash

__dirname=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
layerDir="$__dirname/.."
cd "$layerDir"

docker run --rm \
   --volume "$layerDir/nodejs":/var/task \
   lambci/lambda:build-nodejs12.x \
   npm install --only=production 

