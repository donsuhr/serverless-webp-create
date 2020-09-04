#!/bin/bash

__dirname=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
layerDir="$__dirname/../nodejs"
tmpDir="$__dirname/../../../../.tmp/imagemin--local/nodejs"
rm -rf "$tmpDir"
mkdir -p "$tmpDir";
cp "$layerDir/package.json" "$tmpDir/package.json"
cp "$layerDir/package-lock.json" "$tmpDir/package-lock.json"
cd "$tmpDir";
npm ci
