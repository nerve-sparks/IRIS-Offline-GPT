const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [],
  resolver: {
    blockList: [
      // Exclude CMake temp dirs created by llama.rn / NDK builds
      new RegExp(`${path.resolve(__dirname, 'android', 'app', '.cxx').replace(/\\/g, '\\\\')}.*`),
      new RegExp(`${path.resolve(__dirname, 'android', 'build').replace(/\\/g, '\\\\')}.*`),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
