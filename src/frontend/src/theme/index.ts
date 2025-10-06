import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Property Management specific color palette
const propertyColors = {
  // Primary brand colors
  primary: '#2E7D32', // Deep green for property/real estate
  primaryContainer: '#C8E6C9',
  secondary: '#FF6F00', // Orange for highlights
  secondaryContainer: '#FFE0B2',
  
  // Status colors
  success: '#4CAF50',
  successContainer: '#C8E6C9',
  warning: '#FF9800',
  warningContainer: '#FFE0B2',
  error: '#F44336',
  errorContainer: '#FFCDD2',
  info: '#2196F3',
  infoContainer: '#BBDEFB',
  
  // Property specific colors
  available: '#4CAF50',
  sold: '#FF5722',
  rented: '#FF9800',
  maintenance: '#9C27B0',
  
  // Neutral colors
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  background: '#FAFAFA',
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  
  // Text colors
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#212121',
  onBackground: '#212121',
  onError: '#FFFFFF',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...propertyColors,
  },
  roundness: 12,
  fonts: {
    ...MD3LightTheme.fonts,
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontFamily: 'System',
      fontWeight: '700',
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: 'System',
      fontWeight: '600',
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: 'System',
      fontWeight: '600',
    },
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontFamily: 'System',
      fontWeight: '400',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CAF50',
    primaryContainer: '#2E7D32',
    secondary: '#FF6F00',
    secondaryContainer: '#E65100',
    tertiary: '#4CAF50',
    tertiaryContainer: '#2E7D32',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    background: '#000000',
    error: '#F44336',
    errorContainer: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    onError: '#FFFFFF',
    outline: '#424242',
    outlineVariant: '#303030',
    
    // Property specific colors for dark theme
    available: '#4CAF50',
    sold: '#FF5722',
    rented: '#FF9800',
    maintenance: '#BA68C8',
  },
  roundness: 12,
  fonts: {
    ...MD3DarkTheme.fonts,
    headlineLarge: {
      ...MD3DarkTheme.fonts.headlineLarge,
      fontFamily: 'System',
      fontWeight: '700',
    },
    headlineMedium: {
      ...MD3DarkTheme.fonts.headlineMedium,
      fontFamily: 'System',
      fontWeight: '600',
    },
    titleLarge: {
      ...MD3DarkTheme.fonts.titleLarge,
      fontFamily: 'System',
      fontWeight: '600',
    },
    bodyLarge: {
      ...MD3DarkTheme.fonts.bodyLarge,
      fontFamily: 'System',
      fontWeight: '400',
    },
  },
};

// Hook to get theme based on system preference
export const useTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

export const theme = lightTheme;
