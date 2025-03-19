import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'src/routes/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useLocation } from 'react-router-dom';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { CustomerTableRow } from '../user-table-row';
import { CustomerTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { CustomerTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import customersService, { Customer, NewCustomer } from 'src/services/customersService';

// ----------------------------------------------------------------------

export function CustomerView() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewCustomerDialog, setOpenNewCustomerDialog] = useState(false);
  const location = useLocation();
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    driver_license: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const table = useTable();

  const [filterName, setFilterName] = useState('');

  const dataFiltered = applyFilter({
    inputData: customers,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Get customer ID from URL query parameter
    const searchParams = new URLSearchParams(location.search);
    const customerParam = searchParams.get('customer');

    if (customerParam && customers.length > 0) {
      const customerId = customerParam.toString();

      // Select this customer
      table.onSelectRow(customerId);

      // Find the customer in the list
      const customer = customers.find(c => c.id.toString() === customerId);

      if (customer) {
        // Show info notification
        showSnackbar(`Showing details for ${customer.first_name} ${customer.last_name}`, 'info');

        // Wait for the table to render, then scroll to the customer row
        setTimeout(() => {
          // Try to find the customer row by its ID
          const rowElement = document.querySelector(`[data-customer-id="${customerId}"]`);
          if (rowElement) {
            // Scroll to the element
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add a highlight effect
            rowElement.classList.add('highlight-row');
            setTimeout(() => {
              rowElement.classList.remove('highlight-row');
            }, 2000);
          }
        }, 300);
      }
    }
  }, [location.search, customers]);

  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    // Update the customers array with the updated data
    setCustomers(prevCustomers =>
      prevCustomers.map(customer =>
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );

    // Show success notification
    showSnackbar('Customer updated successfully', 'success');
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getAllCustomers();
      setCustomers(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('No customers loaded');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await customersService.deleteCustomer(id);
      setCustomers(customers.filter(customer => customer.id !== id));
      showSnackbar('Customer deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showSnackbar('Failed to delete customer. They may have active rentals.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!table.selected.length) return;

    try {
      const deletePromises = table.selected.map(id =>
        customersService.deleteCustomer(parseInt(id))
      );

      await Promise.all(deletePromises);

      // Update customers list
      setCustomers(customers.filter(customer =>
        !table.selected.includes(customer.id.toString())
      ));

      // Clear selection
      table.onSelectAllRows(false, []);
      showSnackbar(`${table.selected.length} customers deleted successfully`, 'success');
    } catch (err) {
      console.error('Failed to delete customers:', err);
      showSnackbar('Failed to delete one or more customers. They may have active rentals.', 'error');
    }
  };

  const handleSendEmail = () => {
    if (!table.selected.length) return;

    const selectedCustomers = customers.filter(customer =>
      table.selected.includes(customer.id.toString())
    );

    const emailAddresses = selectedCustomers.map(c => c.email).join(', ');

    // Open default email client
    window.location.href = `mailto:${emailAddresses}`;
    showSnackbar('Email client opened', 'info');
  };

  const handleOpenNewCustomerDialog = () => {
    setOpenNewCustomerDialog(true);
  };

  const handleCloseNewCustomerDialog = () => {
    setOpenNewCustomerDialog(false);
    // Reset form
    setNewCustomer({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      driver_license: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!newCustomer.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!newCustomer.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!newCustomer.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newCustomer.email)) {
      errors.email = 'Email is invalid';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCustomer = async () => {
    if (!validateForm()) return;

    try {
      const newCreatedCustomer = await customersService.createCustomer(newCustomer);

      // Add new customer to the list
      setCustomers(prev => [...prev, newCreatedCustomer]);

      handleCloseNewCustomerDialog();
      showSnackbar('Customer created successfully', 'success');
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      if (err.response?.data?.error?.includes('Email address already exists')) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Email address already exists'
        }));
      } else {
        showSnackbar('Failed to create customer', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Customers
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenNewCustomerDialog}
        >
          New Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CustomerTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          onDelete={handleBulkDelete}
          onEmail={handleSendEmail}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <CustomerTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={customers.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    customers.map((customer) => customer.id.toString())
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'email', label: 'Email' },
                  { id: 'phone', label: 'Phone' },
                  { id: 'address', label: 'Address' },
                  { id: 'driver_license', label: 'Driver License' },
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CircularProgress />
                    </td>
                  </TableRow>
                ) : (
                  dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <CustomerTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id.toString())}
                        onSelectRow={() => table.onSelectRow(row.id.toString())}
                        onDeleteRow={() => handleDeleteCustomer(row.id)}
                        onUpdateSuccess={handleCustomerUpdate}
                      />
                    ))
                )}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, customers.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {/* New Customer Dialog */}
      <Dialog open={openNewCustomerDialog} onClose={handleCloseNewCustomerDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }} noValidate>
            <FormControl fullWidth error={!!formErrors.first_name} sx={{ mb: 2 }}>
              <TextField
                required
                name="first_name"
                label="First Name"
                value={newCustomer.first_name}
                onChange={handleFormChange}
                error={!!formErrors.first_name}
              />
              {formErrors.first_name && (
                <FormHelperText>{formErrors.first_name}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={!!formErrors.last_name} sx={{ mb: 2 }}>
              <TextField
                required
                name="last_name"
                label="Last Name"
                value={newCustomer.last_name}
                onChange={handleFormChange}
                error={!!formErrors.last_name}
              />
              {formErrors.last_name && (
                <FormHelperText>{formErrors.last_name}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={!!formErrors.email} sx={{ mb: 2 }}>
              <TextField
                required
                name="email"
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={handleFormChange}
                error={!!formErrors.email}
              />
              {formErrors.email && (
                <FormHelperText>{formErrors.email}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="phone"
                label="Phone"
                value={newCustomer.phone}
                onChange={handleFormChange}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="address"
                label="Address"
                multiline
                rows={2}
                value={newCustomer.address}
                onChange={handleFormChange}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="driver_license"
                label="Driver License"
                value={newCustomer.driver_license}
                onChange={handleFormChange}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewCustomerDialog}>Cancel</Button>
          <Button onClick={handleCreateCustomer} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}