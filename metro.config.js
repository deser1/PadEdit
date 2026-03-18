const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  events: require.resolve('events'),
  path: require.resolve('path-browserify'),
  util: require.resolve('util'),
};

module.exports = config;
