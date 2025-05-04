const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    assert: require.resolve('assert/'),
    crypto: require.resolve('crypto-browserify'),
    querystring: require.resolve('querystring'),
    timers: require.resolve('timers-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    zlib: require.resolve('browserify-zlib'),
    http: require.resolve('https-browserify'),
    https: require.resolve('https-browserify'),
    fs: false,
    net: false,
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/'),
    events: require.resolve('events-browserify'),
    vm: require.resolve('vm-browserify'),
    async_hooks: false
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      if (mod === 'events') {
        resource.request = 'events-browserify';
      } else if (mod === 'fs' || mod === 'http' || mod === 'net' || mod === 'async_hooks') {
        resource.request = false;
      } else if (mod === 'path') {
        resource.request = 'path-browserify';
      } else if (mod === 'zlib') {
        resource.request = 'browserify-zlib';
      } else if (mod === 'util') {
        resource.request = 'util/';
      } else if (mod === 'buffer') {
        resource.request = 'buffer/';
      } else if (mod === 'vm') {
        resource.request = 'vm-browserify';
      }
    }),
    new webpack.NormalModuleReplacementPlugin(/express/, (resource) => {
      resource.request = false;
    }),
    new webpack.NormalModuleReplacementPlugin(/on-finished/, (resource) => {
      resource.request = false;
    }),
    new webpack.NormalModuleReplacementPlugin(/raw-body/, (resource) => {
      resource.request = false;
    }),
    new webpack.NormalModuleReplacementPlugin(/querystring-es3/, (resource) => {
      resource.request = 'querystring';
    })
  ];

  return config;
};