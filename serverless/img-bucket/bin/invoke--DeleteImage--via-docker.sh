#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

NODE_PATH="/opt/nodejs/node12/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules"
NODE_PATH="/opt/get-firebase-token-layer/nodejs/node_modules:$NODE_PATH"

envFile="$__dirname/../../../.env"

cat "$__dirname/../test/event/DeleteImage.json" \
    | docker run --rm \
    --interactive \
    --env-file="$envFile" \
    --env DOCKER_LAMBDA_USE_STDIN=1 \
    --env BUCKET="dev-webp-create--bucket--img-upload-2" \
    --env DATABASE_URL="https://video-transcoder-776cd.firebaseio.com/" \
    --env DEBUG="DeleteImage:*" \
    --env NODE_PATH="$NODE_PATH" \
    --volume "$__dirname/../":/var/task:ro,delegated \
    --volume "$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs":/opt/get-firebase-token-layer/nodejs:ro,delegated \
    lambci/lambda:nodejs12.x \
    handlers/DeleteImage.handler
