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
const execFile = util.promisify(childProcess.execFile);
const debugEvent = debug('ResizeImage:event');
const debugUpload = debug('ResizeImage:upload');

// eslint-disable-next-line no-use-before-define
if (!isLocalTest()) {
    debug.log = console.log.bind(console); // eslint-disable-line no-console
}
const s3 = new AWS.S3();

let firebaseApp;

function isLocalTest() {
    return process.env.LOCAL_TEST === '1';
}

function getKeyFromEvent(event) {
    return decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, ' '),
    );
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
        case '.avif':
            ContentType = 'image/avif';
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
    // '.png': ['pngSpeed', 'strip', 'pngQ', 'pngLossless'],
    // '.jpg': ['progressive', 'jpgQ', 'jpgLossless'],
    // '.gif': ['interlaced', 'optimizationLevel', 'gifQ', 'gifLossless'],
    // all metadata on s3 is lowercase
    const options = {
        png: {
            ...(metadata.strip && { strip: metadata.strip === 'true' }),
            ...(metadata.pngspeed && {
                speed: parseInt(metadata.pngspeed, 10),
            }),
            ...(metadata.pngq && { q: parseInt(metadata.pngq, 10) }),
            ...(metadata.pnglossless && {
                lossless: metadata.pnglossless === 'true',
            }),
        },
        jpg: {
            ...(metadata.progressive && {
                progressive: metadata.progressive === 'true',
            }),
            ...(metadata.jpgq && { q: parseInt(metadata.jpgq, 10) }),
            ...(metadata.jpglossless && {
                lossless: metadata.jpglossless === 'true',
            }),
        },
        gif: {
            ...(metadata.interlaced && {
                interlaced: metadata.interlaced === 'true',
            }),
            ...(metadata.optimizationlevel && {
                optimizationLevel: parseInt(metadata.optimizationlevel, 10),
            }),
            ...(metadata.gifq && { q: parseInt(metadata.gifq, 10) }),
            ...(metadata.giflossless && {
                lossless: metadata.giflossless === 'true',
            }),
        },
        svg: {},
    };

    debugUpload('Start create imagemin. options:', options);
    return imagemin.buffer(buffer, {
        plugins: [
            imageminPngquant(options.png),
            imageminGifsicle(options.gif),
            imageminJpegtran(options.jpg),
            imageminSvgo(options.svg),
        ],
    });
}
async function imageminStream(stream, metadata) {
    const chunks = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return processImagemin(buffer, metadata);
}

function createWebP(key, stream, metadata) {
    const ext = path.extname(key).toLowerCase();

    const options = ['-o', '-', '--', '-'];

    if (metadata.webpq) {
        options.unshift('-q', parseInt(metadata.webpq, 10));
    }

    if (ext === '.gif' && metadata.webplossless !== 'true') {
        options.unshift('-lossy');
    }
    if (ext !== '.gif' && metadata.webplossless === 'true') {
        options.unshift('-lossless');
    }

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

async function createAvif(key, stream, metadata) {
    const ext = key.split('.').pop();
    const inFilePath = `/tmp/avif-in.${ext}`;
    const outFilePath = '/tmp/avif-out.avif';

    const options = [inFilePath, outFilePath];
    if (metadata.avifspeed) {
        options.unshift('--speed', parseInt(metadata.avifspeed, 10));
    }
    if (metadata.aviflossless) {
        options.unshift('--lossless');
    }
    if (metadata.avifmaxq) {
        options.unshift('--max', metadata.avifmaxq);
    } else {
        options.unshift('--max', 63);
    }
    if (metadata.avifminq) {
        options.unshift('--min', metadata.avifminq);
    } else {
        options.unshift('--min', 33);
    }

    const pt = new PassThrough();
    stream.pipe(pt);
    await writeFileStreamPromise(pt, inFilePath);
    const bin = `${process.env.LIBAVIF_PATH}/avifenc`;
    debugUpload('Start create avif. binary:', bin, 'options:', options);

    await execFile(bin, options);
    return fs.createReadStream(outFilePath);
}

function writeOutStream(key, newExt, stream) {
    const ext = path.extname(key).toLowerCase();
    const filename = path.resolve(
        __dirname,
        key.replace(ext, newExt).replace('src/', '../test/out/'),
    );
    const writeFilePassthough = new PassThrough();
    const filePromise = isLocalTest()
        ? writeFileStreamPromise(writeFilePassthough, filename)
        : Promise.resolve();

    const s3Key = key.replace(ext, newExt).replace('src/', 'optimized/');
    const uploadPassthough = new PassThrough();
    const uploadPromise = writeToS3(s3Key, uploadPassthough);
    stream.pipe(uploadPassthough);
    if (isLocalTest()) {
        stream.pipe(writeFilePassthough);
    }
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

    const s3key = key.replace('src/', 'optimized/');
    const uploadPromise = writeToS3(s3key, buffer);

    return Promise.all([uploadPromise, filePromise]);
}

async function processEvent(event, context) {
    const key = getKeyFromEvent(event);
    await writeToFirebase(key, true);
    const { Metadata } = await getS3ObjectHead(key);
    debugUpload('s3 Metadata:', Metadata);

    // const data = await getImageBuffer(key);
    const imgStream = getImageStream(key);

    const ext = path.extname(key);
    let webpUpload;
    let webpDataLength = 0;

    if (ext === '.svg') {
        webpUpload = Promise.resolve();
    } else {
        const webpPt = new PassThrough();
        imgStream.pipe(webpPt);
        const webpStream = createWebP(key, webpPt, Metadata);
        webpUpload = writeOutStream(key, '.webp', webpStream);
        webpStream.on('data', (chunk) => {
            webpDataLength += chunk.length;
        });
    }

    let avifUpload;
    let avifDataLength = 0;
    if (ext === '.png' || ext === '.jpg') {
        const avifPt = new PassThrough();
        imgStream.pipe(avifPt);
        avifUpload = createAvif(key, avifPt, Metadata).then((avifStream) => {
            const upload = writeOutStream(key, '.avif', avifStream);

            avifStream.on('data', (chunk) => {
                avifDataLength += chunk.length;
            });
            return upload;
        });
    } else {
        avifUpload = Promise.resolve();
    }

    let imageminFileSize = 0;

    const imageminPt = new PassThrough();
    imgStream.pipe(imageminPt);
    const imageminUpload = imageminStream(imgStream, Metadata).then(
        (imageminBuffer) => {
            imageminFileSize = imageminBuffer.byteLength;
            return writeImagemin(key, imageminBuffer);
        },
    );

    await Promise.all([webpUpload, imageminUpload, avifUpload]).then(
        async () => {
            await writeToFirebase(key, false, {
                webpFileSize: webpDataLength,
                imageminFileSize,
                avifFileSize: avifDataLength,
            });
        },
    );
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
