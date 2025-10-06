const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'webp',
  'svg',
  // Documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  // Archives
  'zip',
  'rar',
  '7z',
  // Audio/Video
  'mp3',
  'mp4',
  'avi',
  'mov',
  'wav',
  'flac'
);

// Add support for additional source extensions
config.resolver.sourceExts.push(
  'jsx',
  'tsx',
  'json',
  'js'
);

// Configure transformer for better performance
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable hermes for better performance
config.transformer.hermesParser = true;

module.exports = config;
