#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

NODE_PATH="/opt/nodejs/node12/node_modules:/opt/nodejs/node_modules:/var/runtime/node_modules"
NODE_PATH="/opt/get-firebase-token-layer/nodejs/node_modules:$NODE_PATH"

docker run --rm \
    --interactive \
    --tty \
    --env NODE_PATH="$NODE_PATH" \
    --volume "$__dirname/../":/var/task:ro,delegated \
    --volume "$__dirname/../../lambda-layers/imagemin/nodejs":/opt/nodejs:ro,delegated \
    --volume "$__dirname/../../get-firebase-token/layers/GetFirebaseToken/nodejs":/opt/get-firbase-token-layer/nodejs:ro,delegated \
    --volume "$__dirname/../../lambda-layers/libwebp":/opt/libwebp:ro,delegated \
    lambci/lambda:build-nodejs12.x \
    bash

