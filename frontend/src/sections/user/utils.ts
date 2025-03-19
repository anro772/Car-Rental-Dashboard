import { Customer } from 'src/services/customersService';

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
  inputData: Customer[];
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
      (customer) => {
        const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.phone?.toLowerCase() || '';
        const searchTerm = filterName.toLowerCase();

        return (
          fullName.indexOf(searchTerm) !== -1 ||
          email.indexOf(searchTerm) !== -1 ||
          phone.indexOf(searchTerm) !== -1
        );
      }
    );
  }

  return inputData;
}