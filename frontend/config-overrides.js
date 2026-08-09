const webpack = require('webpack');

module.exports = function override(config) {
  console.log('Applying custom Webpack configuration...');

  // Browser polyfills for Node.js modules
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
    process: require.resolve('process/browser.js'),
    vm: require.resolve('vm-browserify'),
  };

  // Explicitly resolve process/browser for dependencies such as Axios
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'process/browser': require.resolve('process/browser.js'),
  };

  // Provide Node.js globals in the browser
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: require.resolve('process/browser.js'),
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  console.log('Hello Webpack configuration applied:', config);

  return config;
};