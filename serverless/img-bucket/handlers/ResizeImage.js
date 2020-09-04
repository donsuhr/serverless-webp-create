'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const { PassThrough } = require('stream');
const childProcess = require('child_process');
const AWS = require('aws-sdk');
const debug = require('debug');
const firebase = require('firebase-admin');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminSvgo = require('imagemin-svgo');

const fsWriteFile = util.promisify(fs.writeFile);
const debugEvent = debug('ResizeImage:event');
const debugUpload = debug('ResizeImage:upload');

// eslint-disable-next-line no-use-before-define
if (!isLocalTest()) {
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}
const s3 = new AWS.S3();

let firebaseApp;

const webpOptionWhitelist = ['q', 'lossless'];

function isLocalTest() {
    return process.env.LOCAL_TEST === '1';
}

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
    if (ret.optimizationlevel) {
        // lowercase L
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

// eslint-disable-next-line no-unused-vars
function getImageBuffer(key) {
    return s3.getObject({ Bucket: process.env.BUCKET, Key: key }).promise();
}

function getImageStream(key) {
    const s3Stream = s3
        .getObject({ Bucket: process.env.BUCKET, Key: key })
        .createReadStream();
    return s3Stream;
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
async function imageminStream(stream, metadata) {
    const pt = new PassThrough();
    stream.pipe(pt);

    const chunks = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of pt) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return processImagemin(buffer, metadata);
}

function createWebP(key, stream, metadata) {
    const ext = path.extname(key).toLowerCase();

    const options = Object.keys(metadata).reduce(
        (acc, x) => {
            if (webpOptionWhitelist.includes(x)) {
                if (x === 'lossless' && !!metadata.lossless && ext === '.gif') {
                    acc.unshift('-lossy');
                } else if (typeof metadata[x] === 'boolean') {
                    if (metadata[x]) {
                        acc.unshift(`-${x}`);
                    }
                } else {
                    acc.unshift(`-${x}`, metadata[x]);
                }
            }
            return acc;
        },
        ['-o', '-', '--', '-'],
    );

    const binFile = ext === '.gif' ? 'gif2webp' : 'cwebp';
    const bin = `${process.env.LIBWEBP_PATH}/${binFile}`;
    debugUpload('Start create WebP. binary:', bin, 'options:', options);

    const webp = childProcess.spawn(bin, options);
    stream.pipe(webp.stdin);
    return webp.stdout;
}

function writeFileStreamPromise(stream, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        stream.pipe(file).on('finish', resolve).on('error', reject);
    });
}

function writeWebP(key, stream) {
    const ext = path.extname(key).toLowerCase();
    const filename = path.resolve(
        __dirname,
        key.replace(ext, '.webp').replace('src/', '../test/out/'),
    );
    const filePromise = isLocalTest()
        ? writeFileStreamPromise(stream, filename)
        : Promise.resolve();

    const s3Key = key.replace(ext, '.webp').replace('src/', 'optimised/');
    const uploadPassthough = new PassThrough();
    const uploadPromise = writeToS3(s3Key, uploadPassthough);
    stream.pipe(uploadPassthough);

    return Promise.all([uploadPromise, filePromise]);
}

function writeImagemin(key, buffer) {
    const filename = path.resolve(
        __dirname,
        key.replace('src/', '../test/out/'),
    );
    const filePromise = isLocalTest()
        ? fsWriteFile(filename, buffer)
        : Promise.resolve();

    const s3key = key.replace('src/', 'optimised/');
    const uploadPromise = writeToS3(s3key, buffer);

    return Promise.all([uploadPromise, filePromise]);
}

async function processEvent(event, context) {
    const key = getKeyFromEvent(event);
    await writeToFirebase(key, true);
    const { Metadata } = await getS3ObjectHead(key);
    const metadata = processMetadata(Metadata);
    debugUpload('metadata:', metadata);

    // const data = await getImageBuffer(key);
    const imgStream = getImageStream(key);

    const ext = path.extname(key);
    let webpStream;
    let webpUpload;
    let webpDataLength = 0;
    if (ext === '.svg') {
        webpStream = Promise.resolve();
        webpUpload = Promise.resolve();
    } else {
        webpStream = createWebP(key, imgStream, metadata);
        webpUpload = writeWebP(key, webpStream);
        webpStream.on('data', (chunk) => {
            webpDataLength += chunk.length;
        });
    }

    const imageminBuffer = await imageminStream(imgStream, metadata);
    const imageminUpload = writeImagemin(key, imageminBuffer);

    await Promise.all([webpUpload, imageminUpload]).then(async () => {
        await writeToFirebase(key, false, {
            webpFileSize: webpDataLength,
            optimisedFileSize: imageminBuffer.byteLength,
        });
    });
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
    debugEvent('Received event: ', JSON.stringify(event, null, 2));
    debugEvent('Context', JSON.stringify(context, null, 2));

    context.callbackWaitsForEmptyEventLoop = false;
    if (!firebaseApp) {
        await decryptServiceAccount();
    }
    try {
        return await processEvent(event, context);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        const key = getKeyFromEvent(event);
        writeToFirebase(key, false, { error: error.message });
        return error;
    } finally {
        if (isLocalTest()) {
            firebaseApp.delete();
        }
    }
};
