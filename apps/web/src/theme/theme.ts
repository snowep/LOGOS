import { createTheme, ThemeOptions } from '@mui/material/styles';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
  iconSizes,
  layout,
  transitions,
  zIndex,
  accent,
} from './tokens';

// Dark theme palette
const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: {
    main: accent.main,
    light: accent.light,
    dark: accent.dark,
    contrastText: accent.contrastText,
  },
  secondary: {
    main: '#A855F7',
    light: '#C084FC',
    dark: '#9333EA',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0F0E0D',
    paper: '#171514',
  },
  divider: '#34302C',
  text: {
    primary: '#F4F0EA',
    secondary: '#B8B1A8',
    disabled: '#746E68',
  },
  success: {
    main: '#6FBF8A',
    light: '#8FD3A6',
    dark: '#58A670',
    contrastText: '#0F0E0D',
  },
  warning: {
    main: '#D6A85E',
    light: '#E0C085',
    dark: '#B88C4A',
    contrastText: '#0F0E0D',
  },
  error: {
    main: '#D97878',
    light: '#E39A9A',
    dark: '#C05E5E',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#7FA7C7',
    light: '#A0C0D9',
    dark: '#628AB0',
    contrastText: '#0F0E0D',
  },
  action: {
    hover: 'rgba(244,240,234,0.04)',
    selected: 'rgba(184,121,69,0.12)',
    disabled: 'rgba(244,240,234,0.26)',
    disabledBackground: 'rgba(244,240,234,0.12)',
    focus: 'rgba(184,121,69,0.16)',
  },
};

// Light theme palette
const lightPalette: ThemeOptions['palette'] = {
  mode: 'light',
  primary: {
    main: accent.main,
    light: accent.light,
    dark: accent.dark,
    contrastText: accent.contrastText,
  },
  secondary: {
    main: '#9333EA',
    light: '#A855F7',
    dark: '#7E22CE',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F5F2ED',
    paper: '#FFFDF9',
  },
  divider: '#DDD7CF',
  text: {
    primary: '#211E1B',
    secondary: '#655F59',
    disabled: '#9B948C',
  },
  success: {
    main: '#3F7D55',
    light: '#5AA372',
    dark: '#316344',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#916D2D',
    light: '#A6854A',
    dark: '#785723',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#A64B4B',
    light: '#BF6B6B',
    dark: '#8C3D3D',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#4E6F8D',
    light: '#6A8BB5',
    dark: '#3E5A74',
    contrastText: '#FFFFFF',
  },
  action: {
    hover: 'rgba(33,30,27,0.04)',
    selected: 'rgba(184,121,69,0.12)',
    disabled: 'rgba(33,30,27,0.26)',
    disabledBackground: 'rgba(33,30,27,0.12)',
    focus: 'rgba(184,121,69,0.16)',
  },
};

// Base theme options shared by both light and dark
const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: typography.fontFamily,
    h1: typography.pageH1,
    h2: typography.pageH2,
    h3: typography.h3,
    h4: typography.section,
    h5: typography.cardTitle,
    h6: typography.cardTitle,
    body1: typography.body1,
    body2: typography.body2,
    caption: typography.caption,
    overline: typography.overline,
    button: typography.button,
  },
  shape: {
    borderRadius: borderRadius.md,
  },
  shadows: Array(25).fill('none') as any,
  transitions: {
    duration: {
      shortest: transitions.shortest,
      shorter: transitions.shorter,
      short: transitions.short,
      standard: transitions.standard,
      complex: transitions.complex,
    },
  },
  zIndex: {
    mobileStepper: zIndex.tooltip,
    speedDial: zIndex.tooltip,
    appBar: zIndex.appBar,
    drawer: zIndex.drawer,
    modal: zIndex.modal,
    snackbar: zIndex.snackbar,
    tooltip: zIndex.tooltip,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          margin: 0,
          padding: 0,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          margin: `${spacing.xs}px ${spacing.sm}px`,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: iconSizes.normal,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 400,
          fontSize: '0.875rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          height: 40,
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          borderRadius: borderRadius.md,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '1rem',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: borderRadius.sm,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'divider',
        },
      },
    },
  },
};

// Create dark theme
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: darkPalette,
});

// Create light theme
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: lightPalette,
});

// Export both themes
export const themes = {
  dark: darkTheme,
  light: lightTheme,
};

// Export layout, spacing, iconSizes, etc. for use in components
export { layout, spacing, iconSizes, typography, borderRadius, transitions, zIndex, accent };