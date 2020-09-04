#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

NODE_PATH="/opt/nodejs/node12/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules"
NODE_PATH="/opt/get-firebase-token-layer/nodejs/node_modules:$NODE_PATH"

envFile="$__dirname/../../../.env"

cat "$__dirname/../test/event/ResizeImage.json" \
    | docker run --rm \
    --interactive \
    --env-file="$envFile" \
    --env DOCKER_LAMBDA_USE_STDIN=1 \
    --env LOCAL_TEST=0 \
    --env BUCKET="dev-webp-create--bucket--img-upload-2" \
    --env DATABASE_URL="https://video-transcoder-776cd.firebaseio.com/" \
    --env DEBUG="*" \
    --env NODE_PATH="$NODE_PATH" \
    --env LIBWEBP_PATH="/opt/libwebp-1.1.0/bin" \
    --volume "$__dirname/../":/var/task:ro,delegated \
    --volume "$__dirname/../../lambda-layers/imagemin/nodejs":/opt/nodejs:ro,delegated \
    --volume "$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs":/opt/get-firebase-token-layer/nodejs:ro,delegated \
    --volume "$__dirname/../../lambda-layers/libwebp":/opt/libwebp:ro,delegated \
    lambci/lambda:nodejs12.x \
    handlers/ResizeImage.handler
