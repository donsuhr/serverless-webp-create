#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "$__dirname/.."

imageminLayerPath="$__dirname/../../lambda-layers/imagemin/nodejs/node_modules"
thisFnLayerPath="$__dirname/../layers/GetFirebaseToken/nodejs/node_modules"
preinstalledLayer="$__dirname/../../lambda-layers/pre-installed-for-dev/nodejs/node_modules"

NODE_PATH="$imageminLayerPath:$thisFnLayerPath:$preinstalledLayer" \
    serverless invoke local \
    --function GetFirebaseToken \
    --path "$__dirname/../test/fixture/event/GetFirebaseToken.json"

