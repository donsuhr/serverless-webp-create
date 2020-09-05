'use strict';

module.exports = function config(api) {
    api.cache(true);

    const presets = [
        [
            '@babel/preset-env',
            {
                modules: false,
                loose: true,
                useBuiltIns: 'usage',
                corejs: { version: '3.6', proposals: true },
            },
        ],
    ];
    const plugins = [];

    return {
        presets,
        plugins,
    };
};
