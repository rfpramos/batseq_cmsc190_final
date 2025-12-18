const webpack = require('webpack');

module.exports = function override(config) {
  console.log('Applying custom Webpack configuration...');
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    querystring: require.resolve('querystring-es3'),
    url: require.resolve('url/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    fs: false,
    path: require.resolve('path-browserify'),
    process: require.resolve('process/browser'), // Ensure this line is added
    vm: require.resolve('vm-browserify') // Add this line for vm module
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  console.log('Hello Webpack configuration applied:', config);

  return config;
};