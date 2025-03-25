import type { Theme } from '@mui/material/styles';

import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export const baseVars = (theme: Theme) => {
  // Access the mode correctly from theme
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    // nav - adjust background based on theme mode
    '--layout-nav-bg': isDarkMode
      ? theme.vars.palette.background.paper
      : theme.vars.palette.common.white,

    // nav border - adjust opacity for dark mode
    '--layout-nav-border-color': varAlpha(
      theme.vars.palette.grey['500Channel'],
      isDarkMode ? 0.16 : 0.08
    ),

    '--layout-nav-zIndex': 1101,
    '--layout-nav-mobile-width': '340px',
    '--layout-nav-vertical-width': '280px',

    // nav item - keep colors consistent with theme
    '--layout-nav-item-height': '56px',
    '--layout-nav-item-color': theme.vars.palette.text.secondary,
    '--layout-nav-item-active-color': theme.vars.palette.primary.main,

    // Active background - adjust opacity for better visibility in dark mode
    '--layout-nav-item-active-bg': varAlpha(
      theme.vars.palette.primary.mainChannel,
      isDarkMode ? 0.16 : 0.08
    ),

    // Hover background - adjust opacity for better visibility in dark mode
    '--layout-nav-item-hover-bg': varAlpha(
      theme.vars.palette.primary.mainChannel,
      isDarkMode ? 0.24 : 0.16
    ),

    '--layout-nav-item-padding-x': '16px',
    '--layout-nav-item-icon-size': '28px',

    // header
    '--layout-header-blur': '8px',
    '--layout-header-zIndex': 1100,
    '--layout-header-mobile-height': '64px',
    '--layout-header-desktop-height': '72px',
  };
};