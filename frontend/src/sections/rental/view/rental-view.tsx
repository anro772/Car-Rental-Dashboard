import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { RentalTableRow } from '../rental-table-row';
import { RentalTableHead } from '../rental-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { RentalTableToolbar } from '../rental-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { RentalAddModal } from '../rental-add-modal';

import rentalsService, { RentalExtended } from 'src/services/rentalsService';
import customersService, { Customer } from 'src/services/customersService';

// ----------------------------------------------------------------------

export function RentalView() {
    const [rentals, setRentals] = useState<RentalExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning'
    });

    const location = useLocation();
    const navigate = useNavigate();
    const table = useTable();
    const [openRentalModal, setOpenRentalModal] = useState(false);

    const [filterName, setFilterName] = useState('');

    // Get customerId from URL query parameters
    useEffect(() => {
        // Get customerId from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const customerParam = searchParams.get('customer');

        if (customerParam) {
            const id = Number(customerParam);
            setCustomerId(id);

            // Fetch customer details
            customersService.getCustomer(id)
                .then(data => {
                    setCustomer(data);
                })
                .catch(err => {
                    console.error('Failed to fetch customer:', err);
                    setError('Could not load customer information');
                });

            // Reset to 'all' tab when a customer is selected
            setActiveTab('all');
        } else {
            setCustomerId(null);
            setCustomer(null);
        }
    }, [location.search]);

    const dataFiltered = applyFilter({
        inputData: rentals,
        comparator: getComparator(table.order, table.orderBy),
        filterName,
    });

    const notFound = !dataFiltered.length && !!filterName;

    useEffect(() => {
        fetchRentals();
    }, [activeTab, customerId]);

    const fetchRentals = async () => {
        try {
            setLoading(true);
            let data: RentalExtended[] = [];

            // If we have a customerId, fetch only rentals for that customer
            if (customerId) {
                try {
                    data = await rentalsService.getRentalsForCustomer(customerId);
                } catch (err) {
                    console.error(`Failed to fetch rentals for customer ${customerId}:`, err);
                    setError('Could not load customer rentals');
                }
            } else {
                // Otherwise fetch based on the selected tab
                try {
                    switch (activeTab) {
                        case 'active':
                            data = await rentalsService.getRentalsByStatus('active');
                            break;
                        case 'pending':
                            data = await rentalsService.getRentalsByStatus('pending');
                            break;
                        case 'completed':
                            data = await rentalsService.getRentalsByStatus('completed');
                            break;
                        case 'cancelled':
                            data = await rentalsService.getRentalsByStatus('cancelled');
                            break;
                        case 'overdue':
                            try {
                                data = await rentalsService.getOverdueRentals();
                            } catch (error: any) {
                                // If it's a 404, it means no overdue rentals (good thing!)
                                if (error?.response?.status === 404) {
                                    data = []; // Empty array for no overdue rentals
                                } else {
                                    throw error; // Re-throw if it's a different error
                                }
                            }
                            break;
                        case 'upcoming':
                            data = await rentalsService.getUpcomingRentals();
                            break;
                        case 'all':
                        default:
                            data = await rentalsService.getAllRentals();
                            break;
                    }
                    setError(''); // Clear any previous errors
                } catch (err) {
                    console.error(`Failed to fetch ${activeTab} rentals:`, err);
                    setError(`Could not load ${activeTab} rentals`);
                }
            }

            setRentals(data);
        } catch (err) {
            console.error('Failed to fetch rentals:', err);
            setError('Could not load rentals');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        try {
            // Get selected rentals
            const selectedRentals = rentals.filter(rental =>
                table.selected.includes(rental.id.toString())
            );

            if (selectedRentals.length === 0) return;

            // Define CSV headers
            const headers = [
                'ID', 'Car', 'License Plate', 'Customer', 'Start Date', 'End Date',
                'Status', 'Payment Status', 'Total Cost', 'Notes'
            ];

            // Map rental data to CSV rows
            const rows = selectedRentals.map(rental => [
                rental.id,
                `${rental.brand} ${rental.model}`,
                rental.license_plate,
                rental.customer_name,
                rental.start_date,
                rental.end_date,
                rental.status,
                rental.payment_status,
                rental.total_cost,
                rental.notes || ''
            ]);

            // Add headers to the beginning
            const csvData = [headers, ...rows];

            // Convert to CSV string
            const csvContent = csvData.map(row => row.join(',')).join('\n');

            // Create download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `rentals_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();

            // Clean up
            URL.revokeObjectURL(url);
            showSnackbar('Export completed successfully', 'success');
        } catch (err) {
            console.error('Failed to export CSV:', err);
            showSnackbar('Failed to export data to CSV', 'error');
        }
    };

    const handleDeleteRental = async (id: number) => {
        try {
            await rentalsService.deleteRental(id);
            setRentals(rentals.filter(rental => rental.id !== id));
            showSnackbar('Rental deleted successfully', 'success');
        } catch (err) {
            console.error('Failed to delete rental:', err);
            showSnackbar('Failed to delete rental. It may be active.', 'error');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            // Convert string IDs to numbers
            const rentalIds = ids.map(id => parseInt(id));

            // Delete rentals one by one
            const deletePromises = rentalIds.map(id => rentalsService.deleteRental(id));
            await Promise.all(deletePromises);

            // Update the rentals list by filtering out deleted rentals
            setRentals(rentals.filter(rental => !rentalIds.includes(rental.id)));

            // Clear selected rows
            table.onSelectAllRows(false, []);

            showSnackbar(`${ids.length} rentals deleted successfully`, 'success');
        } catch (err) {
            console.error('Failed to delete rentals:', err);
            showSnackbar('Failed to delete one or more rentals. Some may be active.', 'error');
        }
    };

    const handleUpdateRentalStatus = async (id: number, status: RentalExtended['status']) => {
        try {
            const updatedRental = await rentalsService.updateRentalStatus(id, status);
            setRentals(rentals.map(rental =>
                rental.id === id ? updatedRental : rental
            ));
            showSnackbar(`Rental status updated to ${status}`, 'success');
        } catch (err) {
            console.error('Failed to update rental status:', err);
            showSnackbar('Failed to update rental status', 'error');
        }
    };

    const handleUpdatePaymentStatus = async (id: number, paymentStatus: RentalExtended['payment_status']) => {
        try {
            const updatedRental = await rentalsService.updatePaymentStatus(id, paymentStatus);
            setRentals(rentals.map(rental =>
                rental.id === id ? updatedRental : rental
            ));
            showSnackbar(`Payment status updated to ${paymentStatus}`, 'success');
        } catch (err) {
            console.error('Failed to update payment status:', err);
            showSnackbar('Failed to update payment status', 'error');
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
        table.onResetPage();
    };

    const handleGoBack = () => {
        navigate('/user'); // Navigate to the customer list
    };

    const handleClearCustomerFilter = () => {
        navigate('/rental'); // Clear the customer filter
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
            <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h4" flexGrow={1}>
                    {customer
                        ? `Rentals for ${customer.first_name} ${customer.last_name}`
                        : 'Rentals'}
                </Typography>

                {customer && (
                    <>
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<Iconify icon="eva:arrow-back-fill" />}
                            onClick={handleGoBack}
                            sx={{ mr: 1 }}
                        >
                            Back to Customers
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<Iconify icon="eva:close-outline" />}
                            onClick={handleClearCustomerFilter}
                            sx={{ mr: 1 }}
                        >
                            All Rentals
                        </Button>
                    </>
                )}

                <Button
                    variant="contained"
                    color="inherit"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => setOpenRentalModal(true)}
                >
                    New Rental
                </Button>
            </Box>

            {!customerId && (
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{ mb: 3 }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab value="all" label="All Rentals" />
                    <Tab value="active" label="Active" />
                    <Tab value="pending" label="Pending" />
                    <Tab value="completed" label="Completed" />
                    <Tab value="cancelled" label="Cancelled" />
                    <Tab value="overdue" label="Overdue" />
                    <Tab value="upcoming" label="Upcoming" />
                </Tabs>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {customer && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Showing rentals for customer: {customer.first_name} {customer.last_name} ({customer.email})
                </Alert>
            )}

            <Card>
                <RentalTableToolbar
                    numSelected={table.selected.length}
                    filterName={filterName}
                    onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setFilterName(event.target.value);
                        table.onResetPage();
                    }}
                    onBulkDelete={handleBulkDelete}
                    selectedIds={table.selected}
                    onExportCSV={handleExportCSV}
                />

                <RentalAddModal
                    open={openRentalModal}
                    onClose={() => setOpenRentalModal(false)}
                    onSuccess={fetchRentals}
                    customerId={customerId}
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <RentalTableHead
                                order={table.order}
                                orderBy={table.orderBy}
                                rowCount={rentals.length}
                                numSelected={table.selected.length}
                                onSort={table.onSort}
                                onSelectAllRows={(checked) =>
                                    table.onSelectAllRows(
                                        checked,
                                        rentals.map((rental) => rental.id.toString())
                                    )
                                }
                                headLabel={[
                                    { id: 'car', label: 'Car' },
                                    // Only show customer column if not filtered by customer
                                    ...(customerId ? [] : [{ id: 'customer', label: 'Customer' }]),
                                    { id: 'start_date', label: 'Start Date' },
                                    { id: 'end_date', label: 'End Date' },
                                    { id: 'status', label: 'Status' },
                                    { id: 'payment_status', label: 'Payment' },
                                    { id: 'total_cost', label: 'Total Cost', align: 'right' },
                                    { id: '' },
                                ]}
                            />
                            <TableBody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={customerId ? 7 : 8} style={{ textAlign: 'center', padding: '20px 0' }}>
                                            <CircularProgress />
                                        </td>
                                    </tr>
                                ) : dataFiltered.length > 0 ? (
                                    dataFiltered
                                        .slice(
                                            table.page * table.rowsPerPage,
                                            table.page * table.rowsPerPage + table.rowsPerPage
                                        )
                                        .map((row) => (
                                            <RentalTableRow
                                                key={row.id}
                                                row={row}
                                                selected={table.selected.includes(row.id.toString())}
                                                onSelectRow={() => table.onSelectRow(row.id.toString())}
                                                onDeleteRow={() => handleDeleteRental(row.id)}
                                                onUpdateStatus={(status) => handleUpdateRentalStatus(row.id, status)}
                                                onUpdatePayment={(status) => handleUpdatePaymentStatus(row.id, status)}
                                                hideCustomerColumn={!!customerId}
                                            />
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={customerId ? 7 : 8} style={{ textAlign: 'center', padding: '40px 0' }}>
                                            {customerId ? (
                                                <>
                                                    <Typography variant="h6" sx={{ mb: 1 }}>No rentals found</Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        This customer doesn't have any rentals yet.
                                                    </Typography>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography variant="h6" sx={{ mb: 1 }}>No rentals found</Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {activeTab === 'all'
                                                            ? 'There are no rentals in the system yet.'
                                                            : activeTab === 'overdue'
                                                                ? 'Great news! There are no overdue rentals.'
                                                                : `No ${activeTab} rentals found.`}
                                                    </Typography>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                )}

                                <TableEmptyRows
                                    height={68}
                                    emptyRows={emptyRows(table.page, table.rowsPerPage, rentals.length)}
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
    const [orderBy, setOrderBy] = useState('start_date');
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selected, setSelected] = useState<string[]>([]);
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

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