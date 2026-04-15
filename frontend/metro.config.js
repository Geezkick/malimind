if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function() { return this.slice().reverse(); },
    enumerable: false
  });
}

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable modern package exports to avoid picking up ESM-only files with import.meta
config.resolver.unstable_enablePackageExports = false;

// Enable CSS support for web
config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
});

module.exports = config;
