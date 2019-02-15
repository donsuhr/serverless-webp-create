'use strict';

// eslint-disable-next-line max-len
// NODE_PATH=../lambda-layer--vendor--jwt/nodejs/node_modules npx serverless invoke local --function getFirebaseToken --path ../test-event/getFirebaseToken-event.json

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const firebase = require('firebase-admin'); // eslint-disable-line import/no-unresolved
const debug = require('debug'); // eslint-disable-line import/no-extraneous-dependencies
const { verifyToken } = require('./verify-jwt');
const { returnError, returnSuccess } = require('./format-lambda-proxy-response');

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('getFirbaseToken:event');

if (!isLocalTest()) {
    // eslint-disable-line no-use-before-define
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

let firebaseApp;

async function processEvent(event, context) {
    if (!event.headers.Authorization) {
        throw new Error('Could not find authToken');
    }

    const token = event.headers.Authorization.split(' ')[1];
    try {
        const decrypted = await verifyToken(token);
        const firebaseToken = await firebaseApp
            .auth()
            .createCustomToken(decrypted.sub, { logviewer: true });
        return { firebaseToken };
    } catch (e) {
        throw e;
    }
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
    debugEvent('Event: ', JSON.stringify(event, null, 2));
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
