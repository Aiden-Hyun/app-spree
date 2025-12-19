export const theme = {
  colors: {
    // Primary palette - Sage Green
    primary: '#8B9F82',
    primaryLight: '#A8B89F',
    primaryDark: '#6B7F65',
    
    // Secondary - Warm Terracotta
    secondary: '#C4A77D',
    secondaryLight: '#D4BFA0',
    secondaryDark: '#A68B5B',
    
    // Accent - Dusty Rose
    accent: '#D4A5A5',
    accentLight: '#E4C0C0',
    accentDark: '#B88888',
    
    // Background colors - Warm tones
    background: '#FAF8F5',
    surface: '#FFFEF9',
    surfaceElevated: '#FFFFFF',
    
    // Text colors - Warm charcoal
    text: '#3D3A38',
    textLight: '#8B8685',
    textMuted: '#A8A5A3',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#F5F0E8',
    
    // Status colors - Muted versions
    success: '#7BA37B',
    warning: '#D4B896',
    error: '#C88B8B',
    info: '#8BA5B8',
    
    // Neutral colors - Warm grays
    gray: {
      50: '#FDFCFA',
      100: '#F5F3F0',
      200: '#EBE8E4',
      300: '#D9D5D0',
      400: '#B8B4AE',
      500: '#8B8685',
      600: '#5C5856',
      700: '#3D3A38',
      800: '#2A2826',
      900: '#1A1917',
    },
    
    // Special colors for meditation moods
    calm: '#B4C4B0',      // Soft sage
    focus: '#8B9F82',     // Main sage
    relax: '#C4A77D',     // Terracotta
    sleep: '#1A1D29',     // Deep navy
    energy: '#D4C4A8',    // Soft gold
    
    // Sleep mode colors
    sleepBackground: '#1A1D29',
    sleepSurface: '#252A3A',
    sleepAccent: '#C9B896',
    sleepText: '#F5F0E8',
    sleepTextMuted: '#8B8A99',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Softer, more organic border radii
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
    full: 9999,
  },
  
  // Font families
  fonts: {
    // Display/Headlines - Fraunces (warm, editorial serif)
    display: {
      regular: 'Fraunces-Regular',
      medium: 'Fraunces-Medium',
      semiBold: 'Fraunces-SemiBold',
      bold: 'Fraunces-Bold',
    },
    // Body text - Lora (readable serif)
    body: {
      regular: 'Lora-Regular',
      medium: 'Lora-Medium',
      semiBold: 'Lora-SemiBold',
      bold: 'Lora-Bold',
      italic: 'Lora-Italic',
    },
    // UI/Labels - DM Sans (friendly sans-serif)
    ui: {
      regular: 'DMSans-Regular',
      medium: 'DMSans-Medium',
      semiBold: 'DMSans-SemiBold',
      bold: 'DMSans-Bold',
    },
  },
  
  typography: {
    // Display - for hero text (Fraunces)
    display: {
      fontFamily: 'Fraunces-Bold',
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.5,
    },
    h1: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h2: {
      fontFamily: 'Fraunces-SemiBold',
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.2,
    },
    h3: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 20,
      lineHeight: 28,
    },
    h4: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 17,
      lineHeight: 24,
    },
    body: {
      fontFamily: 'Lora-Regular',
      fontSize: 16,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'Lora-Medium',
      fontSize: 16,
      lineHeight: 24,
    },
    bodySmall: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      lineHeight: 20,
    },
    caption: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 16,
    },
    label: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.3,
    },
    // Quote/intention text (italic serif)
    quote: {
      fontFamily: 'Lora-Italic',
      fontSize: 18,
      lineHeight: 28,
    },
    // Button text
    button: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 16,
      lineHeight: 24,
    },
  },
  
  // Warmer, softer shadows
  shadows: {
    sm: {
      shadowColor: '#3D3A38',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#3D3A38',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#3D3A38',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
    glow: {
      shadowColor: '#8B9F82',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    },
  },
  
  // Gradient presets
  gradients: {
    warmSunrise: ['#FAF8F5', '#F5EDE3'],
    sage: ['#A8B89F', '#8B9F82'],
    terracotta: ['#D4BFA0', '#C4A77D'],
    rose: ['#E4C0C0', '#D4A5A5'],
    sleepyNight: ['#1A1D29', '#252A3A'],
    dreamyPurple: ['#2A2D3E', '#1A1D29'],
    goldenHour: ['#D4C4A8', '#C4A77D'],
  },
};

// Helper for creating consistent card styles
export const cardStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.xl,
  padding: theme.spacing.lg,
  ...theme.shadows.sm,
};

// Helper for sleep mode card styles
export const sleepCardStyle = {
  backgroundColor: theme.colors.sleepSurface,
  borderRadius: theme.borderRadius.xl,
  padding: theme.spacing.lg,
};
