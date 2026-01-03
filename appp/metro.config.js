/**
 * Metro configuration for React Native (Windows-safe, CommonJS)
 * Uses Expo's default config and wraps with NativeWind.
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = path.resolve(__dirname);
const config = getDefaultConfig(projectRoot);

module.exports = withNativeWind(config, { input: './global.css' });