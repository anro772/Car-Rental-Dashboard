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
    title: 'Cars',
    path: '/products',
    icon: icon('ic-car'),
    info: (
      <Label color="error" variant="inverted">
        +3
      </Label>
    ),
  },
  {
    title: 'Customers',
    path: '/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Rentals',
    path: '/rental',
    icon: icon('ic-rental'),
  },
  {
    title: 'Blog',
    path: '/blog',
    icon: icon('ic-blog'),
  },
  // {
  //   title: 'Sign in',
  //   path: '/sign-in',
  //   icon: icon('ic-lock'),
  // },
  // {
  //   title: 'Not found',
  //   path: '/404',
  //   icon: icon('ic-disabled'),
  // },
];
