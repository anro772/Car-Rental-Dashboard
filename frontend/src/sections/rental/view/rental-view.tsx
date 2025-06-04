// src/sections/rental/view/rental-view.tsx
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
import carsService, { Car } from 'src/services/carsService'; // Import Car type
// import { fDate } from 'src/utils/format-time'; // Not directly used here, but in sub-components

const STATUS_TRANSLATIONS: Record<string, string> = {
    'active': 'Activ',
    'pending': 'În așteptare',
    'completed': 'Finalizat',
    'cancelled': 'Anulat',
    'overdue': 'Depășit',
    'upcoming': 'Viitor',
    'all': 'Toate'
};

const PAYMENT_TRANSLATIONS: Record<string, string> = {
    'unpaid': 'Neplătit',
    'partial': 'Parțial',
    'paid': 'Plătit'
};

export function RentalView() {
    const [rentals, setRentals] = useState<RentalExtended[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerId, setCustomerId] = useState<number | null>(null);

    const [carDetails, setCarDetails] = useState<Car | null>(null);
    const [carFilterId, setCarFilterId] = useState<number | null>(null);

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

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const customerParam = searchParams.get('customer');
        const carParam = searchParams.get('car');
        const tabParam = searchParams.get('tab');

        let currentCustomerId: number | null = null;
        let currentCarId: number | null = null;

        if (customerParam) {
            currentCustomerId = Number(customerParam);
            setCustomerId(currentCustomerId);
            setCarFilterId(null); // Clear car filter if customer filter is active
            setCarDetails(null);
            setActiveTab('all'); // Reset tab for specific filter

            customersService.getCustomer(currentCustomerId)
                .then(data => setCustomer(data))
                .catch(err => {
                    console.error('Failed to fetch customer:', err);
                    setError('Nu s-au putut încărca informațiile clientului');
                    setCustomer(null);
                });
        } else if (carParam) {
            currentCarId = Number(carParam);
            setCarFilterId(currentCarId);
            setCustomerId(null); // Clear customer filter if car filter is active
            setCustomer(null);
            setActiveTab('all'); // Reset tab for specific filter

            carsService.getCar(currentCarId)
                .then(data => setCarDetails(data))
                .catch(err => {
                    console.error('Failed to fetch car details:', err);
                    setError('Nu s-au putut încărca detaliile mașinii');
                    setCarDetails(null);
                });
        } else {
            // No specific customer or car filter
            setCustomerId(null);
            setCustomer(null);
            setCarFilterId(null);
            setCarDetails(null);
            if (tabParam && ['all', 'active', 'pending', 'completed', 'cancelled', 'overdue', 'upcoming'].includes(tabParam)) {
                setActiveTab(tabParam);
            } else {
                setActiveTab('all');
            }
        }
    }, [location.search]);


    const fetchRentals = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            let data: RentalExtended[] = [];

            if (customerId) {
                data = await rentalsService.getRentalsForCustomer(customerId);
            } else if (carFilterId) {
                data = await rentalsService.getRentalsForCar(carFilterId); // Assuming this service method exists
            } else {
                switch (activeTab) {
                    case 'active': data = await rentalsService.getRentalsByStatus('active'); break;
                    case 'pending': data = await rentalsService.getRentalsByStatus('pending'); break;
                    case 'completed': data = await rentalsService.getRentalsByStatus('completed'); break;
                    case 'cancelled': data = await rentalsService.getRentalsByStatus('cancelled'); break;
                    case 'overdue':
                        try { data = await rentalsService.getOverdueRentals(); }
                        catch (e: any) { if (e?.response?.status === 404) data = []; else throw e; }
                        break;
                    case 'upcoming': data = await rentalsService.getUpcomingRentals(); break;
                    case 'all': default: data = await rentalsService.getAllRentals(); break;
                }
            }
            setRentals(data);
        } catch (err) {
            console.error('Failed to fetch rentals:', err);
            if (customerId) setError('Nu s-au putut încărca închirierile clientului.');
            else if (carFilterId) setError('Nu s-au putut încărca închirierile pentru această mașină.');
            else setError(`Nu s-au putut încărca închirierile (${STATUS_TRANSLATIONS[activeTab]?.toLowerCase() || 'toate'}).`);
            setRentals([]); // Clear rentals on error
        } finally {
            setLoading(false);
        }
    }, [activeTab, customerId, carFilterId]);

    useEffect(() => {
        fetchRentals();
    }, [fetchRentals]);


    const dataFiltered = applyFilter({
        inputData: rentals,
        comparator: getComparator(table.order, table.orderBy),
        filterName,
    });

    const notFound = !dataFiltered.length && !!filterName;


    const handleDeleteRental = async (id: number) => {
        try {
            await rentalsService.deleteRental(id);
            setRentals(currentRentals => currentRentals.filter(rental => rental.id !== id));
            showSnackbar('Închirierea a fost ștearsă cu succes', 'success');
        } catch (err) {
            console.error('Failed to delete rental:', err);
            showSnackbar('Nu s-a putut șterge închirierea. Este posibil să fie activă.', 'error');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            const rentalIds = ids.map(id => parseInt(id, 10));
            // await Promise.all(rentalIds.map(id => rentalsService.deleteRental(id))); // Consider backend bulk delete if available
            for (const id of rentalIds) { // Sequential deletion to avoid race conditions if backend doesn't support bulk
                await rentalsService.deleteRental(id);
            }
            setRentals(currentRentals => currentRentals.filter(rental => !rentalIds.includes(rental.id)));
            table.onSelectAllRows(false, []);
            showSnackbar(`${ids.length} închirieri șterse cu succes`, 'success');
        } catch (err) {
            console.error('Failed to delete rentals:', err);
            showSnackbar('Nu s-au putut șterge una sau mai multe închirieri. Unele ar putea fi active.', 'error');
        }
    };

    const handleUpdateRentalStatus = async (id: number, status: RentalExtended['status']) => {
        try {
            const updatedRental = await rentalsService.updateRentalStatus(id, status);
            setRentals(currentRentals =>
                currentRentals.map(rental =>
                    rental.id === id ? { ...rental, ...updatedRental } : rental
                )
            );
            const translatedStatus = STATUS_TRANSLATIONS[status] || status;
            showSnackbar(`Status-ul închirierii a fost actualizat la ${translatedStatus}`, 'success');
        } catch (err) {
            console.error('Failed to update rental status:', err);
            showSnackbar('Nu s-a putut actualiza status-ul închirierii', 'error');
        }
    };

    const handleUpdatePaymentStatus = async (id: number, paymentStatus: RentalExtended['payment_status']) => {
        try {
            const updatedRental = await rentalsService.updatePaymentStatus(id, paymentStatus);
            setRentals(currentRentals =>
                currentRentals.map(rental =>
                    rental.id === id ? updatedRental : rental
                )
            );
            showSnackbar(`Status-ul plății a fost actualizat la ${PAYMENT_TRANSLATIONS[paymentStatus]}`, 'success');
        } catch (err) {
            console.error('Failed to update payment status:', err);
            showSnackbar('Nu s-a putut actualiza status-ul plății', 'error');
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
        table.onResetPage();
        // Clear customer and car filters when changing tabs
        setCustomerId(null);
        setCustomer(null);
        setCarFilterId(null);
        setCarDetails(null);
        navigate('/rental'); // Navigate to base rental URL to clear query params implicitly or navigate(`/rental?tab=${newValue}`);
    };

    const handleGoBackToCustomers = () => navigate('/user');
    const handleClearCustomerFilter = () => navigate('/rental');
    const handleClearCarFilter = () => navigate('/rental');

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({ open: true, message, severity });
    };
    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const dynamicHeadLabel = [
        ...(carFilterId ? [] : [{ id: 'car', label: 'Mașină' }]),
        ...(customerId ? [] : [{ id: 'customer', label: 'Client' }]),
        { id: 'start_date', label: 'Data început' },
        { id: 'end_date', label: 'Data sfârșit' },
        { id: 'status', label: 'Status' },
        { id: 'payment_status', label: 'Plată' },
        { id: 'total_cost', label: 'Cost total', align: 'right' },
        { id: '' }, // Actions
    ];
    const colSpanForNoData = dynamicHeadLabel.length + 1; // +1 for checkbox

    return (
        <DashboardContent>
            <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h4" flexGrow={1}>
                    {customer
                        ? `Închirieri pentru ${customer.first_name} ${customer.last_name}`
                        : carDetails
                            ? `Închirieri pentru mașina ${carDetails.brand} ${carDetails.model} (${carDetails.license_plate})`
                            : 'Închirieri'}
                </Typography>

                {customer && (
                    <>
                        <Button variant="outlined" color="inherit" startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={handleGoBackToCustomers} sx={{ mr: 1 }}>
                            Înapoi la Clienți
                        </Button>
                        <Button variant="outlined" color="inherit" startIcon={<Iconify icon="eva:close-outline" />} onClick={handleClearCustomerFilter} sx={{ mr: 1 }}>
                            Toate Închirierile
                        </Button>
                    </>
                )}
                {carDetails && (
                    <Button variant="outlined" color="inherit" startIcon={<Iconify icon="eva:close-outline" />} onClick={handleClearCarFilter} sx={{ mr: 1 }}>
                        Toate Închirierile
                    </Button>
                )}

                <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setOpenRentalModal(true)}>
                    Închiriere Nouă
                </Button>
            </Box>

            {!customerId && !carFilterId && (
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }} textColor="primary" indicatorColor="primary">
                    <Tab value="all" label="Toate Închirierile" />
                    <Tab value="active" label="Active" />
                    <Tab value="pending" label="În Așteptare" />
                    <Tab value="completed" label="Finalizate" />
                    <Tab value="cancelled" label="Anulate" />
                    <Tab value="overdue" label="Depășite" />
                    <Tab value="upcoming" label="Viitoare" />
                </Tabs>
            )}

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {customer && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Se afișează închirierile pentru clientul: {customer.first_name} {customer.last_name} ({customer.email})
                </Alert>
            )}
            {carDetails && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Se afișează închirierile pentru mașina: {carDetails.brand} {carDetails.model} ({carDetails.license_plate})
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
                    rentals={rentals}
                />

                <RentalAddModal
                    open={openRentalModal}
                    onClose={() => setOpenRentalModal(false)}
                    onSuccess={fetchRentals}
                    customerId={customerId}
                    carId={carFilterId} // Pass carFilterId to preselect car if viewing rentals for a specific car
                />

                <Scrollbar>
                    <TableContainer sx={{ overflow: 'unset' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <RentalTableHead
                                order={table.order}
                                orderBy={table.orderBy}
                                rowCount={rentals.length} // Use rentals.length for total count for checkbox logic
                                numSelected={table.selected.length}
                                onSort={table.onSort}
                                onSelectAllRows={(checked) =>
                                    table.onSelectAllRows(
                                        checked,
                                        dataFiltered.map((rental) => rental.id.toString()) // Select all from filtered data
                                    )
                                }
                                headLabel={dynamicHeadLabel}
                            />
                            <TableBody>
                                {loading ? (
                                    <tr><td colSpan={colSpanForNoData} style={{ textAlign: 'center', padding: '20px 0' }}><CircularProgress /></td></tr>
                                ) : dataFiltered.length > 0 ? (
                                    dataFiltered
                                        .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
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
                                                hideCarColumn={!!carFilterId}
                                            />
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={colSpanForNoData} style={{ textAlign: 'center', padding: '40px 0' }}>
                                            {carFilterId ? (
                                                <><Typography variant="h6" sx={{ mb: 1 }}>Nu s-au găsit închirieri</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Această mașină nu are (încă) închirieri.</Typography></>
                                            ) : customerId ? (
                                                <><Typography variant="h6" sx={{ mb: 1 }}>Nu s-au găsit închirieri</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>Acest client nu are (încă) închirieri.</Typography></>
                                            ) : (
                                                <><Typography variant="h6" sx={{ mb: 1 }}>Nu s-au găsit închirieri</Typography><Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    {activeTab === 'all' ? 'Nu există încă închirieri în sistem.' : activeTab === 'overdue' ? 'Vești bune! Nu există închirieri depășite.' : `Nu s-au găsit închirieri ${STATUS_TRANSLATIONS[activeTab]?.toLowerCase() || activeTab}e.`}
                                                </Typography></>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                <TableEmptyRows height={68} emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)} />
                                {notFound && <TableNoData searchQuery={filterName} colSpan={colSpanForNoData} />}
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
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    onRowsPerPageChange={table.onChangeRowsPerPage}
                    labelRowsPerPage="Rânduri pe pagină:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} din ${count !== -1 ? count : `mai mult de ${to}`}`}
                />
            </Card>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardContent>
    );
}

export function useTable(defaultOrderBy = 'start_date', defaultOrder: 'asc' | 'desc' = 'desc') {
    const [page, setPage] = useState(0);
    const [orderBy, setOrderBy] = useState(defaultOrderBy);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selected, setSelected] = useState<string[]>([]);
    const [order, setOrder] = useState<'asc' | 'desc'>(defaultOrder);

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

    const onResetPage = useCallback(() => setPage(0), []);
    const onChangePage = useCallback((event: unknown, newPage: number) => setPage(newPage), []);
    const onChangeRowsPerPage = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            onResetPage();
        },
        [onResetPage]
    );

    return {
        page, order, onSort, orderBy, selected, rowsPerPage,
        onSelectRow, onResetPage, onChangePage, onSelectAllRows, onChangeRowsPerPage,
        setSelected // Expose setSelected for external manipulation if needed
    };
}