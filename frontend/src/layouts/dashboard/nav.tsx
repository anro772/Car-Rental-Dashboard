import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { varAlpha } from 'src/theme/styles';
import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
import { NavThemeToggle } from './nav-theme-toggle';

// ----------------------------------------------------------------------
export type NavContentProps = {
  data: {
    path: string;
    title: string;
    icon: React.ReactNode;
    info?: React.ReactNode;
  }[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'flex', // Changed to always display
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
        ...sx,
      }}
    >
      <NavContent
        data={data}
        slots={{
          ...slots,
          bottomArea: (
            <>
              <NavThemeToggle />
              {slots?.bottomArea}
            </>
          ),
        }}
      />
    </Box>
  );
}

export function NavContent({ data, slots, sx }: NavContentProps) {
  const pathname = usePathname();
  return (
    <>
      <Logo />
      {slots?.topArea}
      <Scrollbar fillContent>
        <Box component="nav" display="flex" flex="1 1 auto" flexDirection="column" sx={sx}>
          <Box component="ul" gap={0.5} display="flex" flexDirection="column">
            {data.map((item) => {
              const isActived = item.path === pathname;
              return (
                <ListItem disableGutters disablePadding key={item.title}>
                  <ListItemButton
                    disableGutters
                    component={RouterLink}
                    href={item.path}
                    sx={{
                      pl: 'var(--layout-nav-item-padding-x, 16px)',
                      py: 1,
                      gap: 2,
                      pr: 1.5,
                      borderRadius: 0.75,
                      typography: 'body2',
                      fontWeight: 'fontWeightMedium',
                      color: 'var(--layout-nav-item-color)',
                      minHeight: 'var(--layout-nav-item-height)',
                      ...(isActived && {
                        fontWeight: 'fontWeightSemiBold',
                        bgcolor: 'var(--layout-nav-item-active-bg)',
                        color: 'var(--layout-nav-item-active-color)',
                        '&:hover': {
                          bgcolor: 'var(--layout-nav-item-hover-bg)',
                        },
                      }),
                    }}
                  >
                    <Box component="span" sx={{
                      width: 'var(--layout-nav-item-icon-size, 28px)',
                      height: 'var(--layout-nav-item-icon-size, 28px)'
                    }}>
                      {item.icon}
                    </Box>
                    <Box component="span" flexGrow={1}>
                      {item.title}
                    </Box>
                    {item.info && item.info}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        </Box>
      </Scrollbar>
      {slots?.bottomArea}
    </>
  );
}