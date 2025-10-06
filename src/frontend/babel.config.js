module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated
      'react-native-reanimated/plugin',
      // Required for react-native-paper
      [
        'react-native-paper/babel',
        {
          // Optional: customize the theme
          theme: 'light',
        },
      ],
      // Required for react-native-vector-icons
      'react-native-vector-icons/babel',
      // Required for react-native-svg
      'react-native-svg/plugin',
      // Required for i18next
      [
        'i18next-extract',
        {
          locales: ['en', 'ar'],
          keyAsDefaultValue: true,
          keyAsDefaultValueForDerivedKeys: true,
          outputPath: 'src/locales/{{locale}}.json',
          defaultNS: 'common',
          ns: ['common', 'auth', 'home', 'properties', 'crm', 'erp', 'profile', 'errors'],
        },
      ],
      // Required for react-query
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@locales': './src/locales',
            '@theme': './src/theme',
            '@navigation': './src/navigation',
          },
        },
      ],
      // Required for react-native-gesture-handler
      'react-native-gesture-handler/babel',
      // Required for react-native-screens
      'react-native-screens/babel',
      // Required for react-native-safe-area-context
      'react-native-safe-area-context/babel',
    ],
  };
};
