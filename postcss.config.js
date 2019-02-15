const cssnanno = require('cssnano'); // eslint-disable-line import/no-extraneous-dependencies

const plugins = [
    cssnanno({
        preset: [
            'cssnano-preset-advanced',
            {
                autoprefixer: {
                    plugins: [
                        {
                            add: true,
                        },
                    ],
                },
            },
        ],
    }),
];

module.exports = {
    plugins,
};
