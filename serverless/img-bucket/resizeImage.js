'use strict';

/* eslint-disable */
/*
 * run this with a regular node script
 * NODE_PATH=../lambda-layer--vendor--imagemin--mac/nodejs/node_modules BUCKET=dev-webp-create--bucket--img-upload-2 node ./run-local--resizeImg.js
 *
 * run this with serverless invoke
 * DEBUG=resizeImg:* NODE_PATH=../lambda-layer--vendor--imagemin--mac/nodejs/node_modules:../lambda-layer--vendor--jwt/nodejs/node_modules npx serverless invoke local --function ResizeImg --path ../test-event/resizeImg-event.json
 *
 * connect to interactive terminal to build dependencies
 * docker run -it --entrypoint=/bin/bash samcli/lambda:nodejs8.10-dcae3d322a3cfc5c61891c2f5 -i
 * docker run --rm -it -v "$PWD":/var/task lambci/lambda:build-nodejs8.10 bash
 *
 * copy file out of docker
 * docker cp 1efaeba689af:/var/task/archive.tar.gz foo.tar.gz
 */
/* eslint-enable */

process.env.PATH = `${process.env.PATH}:/opt/libwebp-1.0.2-linux-x86-64/bin`;
const fs = require('fs');
const path = require('path');
const util = require('util');
const { execFile } = require('child_process');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const firebase = require('firebase-admin'); // eslint-disable-line import/no-unresolved
const gif2webp = require('gif2webp-bin'); // eslint-disable-line import/no-unresolved
const imagemin = require('imagemin'); // eslint-disable-line import/no-unresolved
const imageminPngquant = require('imagemin-pngquant'); // eslint-disable-line import/no-unresolved
const imageminGifsicle = require('imagemin-gifsicle'); // eslint-disable-line import/no-unresolved
const imageminJpegtran = require('imagemin-jpegtran'); // eslint-disable-line import/no-unresolved
const imageminSvgo = require('imagemin-svgo'); // eslint-disable-line import/no-unresolved
const { CWebp } = require('cwebp'); // eslint-disable-line import/no-unresolved
const debug = require('debug'); // eslint-disable-line import/no-extraneous-dependencies

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

const debugEvent = debug('resizeImg:event');
const debugUpload = debug('resizeImg:upload');
if (!isLocalTest()) {
    // eslint-disable-line no-use-before-define
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}

const fsWriteFile = util.promisify(fs.writeFile);
const fsReadFile = util.promisify(fs.readFile);
const s3 = new AWS.S3();

let firebaseApp;

const webpOptionWhitelist = ['q', 'lossless'];

function getKeyFromEvent(event) {
    return decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, ' '),
    );
}

function processMetadata(metaData) {
    const ret = {
        ...metaData,
    };
    if (ret.strip) {
        ret.strip = ret.strip === 'true';
    }
    if (ret.speed) {
        ret.speed = parseInt(ret.speed, 10);
    }
    if (ret.progressive) {
        ret.progressive = ret.progressive === 'true';
    }
    if (ret.optimizationlevel) { // lowercase L
        ret.optimizationLevel = parseInt(ret.optimizationlevel, 10);
        delete ret.optimizationlevel;
    }
    if (ret.interlaced) {
        ret.interlaced = ret.interlaced === 'true';
    }
    if (ret.q) {
        ret.q = parseInt(ret.q, 10);
    }
    if (ret.lossless) {
        ret.lossless = ret.lossless === 'true';
    }
    return ret;
}

function getS3ObjectHead(Key) {
    const params = {
        Bucket: process.env.BUCKET,
        Key,
    };

    return s3.headObject(params).promise();
}

function writeToFirebase(key, transcoding, valuesObj) {
    const fbKey = key.replace(/[/.]/g, '__');
    const updatedAt = new Date().toISOString();
    return firebaseApp
        .database()
        .ref()
        .child('videos')
        .child(fbKey)
        .set({
            Key: key,
            transcoding,
            updatedAt,
            ...valuesObj,
        })
        .then(() => {
            debugUpload('set fb key', key, '(', fbKey, ')', transcoding);
        })
        .catch((e) => {
            debugUpload('error setting fb', key, transcoding, e);
        });
}

function getImageBuffer(key) {
    return s3.getObject({ Bucket: process.env.BUCKET, Key: key }).promise();
}

