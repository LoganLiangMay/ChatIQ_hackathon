// Metro configuration for MessageAI

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block documentation and test directories
config.resolver.blockList = [
  /memory-bank\/.*/,
  /documentation\/.*/,
  /\.cursor\/.*/,
  /\.expo\/.*/,
  /\.git\/.*/,
  /__tests__\/.*/,
  /e2e\/.*/,
  /.*\.md$/,
  /.*\.txt$/,
  /.*\.sh$/,
  /.*\.plan\.md$/,
];

// IMPORTANT: Only watch source directories
// This prevents Metro from watching node_modules and docs
config.watchFolders = [
  path.resolve(__dirname, 'app'),
  path.resolve(__dirname, 'components'),
  path.resolve(__dirname, 'contexts'),
  path.resolve(__dirname, 'services'),
  path.resolve(__dirname, 'types'),
  path.resolve(__dirname, 'utils'),
  path.resolve(__dirname, 'hooks'),
];

module.exports = config;

