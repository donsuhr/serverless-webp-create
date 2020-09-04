'use strict';

const AWS = require('aws-sdk');

const myConfig = new AWS.Config();
myConfig.update({ region: 'us-west-2' });

const event = require('../test/event/ResizeImage.json');
const { handler } = require('../handlers/ResizeImage');

handler(event, {});
