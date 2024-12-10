const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'development', // hoặc 'production'
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    fallback: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util/'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      assert: require.resolve('assert/'),
      async_hooks: require.resolve('async_hooks'),
      console: require.resolve('console-browserify'),
      crypto: require.resolve('crypto-browserify'),
      timers: require.resolve('timers-browserify'),
      url: require.resolve('url/'),
      stream: require.resolve('stream-browserify'),
      tls: require.resolve('tls-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/(@elastic\/elasticsearch|@elastic\/transport)/,
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/, // Thêm rule xử lý các file .css
        use: ['style-loader', 'css-loader'], // Dùng css-loader và style-loader
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      global: 'globalThis',
    }),
    new NodePolyfillPlugin(),
  ],
};
