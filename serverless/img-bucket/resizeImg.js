'use strict';

// eslint-disable-next-line max-len
// NODE_PATH=../lambda-layer--vendor--imagemin--mac/nodejs/node_modules npx serverless invoke local --function ResizeImg --path ../test-event/resizeImg-event.json
// eslint-disable-next-line max-len
// NODE_PATH=../lambda-layer--vendor--imagemin--mac/nodejs/node_modules BUCKET=dev-webp-create--bucket--img-upload-2 node ./run-local--resizeImg.js

// docker run -it --entrypoint=/bin/bash samcli/lambda:nodejs8.10-dcae3d322a3cfc5c61891c2f5 -i
// docker run --rm -it -v "$PWD":/var/task lambci/lambda:build-nodejs8.10 bash
// docker cp 1efaeba689af:/var/task/archive.tar.gz foo.tar.gz

process.env.PATH = `${process.env.PATH}:/opt/libwebp-1.0.2-linux-x86-64/bin`;
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const gif2webp = require('gif2webp-bin'); // eslint-disable-line import/no-unresolved
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const imagemin = require('imagemin'); // eslint-disable-line import/no-unresolved
const imageminPngquant = require('imagemin-pngquant'); // eslint-disable-line import/no-unresolved
const imageminGifsicle = require('imagemin-gifsicle'); // eslint-disable-line import/no-unresolved
const imageminJpegtran = require('imagemin-jpegtran'); // eslint-disable-line import/no-unresolved
const imageminSvgo = require('imagemin-svgo'); // eslint-disable-line import/no-unresolved
const { CWebp } = require('cwebp'); // eslint-disable-line import/no-unresolved
const util = require('util');

const fsWriteFile = util.promisify(fs.writeFile);
const fsReadFile = util.promisify(fs.readFile);

const s3 = new AWS.S3();

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
        console.log('httpUploadProgress', progress);
    });

    return manager.promise();
}

function processImagemin(buffer) {
    return imagemin.buffer(buffer, {
        plugins: [
            imageminPngquant(),
            imageminGifsicle(),
            imageminJpegtran(),
            imageminSvgo(),
        ],
    });
}

function promiseFromChildProcess(child) {
    return new Promise((resolve, reject) => {
        child.addListener('error', (err) => {
            reject(err);
        });

        child.addListener('exit', () => {
            resolve();
        });
    });
}

function isLocalTest() {
    return process.env.NODE_PATH.includes('lambda-layer');
}

async function createWebP(key, buffer) {
    const ext = path.extname(key).toLowerCase();
    if (ext === '.gif') {
        const inFilePath = '/tmp/gif2webp-in.gif';
        const outFilePath = '/tmp/gif2webp-out.webp';
        await fsWriteFile(inFilePath, buffer);
        await promiseFromChildProcess(
            execFile(gif2webp, [inFilePath, '-o', outFilePath]),
        );
        return fsReadFile(outFilePath);
    }
    const cwebpBinDir = isLocalTest()
        ? null
        : '/opt/libwebp-1.0.2-linux-x86-64/bin/cwebp';
    const encoder = new CWebp(buffer, cwebpBinDir);
    return encoder.toBuffer();
}

async function processEvent(event, context) {
    const { key } = event.Records[0].s3.object;

    const data = await getImageBuffer(key);
    const processed = await processImagemin(data.Body);

    const processedFileWriteKey = path.resolve(
        __dirname,
        key.replace('src/', '../test-img-dest/'),
    );
    const processedFileWrite = isLocalTest()
        ? fsWriteFile(processedFileWriteKey, processed)
        : Promise.resolve();

    let webpFileUpload;
    let webpFileWrite;
    const ext = path.extname(key);
    if (ext === '.svg') {
        webpFileUpload = Promise.resolve();
        webpFileWrite = Promise.resolve();
    } else {
        const webp = await createWebP(key, data.Body);
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
    }

    const processedFileUploadKey = key.replace('src/', 'optimised/');
    const processedFileUpload = writeToS3(processedFileUploadKey, processed);
    await Promise.all([
        processedFileWrite,
        processedFileUpload,
        webpFileWrite,
        webpFileUpload,
    ]);
}

module.exports.handler = async (event, context) =>
    // console.log('Received event: ', JSON.stringify(event, null, 2));
    // console.log('Context', JSON.stringify(context, null, 2));
    processEvent(event, context);
