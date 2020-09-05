'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const AWS = require('aws-sdk');
const firebase = require('firebase-admin');
const debug = require('debug');
const {
    returnError,
    returnSuccess,
} = require('../lib/format-lambda-proxy-response');

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('DeleteImage:event');
const debugDelete = debug('DeleteImage:delete');
if (!isLocalTest()) {
    // eslint-disable-line no-use-before-define
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

let firebaseApp;
const s3 = new AWS.S3();

function deleteS3Objects(Key) {
    const t0 = performance.now();
    const optKey = Key.replace('src/', 'optimized/');
    const params = {
        Delete: {
            Quiet: false,
            Objects: [
                {
                    Key,
                },
                {
                    Key: optKey,
                },
            ],
        },
        Bucket: process.env.BUCKET,
    };
    if (!Key.endsWith('.svg')) {
        const ext = path.extname(Key);
        const webpKey = optKey.replace(ext, '.webp');
        params.Delete.Objects.push({ Key: webpKey });
    }
    debugDelete(
        'start delete s3 obj',
        JSON.stringify(params.Delete.Objects, null, 2),
    );
    const ret = s3.deleteObjects(params).promise();
    ret.then(() => {
        const t1 = performance.now();
        debugDelete('finish delete s3 obj', `${t1 - t0}ms`);
    });
    return ret;
}

function deleteFirebaseRefs(key) {
    const t0 = performance.now();
    const fbKey = key.replace(/[/.]/g, '__');
    debugDelete('start delete fb key', key, '(', fbKey, ')');
    return firebaseApp
        .database()
        .ref()
        .child('videos')
        .child(fbKey)
        .remove()
        .then(() => {
            const t1 = performance.now();
            debugDelete(
                'finish delete fb key',
                key,
                '(',
                fbKey,
                ')',
                `${t1 - t0}ms`,
            );
        })
        .catch((e) => {
            const t1 = performance.now();
            debugDelete('error deleting fb', key, e, `${t1 - t0}ms`);
        });
}

async function processEvent(event, context) {
    const key = decodeURIComponent(
        event.pathParameters.key.replace(/\+/g, ' '),
    );
    debugDelete('processEvent key', key);
    return Promise.all([deleteFirebaseRefs(key), deleteS3Objects(key)]);
}

function decryptServiceAccount() {
    return new Promise((resolve, reject) => {
        const encryptedFileBuffer = fs.readFileSync(
            path.resolve(
                path.dirname(__filename),
                '../config/service-account.encrypted.json',
            ),
        );
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: encryptedFileBuffer }, (err, data) => {
            if (err) {
                return reject(err);
            }
            firebaseApp = firebase.initializeApp({
                credential: firebase.credential.cert(
                    JSON.parse(data.Plaintext.toString('ascii')),
                ),
                databaseURL: process.env.DATABASE_URL,
            });
            return resolve();
        });
    });
}

module.exports.handler = async (event, context) => {
    const headers = Object.keys(event.headers);
    headers.forEach((key) => {
        event.headers[key.toLowerCase()] = event.headers[key];
    });
    if (
        event.headers.debug
        && event.headers.debug.includes('DeleteImage:event')
    ) {
        debugEvent.enabled = true;
    }
    if (
        event.headers.debug
        && event.headers.debug.includes('DeleteImage:delete')
    ) {
        debugDelete.enabled = true;
    }
    debugEvent('Received event: ', JSON.stringify(event, null, 2));
    debugEvent('Context', JSON.stringify(context, null, 2));

    context.callbackWaitsForEmptyEventLoop = false;

    try {
        if (!firebaseApp) {
            await decryptServiceAccount();
        }
        return returnSuccess(await processEvent(event, context));
    } catch (e) {
        return returnError(context.requestId, e);
    }
};
