#!/bin/bash

__dirname="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

envFile="$__dirname/../../../.env"
# --env DEBUG="*" \

cat "$__dirname/../test/fixture/event/GetFirebaseToken.json" \
    | docker run --rm -i \
    --env-file="$envFile" \
    --env DOCKER_LAMBDA_USE_STDIN=1 \
    --env DATABASE_URL="https://video-transcoder-776cd.firebaseio.com/" \
    --env AWS_LAMBDA_FUNCTION_TIMEOUT=5 \
    --env AUTH0_DOMAIN="cmc.auth0.com" \
    --volume "$__dirname/../":/var/task:ro,delegated \
    --volume "$__dirname/../layers/GetFirebaseToken/nodejs":/opt/nodejs:ro,delegated \
    lambci/lambda:nodejs12.x \
    handlers/index.handler

