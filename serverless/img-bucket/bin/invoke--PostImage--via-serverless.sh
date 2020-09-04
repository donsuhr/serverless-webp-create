#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

cd "$__dirname/.."

thisFnLayerPath="$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs/node_modules"
preinstalledLayer="$__dirname/../../lambda-layers/pre-installed-for-dev/nodejs/node_modules"

NODE_PATH="$thisFnLayerPath:$preinstalledLayer" \
    serverless invoke local \
    --function PostImage \
    --path "$__dirname/../test/event/PostImage.json" \
    --env DEBUG="PostImage:*"

