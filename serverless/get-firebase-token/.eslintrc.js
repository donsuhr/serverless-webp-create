'use strict';

const path = require('path');

const preInstalledPath = path.resolve(
    __dirname,
    '../lambda-layers/pre-installed-for-dev/nodejs/node_modules',
);
const imageminPath = path.resolve(
    __dirname,
    '../lambda-layers/imagemin/nodejs/node_modules',
);
const getFirebaseTokenLayerPath = path.resolve(
    __dirname,
    'layers/GetFirebaseToken/nodejs/node_modules',
);

const eslintDirPackagePath = path.resolve(__dirname, '../../');
const preIntalledPackagePath = path.resolve(preInstalledPath, '../');
const imageminPackagePath = path.resolve(imageminPath, '../');
const getFirebaseTokenPackagePath = path.resolve(
    getFirebaseTokenLayerPath,
    '../',
);

module.exports = {
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            {
                packageDir: [
                    eslintDirPackagePath,
                    preIntalledPackagePath,
                    imageminPackagePath,
                    getFirebaseTokenPackagePath,
                ],
            },
        ],
    },
    settings: {
        'import/resolver': {
            node: {
                paths: [
                    preInstalledPath,
                    imageminPath,
                    getFirebaseTokenLayerPath,
                ],
            },
        },
    },
};
