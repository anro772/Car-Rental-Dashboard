import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';
import { varAlpha } from 'src/theme/styles';
import { ThemeToggle } from 'src/components/theme-toggle';

export function NavThemeToggle() {
    const { mode } = useColorScheme();

    return (
        <Box
            sx={{
                py: 3,
                px: 2.5,
                mt: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: (theme) => {
                    const isDarkMode = theme.palette.mode === 'dark';
                    const opacity = isDarkMode ? 0.24 : 0.16;
                    return `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], opacity)}`;
                },
            }}
        >
            <Box component="span" sx={{ typography: 'body2' }}>
                {mode === 'dark' ? 'Mod luminos' : 'Mod întunecat'}
            </Box>
            <ThemeToggle />
        </Box>
    );
}