function writeToS3(key, buffer) {
    const ext = path.extname(key).toLowerCase();
    let ContentType;
    switch (ext) {
        case '.gif':
            ContentType = 'image/gif';
            break;
        case '.jpg':
            ContentType = 'image/jpeg';
            break;
        case '.png':
            ContentType = 'image/png';
            break;
        case '.webp':
            ContentType = 'image/webp';
            break;
        case '.svg':
            ContentType = 'image/svg+xml';
            break;
        default:
            ContentType = 'application/octet-stream';
    }

    const manager = s3.upload({
        Bucket: process.env.BUCKET,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType,
    });

    manager.on('httpUploadProgress', (progress) => {
        debugUpload('httpUploadProgress', progress);
    });

    return manager.promise();
}

function processImagemin(buffer, metadata) {
    return imagemin.buffer(buffer, {
        plugins: [
            imageminPngquant(metadata),
            imageminGifsicle(metadata),
            imageminJpegtran(metadata),
            imageminSvgo(metadata),
        ],
    });
}

function promiseFromChildProcess(child) {
    return new Promise((resolve, reject) => {
        child.addListener('error', (err) => {
            reject(err);
        });

        child.addListener('exit', (x) => {
            resolve();
        });
    });
}

async function createWebP(key, buffer, metadata) {
    const ext = path.extname(key).toLowerCase();

    if (ext === '.gif') {
        const inFilePath = '/tmp/gif2webp-in.gif';
        const outFilePath = '/tmp/gif2webp-out.webp';
        await fsWriteFile(inFilePath, buffer);
        const metaDataOptions = Object.keys(metadata).reduce((acc, x) => {
            if (webpOptionWhitelist.includes(x)) {
                if (x === 'lossless') {
                    if (metadata[x]) {
                        acc.push('-lossy');
                    }
                } else {
                    acc.push(`-${x}`);
                    acc.push(String(metadata[x]));
                }
            }
            return acc;
        }, []);
        const options = [inFilePath, '-o', outFilePath].concat(metaDataOptions);
        debugUpload('gif2webp:', options);
        await promiseFromChildProcess(
            execFile(gif2webp, options),
        );
        return fsReadFile(outFilePath);
    }
    const cwebpBinDir = isLocalTest()
        ? null
        : '/opt/libwebp-1.0.2-linux-x86-64/bin/cwebp';
    const encoder = new CWebp(buffer, cwebpBinDir);
    if (metadata.q) {
        encoder.quality(metadata.q);
    }
    if (metadata.lossless) {
        encoder.lossless(metadata.lossless);
    }
    return encoder.toBuffer();
}

async function processEvent(event, context) {
    const key = getKeyFromEvent(event);
    await writeToFirebase(key, true);
    const { Metadata } = await getS3ObjectHead(key);
    const metadata = processMetadata(Metadata);
    debugUpload('metadata:', metadata);

    const data = await getImageBuffer(key);
    const processed = await processImagemin(data.Body, metadata);
    const processedFileWriteKey = path.resolve(
        __dirname,
        key.replace('src/', '../test-img-dest/'),
    );
    const processedFileWrite = isLocalTest()
        ? fsWriteFile(processedFileWriteKey, processed)
        : Promise.resolve();
    let webpFileUpload;
    let webpFileWrite;
    let webpFileSize = 0;
    const ext = path.extname(key);
    if (ext === '.svg') {
        webpFileUpload = Promise.resolve();
        webpFileWrite = Promise.resolve();
    } else {
        const webp = await createWebP(key, data.Body, metadata);
        const webpFileWriteKey = path.resolve(
            __dirname,
            key.replace(ext, '.webp').replace('src/', '../test-img-dest/'),
        );
        webpFileWrite = isLocalTest()
            ? fsWriteFile(webpFileWriteKey, webp)
            : Promise.resolve();
        const webpFileUploadKey = key
            .replace(ext, '.webp')
            .replace('src/', 'optimised/');
        webpFileUpload = writeToS3(webpFileUploadKey, webp);
        webpFileSize = webp.byteLength;
    }
    const processedFileUploadKey = key.replace('src/', 'optimised/');
    const processedFileUpload = writeToS3(processedFileUploadKey, processed);
    await Promise.all([
        processedFileWrite,
        processedFileUpload,
        webpFileWrite,
        webpFileUpload,
    ])
        .then(() => {
            const optimisedFileSize = processed.byteLength;
            writeToFirebase(key, false, { webpFileSize, optimisedFileSize });
        });
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
    debugEvent('Received event: ', JSON.stringify(event, null, 2));
    debugEvent('Context', JSON.stringify(context, null, 2));

    context.callbackWaitsForEmptyEventLoop = false;
    if (!firebaseApp) {
        await decryptServiceAccount();
    }
    try {
        return await processEvent(event, context);
    } catch (error) {
        const key = getKeyFromEvent(event);
        writeToFirebase(key, false, { error: error.message });
        return error;
    }
};
