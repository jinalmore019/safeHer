// Design System — SafeHer
// Typography, Colors, Spacing, Shadows

export const Colors = {
  // Backgrounds
  bg: {
    primary: '#0D0D1A',
    secondary: '#13131F',
    card: '#1A1A2E',
    elevated: '#1F1F35',
  },
  // Brand
  brand: {
    primary: '#E63B6F',      // SafeHer rose/red — emergency accent
    secondary: '#9B5DE5',    // purple — trust/safety
    accent: '#F72585',       // bright pink for CTAs
    teal: '#4CC9F0',         // info/safe state
  },
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0C8',
    muted: '#6B6B8A',
    inverse: '#0D0D1A',
  },
  // Status
  status: {
    safe: '#06D6A0',
    warning: '#FFB703',
    danger: '#E63B6F',
    info: '#4CC9F0',
  },
  // UI
  ui: {
    border: '#2A2A40',
    divider: '#1E1E30',
    overlay: 'rgba(13,13,26,0.85)',
    inputBg: '#1A1A2E',
    placeholder: '#4A4A6A',
  },
};

export const Typography = {
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#E63B6F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const Layout = {
  screenPaddingH: Spacing.base,
  headerHeight: 60,
  tabBarHeight: 70,
  inputHeight: 52,
  buttonHeight: 52,
};
