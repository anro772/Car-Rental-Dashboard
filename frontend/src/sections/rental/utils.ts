import { RentalExtended } from 'src/services/rentalsService';

// ----------------------------------------------------------------------

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
    return page > 0 ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

// ----------------------------------------------------------------------

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

// ----------------------------------------------------------------------

export function getComparator<Key extends keyof any>(
    order: 'asc' | 'desc',
    orderBy: string
): (
    a: { [key in Key]: number | string | boolean },
    b: { [key in Key]: number | string | boolean }
) => number {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy as Key)
        : (a, b) => -descendingComparator(a, b, orderBy as Key);
}

// ----------------------------------------------------------------------

export function applyFilter({
    inputData,
    comparator,
    filterName,
}: {
    inputData: RentalExtended[];
    comparator: (a: any, b: any) => number;
    filterName: string;
}) {
    const stabilizedThis = inputData.map((el, index) => [el, index] as const);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (filterName) {
        inputData = inputData.filter(
            (rental) => {
                const searchTerm = filterName.toLowerCase();
                const carInfo = `${rental.brand} ${rental.model} ${rental.license_plate}`.toLowerCase();
                const customerInfo = (rental.customer_name || '').toLowerCase();
                const status = rental.status.toLowerCase();
                const paymentStatus = rental.payment_status.toLowerCase();

                return (
                    carInfo.indexOf(searchTerm) !== -1 ||
                    customerInfo.indexOf(searchTerm) !== -1 ||
                    status.indexOf(searchTerm) !== -1 ||
                    paymentStatus.indexOf(searchTerm) !== -1
                );
            }
        );
    }

    return inputData;
}