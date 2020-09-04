'use strict';

const path = require('path');
const AWS = require('aws-sdk');
const debug = require('debug');
const querystring = require('qs');

const {
    returnError,
    returnSuccess,
} = require('../lib/format-lambda-proxy-response');

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('UpdateImageMeta:event');
const debugUpdate = debug('UpdateImageMeta:update');
if (!isLocalTest()) {
    // eslint-disable-line no-use-before-define
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

const s3 = new AWS.S3();

const paramWhiteList = {
    '.png': ['speed', 'strip', 'q', 'lossless'],
    '.jpg': ['progressive', 'q', 'lossless'],
    '.gif': ['interlaced', 'optimizationLevel', 'q', 'lossless'],
};

function getS3ObjectHead(Key) {
    const params = {
        Bucket: process.env.BUCKET,
        Key,
    };

    return s3.headObject(params).promise();
}

async function updateMetadata({ key, eventBodyParams }) {
    const ext = path.extname(key);
    const newMetadata = Object.keys(eventBodyParams).reduce((acc, x) => {
        if (paramWhiteList[ext].includes(x)) {
            acc[x] = String(eventBodyParams[x]);
        }
        return acc;
    }, {});
    const { ContentType } = await getS3ObjectHead(key);

    const params = {
        Bucket: process.env.BUCKET,
        CopySource: `/${process.env.BUCKET}/${key}`,
        Key: key,
        Metadata: newMetadata,
        ContentType,
        ACL: 'public-read',
        MetadataDirective: 'REPLACE',
    };
    debugUpdate('Copy Obj Params', JSON.stringify(params, null, 2));
    return s3.copyObject(params).promise();
}

async function processEvent(event, context) {
    const key = decodeURIComponent(
        event.pathParameters.key.replace(/\+/g, ' '),
    );
    const eventBodyParams = querystring.parse(JSON.parse(event.body));
    return updateMetadata({ key, eventBodyParams });
}

module.exports.handler = async (event, context) => {
    const headers = Object.keys(event.headers);
    headers.forEach((key) => {
        event.headers[key.toLowerCase()] = event.headers[key];
    });
    if (
        event.headers.debug
        && event.headers.debug.includes('UpdateImageMeta:event')
    ) {
        debugEvent.enabled = true;
    }
    if (
        event.headers.debug
        && event.headers.debug.includes('UpdateImageMeta:update')
    ) {
        debugUpdate.enabled = true;
    }

    debugEvent('Event: ', JSON.stringify(event, null, 2));
    debugEvent('Context', JSON.stringify(context, null, 2));
    try {
        return returnSuccess(await processEvent(event, context));
    } catch (e) {
        return returnError(context.requestId, e);
    }
};
