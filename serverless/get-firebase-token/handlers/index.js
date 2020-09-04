'use strict';

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const firebase = require('firebase-admin');
const debug = require('debug');
const { verifyToken } = require('../lib/verify-jwt');
const {
    returnError,
    returnSuccess,
} = require('../lib/format-lambda-proxy-response');

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('GetFirebaseToken:event');

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
    const decrypted = await verifyToken(token);
    const firebaseToken = await firebaseApp
        .auth()
        .createCustomToken(decrypted.sub, { logviewer: true });
    return { firebaseToken };
}

function decryptServiceAccount() {
    return new Promise((resolve, reject) => {
        const encryptedFileBuffer = fs.readFileSync(
            path.resolve(
                path.dirname(__filename),
                '../config/service-acount.encrypted.json',
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
        const result = await processEvent(event, context);
        return returnSuccess(result);
    } catch (e) {
        console.error(e); // eslint-disable-line no-console
        return returnError(context.requestId, e);
    }
};
