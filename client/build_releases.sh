#!/bin/sh

SDK_VERSION=$(cat package.json | sed -n -e '/version/ s/.*: *"\([^"]*\).*/\1/p')
echo "Building AUA JavaScript SDK v$SDK_VERSION...\n"

echo "Cleaning up old builds...\n"
rm -rf dist lib

echo "Browser Release:"
AUA_BUILD=browser gulp compile
echo "Node.js Release:"
AUA_BUILD=node gulp compile
echo "React Native Release:"
AUA_BUILD=react-native gulp compile
echo "Bundling and minifying for CDN distribution:"
#gulp browserify
#gulp minify