// Centralized theme tokens for LOGOS
// These tokens define the complete visual language and can be swapped for different brand palettes

export const geistFont = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// Typography scale
export const typography = {
  fontFamily: geistFont,
  body1: { fontSize: '1rem', lineHeight: 1.6, fontWeight: 400 },     // 16px
  body2: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 400 },  // 14px
  caption: { fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 400 }, // 12px
  overline: { fontSize: '0.6875rem', lineHeight: 1.3, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const }, // 11px
  pageH1: { fontSize: '2rem', lineHeight: 1.2, fontWeight: 600 },     // 32px
  pageH2: { fontSize: '1.75rem', lineHeight: 1.25, fontWeight: 600 }, // 28px
  h3: { fontSize: '1.25rem', lineHeight: 1.3, fontWeight: 600 },      // 20px
  section: { fontSize: '1.125rem', lineHeight: 1.35, fontWeight: 600 }, // 18px
  cardTitle: { fontSize: '1rem', lineHeight: 1.4, fontWeight: 600 },  // 16px
  button: { fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 500, textTransform: 'none' as const },
};

// Spacing tokens (8px base)
export const spacing = {
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 16,  // 16px
  lg: 24,  // 24px
  xl: 32,  // 32px
  xxl: 48, // 48px
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadow depths
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0,0,0,0.05)',
  sm: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
  xl: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
};

// Icon sizes
export const iconSizes = {
  navigation: 24,
  normal: 22,
  button: 20,
  metadata: 18,
  emptyState: 32,
};

// Layout constants
export const layout = {
  railCollapsed: 64,
  railExpanded: 248,
  topBarHeight: 56,
  contentMaxWidth: 1120,
  pagePadding: 32,
  sectionGap: 32,
  cardGap: 16,
  pagePaddingMobile: 16,
  topBarHeightMobile: 56,
};

// Transition durations (reduced motion support)
export const transitions = {
  shortest: 0,
  shorter: 150,
  short: 200,
  standard: 250,
  complex: 300,
};

// Z-index layers
export const zIndex = {
  drawer: 1200,
  appBar: 1300,
  modal: 1400,
  snackbar: 1500,
  tooltip: 1600,
};

// Accent color (temporary warm accent, replaceable when brand is finalized)
export const accent = {
  light: '#D3A67B',
  main: '#B87945',
  dark: '#8C5630',
  contrastText: '#FFFFFF',
};