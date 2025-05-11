import { Customer } from 'src/services/customersService';

// ----------------------------------------------------------------------

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page > 0 ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

// ----------------------------------------------------------------------

// Helper function to get license status priority for sorting
function getLicenseStatusPriority(customer: Customer): number {
  // Priority: Verified (highest) > Unverified > No License (lowest)
  if (customer.license_verified) {
    return 3; // Verified
  } else if (customer.license_image_url) {
    return 2; // Unverified
  } else {
    return 1; // No License
  }
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  // Special case for sorting by license status
  if (orderBy === 'license_status' as unknown as keyof T) {
    const aCustomer = a as unknown as Customer;
    const bCustomer = b as unknown as Customer;

    const aPriority = getLicenseStatusPriority(aCustomer);
    const bPriority = getLicenseStatusPriority(bCustomer);

    if (bPriority < aPriority) {
      return -1;
    }
    if (bPriority > aPriority) {
      return 1;
    }
    return 0;
  }

  // Special case for name sorting (first_name + last_name)
  if (orderBy === 'name' as unknown as keyof T) {
    const aCustomer = a as unknown as Customer;
    const bCustomer = b as unknown as Customer;

    const aName = `${aCustomer.first_name} ${aCustomer.last_name}`.toLowerCase();
    const bName = `${bCustomer.first_name} ${bCustomer.last_name}`.toLowerCase();

    if (bName < aName) {
      return -1;
    }
    if (bName > aName) {
      return 1;
    }
    return 0;
  }

  // Default case for other fields
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
        const address = customer.address?.toLowerCase() || '';
        const driverLicense = customer.driver_license?.toLowerCase() || '';
        const status = customer.status?.toLowerCase() || '';
        const searchTerm = filterName.toLowerCase();

        return (
          fullName.indexOf(searchTerm) !== -1 ||
          email.indexOf(searchTerm) !== -1 ||
          phone.indexOf(searchTerm) !== -1 ||
          address.indexOf(searchTerm) !== -1 ||
          driverLicense.indexOf(searchTerm) !== -1 ||
          status.indexOf(searchTerm) !== -1
        );
      }
    );
  }

  return inputData;
}