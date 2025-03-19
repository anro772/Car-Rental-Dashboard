// import { useState, useCallback, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { Helmet } from 'react-helmet-async';

// import Box from '@mui/material/Box';
// import Card from '@mui/material/Card';
// import Table from '@mui/material/Table';
// import Button from '@mui/material/Button';
// import TableBody from '@mui/material/TableBody';
// import Typography from '@mui/material/Typography';
// import TableContainer from '@mui/material/TableContainer';
// import TablePagination from '@mui/material/TablePagination';
// import CircularProgress from '@mui/material/CircularProgress';
// import Alert from '@mui/material/Alert';
// import Snackbar from '@mui/material/Snackbar';

// import { DashboardContent } from 'src/layouts/dashboard';
// import { CONFIG } from 'src/config-global';

// import { Iconify } from 'src/components/iconify';
// import { Scrollbar } from 'src/components/scrollbar';

// import { TableNoData } from 'src/sections/table-no-data';
// import { RentalTableRow } from 'src/sections/rental/rental-table-row';
// import { RentalTableHead } from 'src/sections/rental/rental-table-head';
// import { TableEmptyRows } from 'src/sections/table-empty-rows';
// import { emptyRows, applyFilter, getComparator } from 'src/sections/rental/utils';

// import rentalsService, { RentalExtended } from 'src/services/rentalsService';
// import customersService, { Customer } from 'src/services/customersService';

// // ----------------------------------------------------------------------

// export default function CustomerRentalsPage() {
//     const { customerId } = useParams<{ customerId: string }>();
//     const [rentals, setRentals] = useState<RentalExtended[]>([]);
//     const [customer, setCustomer] = useState<Customer | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [snackbar, setSnackbar] = useState({
//         open: false,
//         message: '',
//         severity: 'success' as 'success' | 'error' | 'info' | 'warning'
//     });

//     const table = useTable();

//     const [filterName, setFilterName] = useState('');

//     const dataFiltered = applyFilter({
//         inputData: rentals,
//         comparator: getComparator(table.order, table.orderBy),
//         filterName,
//     });

//     const notFound = !dataFiltered.length && !!filterName;

//     useEffect(() => {
//         if (!customerId) return;

//         const fetchData = async () => {
//             try {
//                 setLoading(true);

//                 // Fetch customer details
//                 const customerData = await customersService.getCustomer(Number(customerId));
//                 setCustomer(customerData);

//                 // Fetch customer rentals
//                 const rentalsData = await rentalsService.getRentalsForCustomer(Number(customerId));
//                 setRentals(rentalsData);

//                 setError('');
//             } catch (err) {
//                 console.error('Failed to fetch data:', err);
//                 setError('Failed to load customer rentals. Please try again later.');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchData();
//     }, [customerId]);

//     const handleDeleteRental = async (id: number) => {
//         try {
//             await rentalsService.deleteRental(id);
//             setRentals(rentals.filter(rental => rental.id !== id));
//             showSnackbar('Rental deleted successfully', 'success');
//         } catch (err) {
//             console.error('Failed to delete rental:', err);
//             showSnackbar('Failed to delete rental. It may be active.', 'error');
//         }
//     };

//     const handleUpdateRentalStatus = async (id: number, status: RentalExtended['status']) => {
//         try {
//             const updatedRental = await rentalsService.updateRentalStatus(id, status);
//             setRentals(rentals.map(rental =>
//                 rental.id === id ? updatedRental : rental
//             ));
//             showSnackbar(`Rental status updated to ${status}`, 'success');
//         } catch (err) {
//             console.error('Failed to update rental status:', err);
//             showSnackbar('Failed to update rental status', 'error');
//         }
//     };

//     const handleUpdatePaymentStatus = async (id: number, paymentStatus: RentalExtended['payment_status']) => {
//         try {
//             const updatedRental = await rentalsService.updatePaymentStatus(id, paymentStatus);
//             setRentals(rentals.map(rental =>
//                 rental.id === id ? updatedRental : rental
//             ));
//             showSnackbar(`Payment status updated to ${paymentStatus}`, 'success');
//         } catch (err) {
//             console.error('Failed to update payment status:', err);
//             showSnackbar('Failed to update payment status', 'error');
//         }
//     };

//     const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
//         setSnackbar({
//             open: true,
//             message,
//             severity
//         });
//     };

//     const handleCloseSnackbar = () => {
//         setSnackbar(prev => ({
//             ...prev,
//             open: false
//         }));
//     };

//     function useTable() {
//         const [page, setPage] = useState(0);
//         const [orderBy, setOrderBy] = useState('start_date');
//         const [rowsPerPage, setRowsPerPage] = useState(5);
//         const [selected, setSelected] = useState<string[]>([]);
//         const [order, setOrder] = useState<'asc' | 'desc'>('desc');

//         const onSort = useCallback(
//             (id: string) => {
//                 const isAsc = orderBy === id && order === 'asc';
//                 setOrder(isAsc ? 'desc' : 'asc');
//                 setOrderBy(id);
//             },
//             [order, orderBy]
//         );

//         const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
//             if (checked) {
//                 setSelected(newSelecteds);
//                 return;
//             }
//             setSelected([]);
//         }, []);

//         const onSelectRow = useCallback(
//             (inputValue: string) => {
//                 const newSelected = selected.includes(inputValue)
//                     ? selected.filter((value) => value !== inputValue)
//                     : [...selected, inputValue];

//                 setSelected(newSelected);
//             },
//             [selected]
//         );

