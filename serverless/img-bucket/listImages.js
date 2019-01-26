'use strict';

// npx serverless invoke local --function ListImages

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const { returnError, returnSuccess } = require('./format-lambda-proxy-response');

const s3 = new AWS.S3();

function processEvent(event, context) {
    // gist to include metadata
    // https://gist.github.com/mihaiserban/1f35d488405812f2bbd4b16e38e4afb5
    return s3
        .listObjects({
            Bucket: process.env.BUCKET,
        })
        .promise();
}

module.exports.handler = async (event, context) => {
    console.log('Auth-Jwt Received event: ', JSON.stringify(event, null, 2));
    console.log('Auth Jwt Context', JSON.stringify(context, null, 2));

    try {
        return returnSuccess(await processEvent(event, context));
    } catch (e) {
        return returnError(context.requestId, e);
    }
};
