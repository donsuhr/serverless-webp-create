'use strict';

const stream = require('stream');
const { inspect } = require('util');
const AWS = require('aws-sdk');
const debug = require('debug');
const Busboy = require('busboy');
const {
    returnError,
    returnSuccess,
} = require('../lib/format-lambda-proxy-response');

const debugEvent = debug('PostImage:event');
const debugUpload = debug('PostImage:upload');

// eslint-disable-next-line no-use-before-define
if (isLocalTest()) {
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

const s3 = new AWS.S3();

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

function getS3writeStream(key, ContentType) {
    const pass = new stream.PassThrough();

    const manager = s3.upload({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: pass,
        ACL: 'public-read',
        ContentType,
    });

    manager.on('httpUploadProgress', (progress) => {
        debugUpload('progress', progress);
    });
    return { writableStream: pass, promise: manager.promise() };
}

function bb(event) {
    const files = [];
    const busboy = new Busboy({ headers: event.headers });
    const promise = new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            debugUpload(
                `File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`,
            );
            file.on('data', (data) => {
                debugUpload(`File [${fieldname}] got ${data.length} bytes`);
            });
            file.on('end', () => {
                debugUpload(`File [${fieldname}] Finished`);
            });
            const key = `src/${filename}`;
            const s3Upload = getS3writeStream(key, mimetype);
            files.push(s3Upload);
            file.pipe(s3Upload.writableStream);
        });

        busboy.on(
            'field',
            (
                fieldname,
                val,
                fieldnameTruncated,
                valTruncated,
                encoding,
                mimetype,
            ) => {
                debugUpload(`Field [${fieldname}]: value: ${inspect(val)}`);
            },
        );

        busboy.on('finish', () => {
            debugUpload('Done parsing form!');
        });
        // busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
        busboy.end(
            event.body,
            event.isBase64Encoded ? 'base64' : 'binary',
            () => {
                resolve(files);
            },
        );
    });
    return {
        writableStream: busboy,
        promise,
    };
}

async function processEvent(event, context) {
    const s3uploads = await bb(event).promise;
    const uploads = await Promise.all(s3uploads.map((x) => x.promise));
    return {
        uploads,
    };
}

module.exports.handler = async (event, context) => {
    const headers = Object.keys(event.headers);
    headers.forEach((key) => {
        event.headers[key.toLowerCase()] = event.headers[key];
    });
    if (
        event.headers.debug
        && event.headers.debug.includes('PostImage:event')
    ) {
        debugEvent.enabled = true;
    }
    if (
        event.headers.debug
        && event.headers.debug.includes('PostImage:upload')
    ) {
        debugUpload.enabled = true;
    }
    debugEvent('Received event: ', JSON.stringify(event, null, 2));
    debugEvent('Context', JSON.stringify(context, null, 2));
    try {
        return returnSuccess(await processEvent(event, context));
    } catch (e) {
        return returnError(context.requestId, e);
    }
};