//         const onResetPage = useCallback(() => {
//             setPage(0);
//         }, []);

//         const onChangePage = useCallback((event: unknown, newPage: number) => {
//             setPage(newPage);
//         }, []);

//         const onChangeRowsPerPage = useCallback(
//             (event: React.ChangeEvent<HTMLInputElement>) => {
//                 setRowsPerPage(parseInt(event.target.value, 10));
//                 onResetPage();
//             },
//             [onResetPage]
//         );

//         return {
//             page,
//             order,
//             onSort,
//             orderBy,
//             selected,
//             rowsPerPage,
//             onSelectRow,
//             onResetPage,
//             onChangePage,
//             onSelectAllRows,
//             onChangeRowsPerPage,
//         };
//     }

//     return (
//         <>
//             <Helmet>
//                 <title>{`Customer Rentals - ${CONFIG.appName}`}</title>
//             </Helmet>

//             <DashboardContent>
//                 <Box display="flex" alignItems="center" mb={3}>
//                     <Typography variant="h4" flexGrow={1}>
//                         {customer ? `Rentals for ${customer.first_name} ${customer.last_name}` : 'Customer Rentals'}
//                     </Typography>
//                     <Button
//                         variant="outlined"
//                         color="inherit"
//                         startIcon={<Iconify icon="eva:arrow-back-fill" />}
//                         onClick={() => window.history.back()}
//                         sx={{ mr: 1 }}
//                     >
//                         Back
//                     </Button>
//                     <Button
//                         variant="contained"
//                         color="inherit"
//                         startIcon={<Iconify icon="mingcute:add-line" />}
//                         href={customerId ? `/rental/new?customer=${customerId}` : '/rental/new'}
//                     >
//                         New Rental
//                     </Button>
//                 </Box>

//                 {error && (
//                     <Alert severity="error" sx={{ mb: 3 }}>
//                         {error}
//                     </Alert>
//                 )}

//                 <Card>
//                     <Scrollbar>
//                         <TableContainer sx={{ overflow: 'unset' }}>
//                             <Table sx={{ minWidth: 800 }}>
//                                 <RentalTableHead
//                                     order={table.order}
//                                     orderBy={table.orderBy}
//                                     rowCount={rentals.length}
//                                     numSelected={table.selected.length}
//                                     onSort={table.onSort}
//                                     onSelectAllRows={(checked) =>
//                                         table.onSelectAllRows(
//                                             checked,
//                                             rentals.map((rental) => rental.id.toString())
//                                         )
//                                     }
//                                     headLabel={[
//                                         { id: 'car', label: 'Car' },
//                                         { id: 'start_date', label: 'Start Date' },
//                                         { id: 'end_date', label: 'End Date' },
//                                         { id: 'status', label: 'Status' },
//                                         { id: 'payment_status', label: 'Payment' },
//                                         { id: 'total_cost', label: 'Total Cost', align: 'right' },
//                                         { id: '' },
//                                     ]}
//                                 />
//                                 <TableBody>
//                                     {loading ? (
//                                         <tr>
//                                             <td colSpan={7} style={{ textAlign: 'center', padding: '20px 0' }}>
//                                                 <CircularProgress />
//                                             </td>
//                                         </tr>
//                                     ) : (
//                                         dataFiltered
//                                             .slice(
//                                                 table.page * table.rowsPerPage,
//                                                 table.page * table.rowsPerPage + table.rowsPerPage
//                                             )
//                                             .map((row) => (
//                                                 <RentalTableRow
//                                                     key={row.id}
//                                                     row={row}
//                                                     selected={table.selected.includes(row.id.toString())}
//                                                     onSelectRow={() => table.onSelectRow(row.id.toString())}
//                                                     onDeleteRow={() => handleDeleteRental(row.id)}
//                                                     onUpdateStatus={(status) => handleUpdateRentalStatus(row.id, status)}
//                                                     onUpdatePayment={(status) => handleUpdatePaymentStatus(row.id, status)}
//                                                 />
//                                             ))
//                                     )}

//                                     <TableEmptyRows
//                                         height={68}
//                                         emptyRows={emptyRows(table.page, table.rowsPerPage, rentals.length)}
//                                     />

//                                     {!loading && rentals.length === 0 && !filterName && (
//                                         <tr>
//                                             <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0' }}>
//                                                 <Typography variant="h6" sx={{ mb: 1 }}>No rentals found</Typography>
//                                                 <Typography variant="body2" sx={{ color: 'text.secondary' }}>
//                                                     This customer doesn't have any rentals yet.
//                                                 </Typography>
//                                             </td>
//                                         </tr>
//                                     )}

//                                     {notFound && <TableNoData searchQuery={filterName} />}
//                                 </TableBody>
//                             </Table>
//                         </TableContainer>
//                     </Scrollbar>

//                     <TablePagination
//                         component="div"
//                         page={table.page}
//                         count={dataFiltered.length}
//                         rowsPerPage={table.rowsPerPage}
//                         onPageChange={table.onChangePage}
//                         rowsPerPageOptions={[5, 10, 25]}
//                         onRowsPerPageChange={table.onChangeRowsPerPage}
//                     />
//                 </Card>

//                 {/* Snackbar for notifications */}
//                 <Snackbar
//                     open={snackbar.open}
//                     autoHideDuration={6000}
//                     onClose={handleCloseSnackbar}
//                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
//                 >
//                     <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
//                         {snackbar.message}
//                     </Alert>
//                 </Snackbar>
//             </DashboardContent>
//         </>
//     );
// }