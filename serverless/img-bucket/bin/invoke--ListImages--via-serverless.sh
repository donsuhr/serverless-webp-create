#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "$__dirname/.."

preinstalledLayer="$__dirname/../../lambda-layers/pre-installed-for-dev/nodejs/node_modules"

NODE_PATH="$preinstalledLayer" \
    serverless invoke local \
    --function ListImages \
    --env DEBUG="ResizeImage:*,-ResizeImage:event"

