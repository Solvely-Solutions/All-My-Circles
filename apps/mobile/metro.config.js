const { getDefaultConfig } = require('expo/metro-config');

// Set the EXPO_ROUTER_APP_ROOT environment variable
process.env.EXPO_ROUTER_APP_ROOT = './app';

const config = getDefaultConfig(__dirname);

module.exports = config;