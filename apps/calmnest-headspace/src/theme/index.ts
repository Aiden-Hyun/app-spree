export const theme = {
  colors: {
    primary: '#6c5ce7',
    primaryLight: '#a29bfe',
    primaryDark: '#5f3dc4',
    secondary: '#74b9ff',
    secondaryLight: '#a0d2ff',
    secondaryDark: '#0984e3',
    
    // Background colors
    background: '#f8f9fa',
    surface: '#ffffff',
    
    // Text colors
    text: '#2d3436',
    textLight: '#636e72',
    textOnPrimary: '#ffffff',
    
    // Status colors
    success: '#00b894',
    warning: '#fdcb6e',
    error: '#d63031',
    info: '#74b9ff',
    
    // Neutral colors
    gray: {
      100: '#f8f9fa',
      200: '#ecf0f1',
      300: '#dee2e6',
      400: '#b2bec3',
      500: '#636e72',
      600: '#2d3436',
    },
    
    // Special colors for meditation
    calm: '#dfe6e9',
    focus: '#6c5ce7',
    relax: '#74b9ff',
    sleep: '#5f3dc4',
    energy: '#fdcb6e',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};
