import type { } from '@mui/lab/themeAugmentation';
import type { } from '@mui/material/themeCssVarsAugmentation';

import { useMemo } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { Experimental_CssVarsProvider as CssVarsProvider, useColorScheme } from '@mui/material/styles';

import { createTheme } from './create-theme';

// ----------------------------------------------------------------------

// Hook to use the color mode
export function useColorMode() {
  const { mode, setMode } = useColorScheme();

  const toggleColorMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return {
    mode,
    toggleColorMode,
    isDarkMode: mode === 'dark',
    isLightMode: mode === 'light',
  };
}

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const theme = useMemo(() => createTheme(), []);

  return (
    <CssVarsProvider theme={theme} defaultMode="light" modeStorageKey="app-theme-mode">
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}