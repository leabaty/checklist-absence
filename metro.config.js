// https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix: Metro cannot resolve @firebase/webchannel-wrapper subpath exports.
// The exports map points to files Metro can't reach via package resolution,
// so we short-circuit with an absolute path that bypasses the exports check.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/webchannel-wrapper/bloom-blob') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@firebase/webchannel-wrapper/dist/bloom-blob/bloom_blob_es2018.js'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
