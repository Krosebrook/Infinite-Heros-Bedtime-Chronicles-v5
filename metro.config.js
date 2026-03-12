const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.local\/state\/workflow-logs\/.*/,
];

module.exports = config;
