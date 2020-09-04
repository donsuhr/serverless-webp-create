#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
layerDir="$__dirname/.."
cd "$layerDir"

DOCKER_BUILDKIT=1 docker build --output . . 
