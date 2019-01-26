'use strict';

// eslint-disable-next-line max-len
// NODE_PATH=../lambda-layer/nodejs/node_modules BUCKET=dev-webp-create--bucket--img-upload-1 node ./foo.js

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const myConfig = new AWS.Config();
myConfig.update({ region: 'us-west-2' });

const event = require('../test-event/resizeImg-event');
const { handler } = require('./resizeImg');

handler(event, {});
