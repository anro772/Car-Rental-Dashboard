import { useColorMode } from '../../theme/theme-provider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

interface ThemeToggleProps {
  sx?: object;
}

export function ThemeToggle({ sx }: ThemeToggleProps) {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label="toggle dark mode"
        sx={sx}
      >
        {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}

export default ThemeToggle;