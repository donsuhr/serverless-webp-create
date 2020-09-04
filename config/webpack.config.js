'use strict';

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const autoprefixer = require('autoprefixer');

const production = process.env.NODE_ENV === 'production';
const mode = production ? 'production' : 'development';

const entry = {
    index: [path.join(__dirname, '/../app/scripts/index.js')],
};

const plugins = [
    new VueLoaderPlugin(),
    new webpack.ProvidePlugin({
        'window.jQuery': 'jquery', // garlic, headroom, bootstrap
        jQuery: 'jquery', // bootstrap parsley superfish
    }),
    new webpack.DefinePlugin({
        serviceWorkerVersion: `"${new Date().toISOString()}"`,
    }),
    new HtmlWebpackPlugin({
        title: 'webp generator',
        filename: 'index.html',
        template: path.join(__dirname, '/../app/index.template.html'),
        inject: true,
        minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
        },
    }),
];

if (production) {
    plugins.push(
        new MiniCssExtractPlugin({
            filename: 'styles/[name].css',
            chunkFilename: 'styles/[name]-[chunkhash].css',
        }),
    );
    plugins.push(new CleanWebpackPlugin(['dist'], { verbose: true }));
    plugins.push(
        new CopyWebpackPlugin(
            [
                { from: 'app/browserconfig.xml' },
                { from: 'app/favicon.ico' },
                { from: 'app/site.webmanifest' },
                { from: 'app/icons', to: 'icons' },
            ],
            { context: path.join(__dirname, '/../') },
        ),
    );
    plugins.push(new webpack.HashedModuleIdsPlugin());
}

module.exports = {
    mode,
    stats: 'errors-only',
    devtool: production ? 'source-map' : '#eval-source-map',
    context: path.join(__dirname, '/../app', 'scripts'),
    entry,
    plugins,
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        modules: ['node_modules', path.resolve(__dirname, '/../app')],
        alias: {
            config$: path.join(__dirname, '/../app/scripts/config.js'),
            vue$: 'vue/dist/vue.esm.js',
            '@': path.resolve(__dirname, '../app'),
            'queue-shared': path.join(
                __dirname,
                '../stacks/lambda-layers/queue-shared/nodejs/node_modules/queue-shared',
            ),
        },
    },
    output: {
        path: path.join(__dirname, '/../dist/'),
        filename: production
            ? 'scripts/[name]-[chunkhash].js'
            : 'scripts/[name].js',
        chunkFilename: production
            ? 'scripts/[name]-[chunkhash].js'
            : 'scripts/[name].js',
        publicPath: production ? '/projects/queue/' : '/',
    },
    devServer: {
        contentBase: [
            path.join(__dirname, '/../dist'),
            path.join(__dirname, '/../app'),
        ],
        compress: true,
        port: 9001,
        host: '0.0.0.0',
        http2: true,
        public: 'cmc.suhrthing.com:9001',
        historyApiFallback: true,
        https: {
            key: fs.readFileSync(
                '/etc/letsencrypt/live/suhrthing.com/privkey.pem',
                'utf8',
            ),
            cert: fs.readFileSync(
                '/etc/letsencrypt/live/suhrthing.com/cert.pem',
                'utf8',
            ),
            ca: fs.readFileSync(
                '/etc/letsencrypt/live/suhrthing.com/chain.pem',
                'utf8',
            ),
        },
    },
    module: {
        rules: [
            { parser: { amd: false } },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        scss: 'vue-style-loader!css-loader!sass-loader',
                    },
                },
            },
            {
                test: /\.js$/,
                use: ['babel-loader'],
                include: [
                    path.join(__dirname, '/../app/'),
                    path.join(__dirname, '/../node_modules/lazyload'),
                ],
            },
            {
                test: /\.s[a|c]ss$/,
                use: production
                    ? [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                modules: false,
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                config: { path: __dirname },
                                autoprefixer: {
                                    browsers: ['last 2 versions'],
                                },
                                plugins: () => [autoprefixer],
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ]
                    : [
                        { loader: 'style-loader' },
                        {
                            loader: 'css-loader',
                            options: {
                                modules: false,
                                sourceMap: false,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                config: { path: __dirname },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: false,
                            },
                        },
                    ],
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 2000, // Convert images < 8kb to base64 strings
                            name: 'images/[name]-[hash].[ext]',
                        },
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            bypassOnDebug: true,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
