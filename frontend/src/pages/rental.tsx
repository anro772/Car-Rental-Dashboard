import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { RentalView } from 'src/sections/rental/view/rental-view';

// ----------------------------------------------------------------------

export default function RentalsPage() {
    return (
        <>
            <Helmet>
                <title> {`Rentals - ${CONFIG.appName}`}</title>
            </Helmet>

            <RentalView />
        </>
    );
}