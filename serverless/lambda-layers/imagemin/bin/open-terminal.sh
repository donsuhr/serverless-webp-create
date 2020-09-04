#!/bin/bash

__dirname=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
layerDir="$__dirname/.."
cd "$layerDir"

docker run --rm \
   --interactive --tty \
   --volume "$layerDir/nodejs":/opt/nodejs \
   --workdir "/opt/nodejs" \
   lambci/lambda:build-nodejs12.x \
   bash

