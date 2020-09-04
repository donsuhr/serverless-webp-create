#!/bin/bash

__dirname=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$__dirname/../"
serverless deploy
osascript -e 'say "Berrr rrrrrrrr"'
