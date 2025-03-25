import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ProductsView } from 'src/sections/cars/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Cars - ${CONFIG.appName}`}</title>
      </Helmet>

      <ProductsView />
    </>
  );
}
