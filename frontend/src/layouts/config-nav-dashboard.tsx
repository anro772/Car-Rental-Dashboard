//src/layouts/config-nav-dashboard.tsx
import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor width="100%" height="100%" src={`/assets/icons/navbar/${name}.svg`} />
);

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },

  {
    title: 'Mașini',
    path: '/cars',
    icon: icon('ic-car'),
    info: (
      <Label color="error" variant="inverted">
        +3
      </Label>
    ),
  },
  {
    title: 'Clienți',
    path: '/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Închirieri',
    path: '/rental',
    icon: icon('ic-rental'),
  },
  // {
  //   title: 'Blog',
  //   path: '/blog',
  //   icon: icon('ic-blog'),
  // },
];
