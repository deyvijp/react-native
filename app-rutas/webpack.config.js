const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);
const { presets } = require(`${appDirectory}/babel.config.js`);

const compileNodeModules = [
    // Add every react-native package that needs compiling
    'react-native-vector-icons',
    'react-native-reanimated',
].map((moduleName) => path.resolve(appDirectory, `node_modules/${moduleName}`));



const babelLoaderConfiguration = {
    test: /\.js$|tsx?$/,
    // Add every directory that needs to be compiled by Babel during the build.
    include: [
        path.resolve(__dirname, 'index.web.js'),
        path.resolve(__dirname, 'App.tsx'),
        path.resolve(__dirname, 'src'),
        ...compileNodeModules,
    ],
    use: {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            presets,
            plugins: ['react-native-web'],
        },
    },
};

const imageLoaderConfiguration = {
    test: /\.(jpg|png|svg|ico|icns)$/,
    loader: 'file-loader',
    options: {
        name: '[name].[ext]',
    },
};

const ttfLoaderConfiguration = {
    test: /\.ttf$/,
    loader: 'url-loader',
    options: {
        include: /node_modules\/react-native-vector-icons/,
    },
};

module.exports = {
    entry: {
        app: path.join(__dirname, 'index.web.js'),
    },
    output: {
        path: path.resolve(appDirectory, 'dist'),
        publicPath: '/',
        filename: 'rnw.bundle.js',
    },
    resolve: {
        extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js'],
        alias: {
            'react-native$': 'react-native-web',
            'react-native-quick-sqlite': path.resolve(__dirname, 'src/services/__mocks__/react-native-quick-sqlite.js'),
        },
    },
    module: {
        rules: [babelLoaderConfiguration, imageLoaderConfiguration, ttfLoaderConfiguration],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'public/index.html'),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            // See: https://github.com/necolas/react-native-web/issues/349
            __DEV__: JSON.stringify(true),
            process: { env: {} },
        }),
    ],
    devServer: {
        historyApiFallback: true,
        proxy: [
            {
                context: ['/web', '/api', '/jsonrpc'],
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
        ],
    },
};
