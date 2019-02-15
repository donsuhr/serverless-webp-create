'use strict';

// eslint-disable-next-line max-len
// DEBUG=deleteImage:* NODE_PATH=../lambda-layer--vendor--jwt/nodejs/node_modules npx serverless invoke local --function DeleteImage -p ../test-event/deleteImage-event.json

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const firebase = require('firebase-admin'); // eslint-disable-line import/no-unresolved
const debug = require('debug'); // eslint-disable-line import/no-extraneous-dependencies
const {
    returnError,
    returnSuccess,
} = require('./format-lambda-proxy-response');

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('deleteImage:event');
const debugDelete = debug('deleteImage:upload');
if (!isLocalTest()) {
    // eslint-disable-line no-use-before-define
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

let firebaseApp;
const s3 = new AWS.S3();

function deleteS3Objects(Key) {
    const optKey = Key.replace('src/', 'optimised/');
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
    return s3.deleteObjects(params).promise();
}

function deleteFirebaseRefs(key) {
    const fbKey = key.replace(/[/.]/g, '__');
    return firebaseApp
        .database()
        .ref()
        .child('videos')
        .child(fbKey)
        .remove()
        .then(() => {
            debugDelete('delete fb key', key, '(', fbKey, ')');
        })
        .catch((e) => {
            debugDelete('error deleting fb', key, e);
        });
}

async function processEvent(event, context) {
    const key = decodeURIComponent(
        event.pathParameters.key.replace(/\+/g, ' '),
    );
    return Promise.all([deleteFirebaseRefs(key), deleteS3Objects(key)]);
}

function decryptServiceAccount() {
    return new Promise((resolve, reject) => {
        const encryptedFileBuffer = fs.readFileSync(
            path.resolve(
                `${path.dirname(__filename)}/${process.env.SERVICE_ACCOUNT}`,
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
        && event.headers.debug.includes('deleteImage:event')
    ) {
        debugEvent.enabled = true;
    }
    if (
        event.headers.debug
        && event.headers.debug.includes('deleteImage:upload')
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
