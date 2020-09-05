#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

# NODE_PATH="/opt/nodejs/node12/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules"
# NODE_PATH="/opt/get-firebase-token-layer/nodejs/node_modules:$NODE_PATH"

NODE_PATH_IMAGEMIN="$__dirname/../../../.tmp/imagemin--local/nodejs/node_modules"
NODE_PATH_GET_FIREBASE="$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs/node_modules"
NODE_PATH_PRE_INSTALLED="$__dirname/../../lambda-layers/pre-installed-for-dev/nodejs/node_modules"

NODE_PATH="${NODE_PATH_IMAGEMIN}:${NODE_PATH_GET_FIREBASE}:${NODE_PATH_PRE_INSTALLED}"

NODE_PATH="$NODE_PATH" \
    LOCAL_TEST=1 \
    BUCKET="dev-webp-create--bucket--img-upload-2" \
    AWS_PROFILE="ecs-test" \
    AWS_REGION="us-west-2" \
    DATABASE_URL="https://video-transcoder-776cd.firebaseio.com/" \
    DEBUG="ResizeImage:*,-ResizeImage:event" \
    LIBWEBP_PATH="/Users/bill/Downloads/libwebp-1.1.0-mac-10.15/bin" \
    LIBAVIF_PATH="/Users/bill/Desktop/libavif/build" \
    node "$__dirname/../lib/invoke--ResizeImage--via-node.js"
