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

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  theme: darkTheme,
  toggleTheme: () => {},
  setMode: () => {},
});

export function useThemeMode() {
  const context = useContext(ThemeContext);
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
  const [mode, setModeState] = useState<PaletteMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // First launch behaviour: dark unless an explicit stored preference exists.
    // We deliberately do NOT consult prefers-color-scheme.
    const stored = typeof window !== 'undefined'
      ? (localStorage.getItem(storageKey) as PaletteMode | null)
      : null;
    if (stored === 'light' || stored === 'dark') {
      setModeState(stored);
    }
    setMounted(true);
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

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}