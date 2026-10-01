'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { themes, darkTheme, lightTheme } from './theme';

type Theme = typeof darkTheme;

type ThemeContextValue = {
  mode: PaletteMode;
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeRegistry');
  }
  return context;
}

interface ThemeRegistryProps {
  children: React.ReactNode;
  defaultMode?: PaletteMode;
  storageKey?: string;
}

export function ThemeRegistry({
  children,
  defaultMode = 'dark',
  storageKey = 'logos-theme-mode',
}: ThemeRegistryProps) {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as PaletteMode | null;
      if (stored) return stored;
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return defaultMode;
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as PaletteMode | null;
    if (stored) {
      setModeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, mode);
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, [mode, mounted, storageKey]);

  const theme = useMemo(() => themes[mode], [mode]);

  const toggleTheme = () => {
    setModeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setMode = (newMode: PaletteMode) => {
    setModeState(newMode);
  };

  if (!mounted) {
    return (
      <MuiThemeProvider theme={themes[defaultMode]}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    );
  }

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}