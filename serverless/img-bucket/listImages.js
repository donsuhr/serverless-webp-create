'use strict';

// npx serverless invoke local --function ListImages

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const {
    returnError,
    returnSuccess,
} = require('./format-lambda-proxy-response');

const s3 = new AWS.S3();

function getS3ObjectHead(Key) {
    const params = {
        Bucket: process.env.BUCKET,
        Key,
    };

    return s3.headObject(params).promise();
}

function filterFolders(x) {
    return !x.Key.endsWith('/');
}

async function includeMetaOnSrcFiles(x) {
    if (x.Key.startsWith('src/')) {
        x.head = await getS3ObjectHead(x.Key);
    }
    return x;
}

async function processEvent(event, context) {
    // gist to include metadata
    // https://gist.github.com/mihaiserban/1f35d488405812f2bbd4b16e38e4afb5
    const data = await s3
        .listObjects({
            Bucket: process.env.BUCKET,
        })
        .promise();
    const pArray = data.Contents.filter(filterFolders).map(
        includeMetaOnSrcFiles,
    );
    const items = await Promise.all(pArray);
    return { items };
}

module.exports.handler = async (event, context) => {
    // console.log('Received event: ', JSON.stringify(event, null, 2));
    // console.log('Context', JSON.stringify(context, null, 2));

    try {
        return returnSuccess(await processEvent(event, context));
    } catch (e) {
        return returnError(context.requestId, e);
    }
};
