import { useColorMode } from '../../theme/theme-provider';
import Button from '@mui/material/Button';

interface ThemeToggleProps {
    sx?: object;
}

export function SimpleThemeToggle({ sx }: ThemeToggleProps) {
    const { mode, toggleColorMode } = useColorMode();

    return (
        <Button
            onClick={toggleColorMode}
            color="inherit"
            sx={sx}
        >
            {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>
    );
}

export default SimpleThemeToggle;