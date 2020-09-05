#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "$__dirname/.."

imageminLayerPath="$__dirname/../../../.tmp/imagemin--local/nodejs/node_modules"
thisFnLayerPath="$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs/node_modules"
preinstalledLayer="$__dirname/../../lambda-layers/pre-installed-for-dev/nodejs/node_modules"

NODE_PATH="$imageminLayerPath:$thisFnLayerPath:$preinstalledLayer" \
    serverless invoke local \
    --function ResizeImage \
    --path "$__dirname/../test/event/ResizeImage.json" \
    --env LIBWEBP_PATH="/Users/bill/Downloads/libwebp-1.1.0-mac-10.15/bin" \
    --env LIBAVIF_PATH="/Users/bill/Desktop/libavif/build" \
    --env DEBUG="ResizeImage:*,-ResizeImage:event"

