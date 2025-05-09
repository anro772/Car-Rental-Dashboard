// src/sections/overview/view/overview-analytics-view.tsx
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { SelectChangeEvent } from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableFooter from '@mui/material/TableFooter';
import Chip from '@mui/material/Chip';
import dayjs, { Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import { DashboardContent } from 'src/layouts/dashboard';
import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { useRouter } from 'src/routes/hooks';

import carsService from 'src/services/carsService';
import rentalsService, { RentalExtended } from 'src/services/rentalsService';
import customersService, { Customer } from 'src/services/customersService';
import contractService from 'src/services/contractService';
import invoiceService from 'src/services/invoiceService';
import { generateReport } from 'src/services/reportService';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Define types for the dashboard data
interface DashboardData {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars: number;
  overdueRentals: number;
  fleetUtilization: {
    available: number;
    rented: number;
    maintenance: number;
  }
}

// Define the initial state
const initialDashboardData: DashboardData = {
  totalCars: 0,
  availableCars: 0,
  rentedCars: 0,
  maintenanceCars: 0,
  overdueRentals: 0,
  fleetUtilization: {
    available: 0,
    rented: 0,
    maintenance: 0
  }
};

// Report type options
type ReportType = 'daily' | 'monthly';

export function OverviewAnalyticsView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [reportType, setReportType] = useState<ReportType>('daily');

  // Data states
  const [allRentals, setAllRentals] = useState<RentalExtended[]>([]);
  const [contractRentals, setContractRentals] = useState<RentalExtended[]>([]);
  const [invoiceRentals, setInvoiceRentals] = useState<RentalExtended[]>([]);
  const [customers, setCustomers] = useState<{ [key: number]: Customer }>({});

  // Search state
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');

  // Pagination states
  const [contractPage, setContractPage] = useState(0);
  const [invoicePage, setInvoicePage] = useState(0);
  const [rowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch cars data
        const carsData = await carsService.getAllCars();
        const availableCars = carsData.filter(car => car.status === 'available').length;
        const rentedCars = carsData.filter(car => car.status === 'rented').length;
        const maintenanceCars = carsData.filter(car => car.status === 'maintenance').length;

        // Get overdue rentals count
        let overdueRentals = [];
        try {
          overdueRentals = await rentalsService.getOverdueRentals();
        } catch (error) {
          // If it's a 404, it means no overdue rentals (good thing!)
          overdueRentals = [];
        }

        // Calculate fleet utilization percentages
        const totalCars = carsData.length;
        const fleetUtilization = {
          available: totalCars > 0 ? (availableCars / totalCars * 100) : 0,
          rented: totalCars > 0 ? (rentedCars / totalCars * 100) : 0,
          maintenance: totalCars > 0 ? (maintenanceCars / totalCars * 100) : 0
        };

        setDashboardData({
          totalCars,
          availableCars,
          rentedCars,
          maintenanceCars,
          overdueRentals: overdueRentals.length,
          fleetUtilization
        });

        // Fetch all rentals
        const rentals = await rentalsService.getAllRentals();
        setAllRentals(rentals);

        // Separate rentals for contracts (active & pending)
        const contractRentals = rentals
          .filter(rental => rental.status === 'active' || rental.status === 'pending')
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        setContractRentals(contractRentals);

        // Separate rentals for invoices (completed)
        const invoiceRentals = rentals
          .filter(rental => rental.status === 'completed')
          .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
        setInvoiceRentals(invoiceRentals);

        // Fetch customers for the rentals
        const customerIds = new Set(rentals.map(r => r.customer_id));
        const customersMap: { [key: number]: Customer } = {};

        for (const id of customerIds) {
          try {
            const customer = await customersService.getCustomer(id);
            customersMap[id] = customer;
          } catch (err) {
            console.error(`Failed to fetch customer ${id}:`, err);
          }
        }

        setCustomers(customersMap);
        setError('');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewOverdueRentals = () => {
    // Use the tab parameter to directly set the active tab to "overdue"
    router.push('/rental?tab=overdue');
  };

  const handleOpenReportDialog = () => {
    setReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
  };

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
  };

  const handleReportTypeChange = (event: SelectChangeEvent) => {
    setReportType(event.target.value as ReportType);
  };

  const handleGenerateReport = async () => {
    if (!selectedDate) {
      setSnackbar({
        open: true,
        message: 'Vă rugăm să selectați o dată pentru raport.',
        severity: 'warning'
      });
      return;
    }

    try {
      setGeneratingReport(true);
      handleCloseReportDialog();

      // Format the date for the report filename
      const formattedDate = selectedDate.format('YYYY-MM-DD');

      // Generate report based on selected type and date
      const reportBlob = await generateReport(selectedDate.toDate(), reportType);

      // Create a download link for the generated PDF
      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `raport_${reportType === 'daily' ? 'zilnic' : 'lunar'}_${formattedDate}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      setSnackbar({
        open: true,
        message: `Raportul ${reportType === 'daily' ? 'zilnic' : 'lunar'} a fost generat cu succes!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
      setSnackbar({
        open: true,
        message: 'Nu s-a putut genera raportul. Încercați din nou mai târziu.',
        severity: 'error'
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleContractPageChange = (event: unknown, newPage: number) => {
    setContractPage(newPage);
  };

  const handleInvoicePageChange = (event: unknown, newPage: number) => {
    setInvoicePage(newPage);
  };

  const handleContractSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContractSearchTerm(event.target.value);
    setContractPage(0); // Reset to first page when search changes
  };

  const handleInvoiceSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceSearchTerm(event.target.value);
    setInvoicePage(0); // Reset to first page when search changes
  };

  const handleClearContractSearch = () => {
    setContractSearchTerm('');
    setContractPage(0);
  };

  const handleClearInvoiceSearch = () => {
    setInvoiceSearchTerm('');
    setInvoicePage(0);
  };

  const handleDownloadContract = async (rental: RentalExtended) => {
    try {
      const customer = customers[rental.customer_id];
      if (!customer) {
        throw new Error('Customer data not found');
      }

      await contractService.downloadContract(customer, rental);

      setSnackbar({
        open: true,
        message: 'Contractul a fost descărcat cu succes!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to download contract:', err);
      setSnackbar({
        open: true,
        message: 'Nu s-a putut descărca contractul. Încercați din nou mai târziu.',
        severity: 'error'
      });
    }
  };

  const handleDownloadInvoice = async (rental: RentalExtended) => {
    try {
      const customer = customers[rental.customer_id];
      if (!customer) {
        throw new Error('Customer data not found');
      }

      await invoiceService.downloadInvoice(customer, rental);

      setSnackbar({
        open: true,
        message: 'Factura a fost descărcată cu succes!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to download invoice:', err);
      setSnackbar({
        open: true,
        message: 'Nu s-a putut descărca factura. Încercați din nou mai târziu.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Filter contracts based on search term
  const filteredContracts = contractRentals.filter(rental => {
    if (!contractSearchTerm.trim()) return true;

    const searchTermLower = contractSearchTerm.toLowerCase();

    // Search in customer name
    const customer = customers[rental.customer_id];
    const customerName = customer
      ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
      : (rental.customer_name || '').toLowerCase();

    // Search in car details
    const carDetails = `${rental.brand} ${rental.model} ${rental.license_plate || ''}`.toLowerCase();

    return customerName.includes(searchTermLower) || carDetails.includes(searchTermLower);
  });

  // Filter invoices based on search term
  const filteredInvoices = invoiceRentals.filter(rental => {
    if (!invoiceSearchTerm.trim()) return true;

    const searchTermLower = invoiceSearchTerm.toLowerCase();

    // Search in customer name
    const customer = customers[rental.customer_id];
    const customerName = customer
      ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
      : (rental.customer_name || '').toLowerCase();

    // Search in car details
    const carDetails = `${rental.brand} ${rental.model} ${rental.license_plate || ''}`.toLowerCase();

    return customerName.includes(searchTermLower) || carDetails.includes(searchTermLower);
  });

  // Calculate displayed contracts based on pagination and filter
  const displayedContracts = filteredContracts.slice(
    contractPage * rowsPerPage,
    contractPage * rowsPerPage + rowsPerPage
  );

  // Calculate displayed invoices based on pagination and filter
  const displayedInvoices = filteredInvoices.slice(
    invoicePage * rowsPerPage,
    invoicePage * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          Car Rental Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mdi:file-document-outline" />}
          onClick={handleOpenReportDialog}
          disabled={generatingReport}
        >
          {generatingReport ? 'Se generează...' : 'Obținere Rapoarte Zilnice'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Fleet Utilization Section */}
        <Grid xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: '0 0 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardHeader
              title={<Typography variant="h6">Utilizare Flotă</Typography>}
              sx={{ pb: 0, pt: 2.5, px: 3 }}
            />
            <CardContent sx={{ pt: 2, px: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Disponibile</Typography>
                    <Typography variant="body2" fontWeight="500">{dashboardData.fleetUtilization.available.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.available}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'rgba(84, 214, 44, 0.16)',
                      '.MuiLinearProgress-bar': {
                        bgcolor: 'rgb(84, 214, 44)',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Închiriate</Typography>
                    <Typography variant="body2" fontWeight="500">{dashboardData.fleetUtilization.rented.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.rented}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'rgba(255, 171, 0, 0.16)',
                      '.MuiLinearProgress-bar': {
                        bgcolor: 'rgb(255, 171, 0)',
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">În Mentenanță</Typography>
                    <Typography variant="body2" fontWeight="500">{dashboardData.fleetUtilization.maintenance.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.maintenance}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'rgba(255, 86, 48, 0.16)',
                      '.MuiLinearProgress-bar': {
                        bgcolor: 'rgb(255, 86, 48)',
                      }
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Rentals Section */}
        <Grid xs={12} md={6}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: '0 0 10px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardHeader
              title={<Typography variant="h6">Închirieri Depășite</Typography>}
              sx={{ pb: 0, pt: 2.5, px: 3 }}
            />
            <CardContent sx={{ pt: 2, px: 3 }}>
              {dashboardData.overdueRentals === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Nu există închirieri depășite în acest moment.
                </Typography>
              ) : (
                <Box>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(255, 171, 0, 0.08)',
                    border: '1px solid rgba(255, 171, 0, 0.24)'
                  }}>
                    <Iconify icon="eva:alert-triangle-fill" color="warning.main" width={24} height={24} />
                    <Typography variant="body2" sx={{ ml: 1, color: 'warning.dark' }}>
                      {dashboardData.overdueRentals} închiriere(i) sunt în prezent depășite.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Iconify icon="eva:alert-triangle-fill" />}
                    onClick={handleViewOverdueRentals}
                  >
                    Vizualizare Închirieri Depășite
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contracts Section */}
        <Grid xs={12}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: '0 0 10px rgba(0,0,0,0.08)'
          }}>
            <CardHeader
              title={<Typography variant="h6">Contracte</Typography>}
              sx={{ pb: 1, pt: 2.5, px: 3 }}
            />
            <CardContent sx={{ pt: 1, px: 3, pb: 0 }}>
              {/* Search Box for Contracts */}
              <TextField
                fullWidth
                placeholder="Căutare după nume client, marcă, model sau număr de înmatriculare..."
                value={contractSearchTerm}
                onChange={handleContractSearchChange}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} height={20} />
                    </InputAdornment>
                  ),
                  endAdornment: contractSearchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearContractSearch} edge="end">
                        <Iconify icon="eva:close-fill" width={20} height={20} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
            <CardContent sx={{ pt: 0, px: 0 }}>
              {filteredContracts.length === 0 ? (
                <Typography variant="body2" sx={{ px: 3, color: 'text.secondary', py: 2 }}>
                  {contractRentals.length === 0
                    ? "Nu există contracte de afișat."
                    : "Nu s-au găsit contracte care să corespundă căutării."}
                </Typography>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'background.neutral' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Numele Clientului</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Mașină</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Nr. Înmatriculare</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Dată început</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Dată sfârșit</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Valoare</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5, pr: 3 }}>Acțiuni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedContracts.map((rental) => {
                          const customer = customers[rental.customer_id];
                          const customerName = customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : rental.customer_name || 'Client necunoscut';

                          return (
                            <TableRow key={rental.id} hover>
                              <TableCell sx={{ pl: 3 }}>{customerName}</TableCell>
                              <TableCell>{`${rental.brand} ${rental.model}`}</TableCell>
                              <TableCell>{rental.license_plate}</TableCell>
                              <TableCell>{fDate(rental.start_date)}</TableCell>
                              <TableCell>{fDate(rental.end_date)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={rental.status}
                                  color={rental.status === 'active' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{fCurrency(rental.total_cost)}</TableCell>
                              <TableCell sx={{ pr: 3 }}>
                                <Button
                                  size="small"
                                  startIcon={<Iconify icon="mdi:file-document-outline" width={16} />}
                                  onClick={() => handleDownloadContract(rental)}
                                >
                                  Contract
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredContracts.length}
                    page={contractPage}
                    onPageChange={handleContractPageChange}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10]}
                    sx={{ px: 3 }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Invoices Section */}
        <Grid xs={12}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: '0 0 10px rgba(0,0,0,0.08)'
          }}>
            <CardHeader
              title={<Typography variant="h6">Facturi</Typography>}
              sx={{ pb: 1, pt: 2.5, px: 3 }}
            />
            <CardContent sx={{ pt: 1, px: 3, pb: 0 }}>
              {/* Search Box for Invoices */}
              <TextField
                fullWidth
                placeholder="Căutare după nume client, marcă, model sau număr de înmatriculare..."
                value={invoiceSearchTerm}
                onChange={handleInvoiceSearchChange}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} height={20} />
                    </InputAdornment>
                  ),
                  endAdornment: invoiceSearchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearInvoiceSearch} edge="end">
                        <Iconify icon="eva:close-fill" width={20} height={20} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </CardContent>
            <CardContent sx={{ pt: 0, px: 0 }}>
              {filteredInvoices.length === 0 ? (
                <Typography variant="body2" sx={{ px: 3, color: 'text.secondary', py: 2 }}>
                  {invoiceRentals.length === 0
                    ? "Nu există facturi de afișat."
                    : "Nu s-au găsit facturi care să corespundă căutării."}
                </Typography>
              ) : (
                <>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'background.neutral' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, py: 1.5, pl: 3 }}>Numele Clientului</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Mașină</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Nr. Înmatriculare</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Dată început</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Dată sfârșit</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Plată</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Valoare</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5, pr: 3 }}>Acțiuni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedInvoices.map((rental) => {
                          const customer = customers[rental.customer_id];
                          const customerName = customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : rental.customer_name || 'Client necunoscut';

                          return (
                            <TableRow key={rental.id} hover>
                              <TableCell sx={{ pl: 3 }}>{customerName}</TableCell>
                              <TableCell>{`${rental.brand} ${rental.model}`}</TableCell>
                              <TableCell>{rental.license_plate}</TableCell>
                              <TableCell>{fDate(rental.start_date)}</TableCell>
                              <TableCell>{fDate(rental.end_date)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={rental.payment_status}
                                  color={rental.payment_status === 'paid' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{fCurrency(rental.total_cost)}</TableCell>
                              <TableCell sx={{ pr: 3 }}>
                                <Button
                                  size="small"
                                  startIcon={<Iconify icon="mdi:receipt" width={16} />}
                                  onClick={() => handleDownloadInvoice(rental)}
                                >
                                  Factură
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredInvoices.length}
                    page={invoicePage}
                    onPageChange={handleInvoicePageChange}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10]}
                    sx={{ px: 3 }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Generation Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generare Raport</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="report-type-label">Tip Raport</InputLabel>
              <Select
                labelId="report-type-label"
                id="report-type"
                value={reportType}
                label="Tip Raport"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="daily">Raport Zilnic</MenuItem>
                <MenuItem value="monthly">Raport Lunar</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>
              Selectați Data {reportType === 'monthly' ? 'Lunii' : 'Zilei'}:
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {reportType === 'monthly' ? (
                <DatePicker
                  label="Selectați Luna"
                  value={selectedDate}
                  onChange={handleDateChange}
                  views={['year', 'month']}
                  sx={{ width: '100%' }}
                />
              ) : (
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDateChange}
                />
              )}
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Anulare</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={!selectedDate}
          >
            Generează Raport
          </Button>
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