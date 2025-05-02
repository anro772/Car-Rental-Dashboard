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
import dayjs, { Dayjs } from 'dayjs';

import { DashboardContent } from 'src/layouts/dashboard';
import { fCurrency } from 'src/utils/format-number';
import { useRouter } from 'src/routes/hooks';

import carsService from 'src/services/carsService';
import rentalsService from 'src/services/rentalsService';
import customersService from 'src/services/customersService';
import { generateReport } from 'src/services/reportService';

import { Iconify } from 'src/components/iconify';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

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

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

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
    <DashboardContent maxWidth="xl">
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">
          Car Rental Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mdi:file-document-outline" />}
          onClick={handleOpenReportDialog}
          disabled={generatingReport}
        >
          {generatingReport ? 'Se generează...' : 'Obtinere Rapoarte Zilnice'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Fleet Overview */}
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Total Fleet"
            total={dashboardData.totalCars}
            percent={0}
            hiddenPercent={true} // Hide percent display
            color="info"
            icon={<img alt="icon" src="/assets/icons/navbar/ic-car.svg" />}
            chart={{
              series: [dashboardData.availableCars, dashboardData.rentedCars, dashboardData.maintenanceCars],
              categories: ['Available', 'Rented', 'Maintenance'],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Available Cars"
            total={dashboardData.availableCars}
            percent={0}
            hiddenPercent={true}
            color="success"
            icon={<img alt="icon" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              series: [dashboardData.availableCars],
              categories: ['Available'],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Rented Cars"
            total={dashboardData.rentedCars}
            percent={0}
            hiddenPercent={true}
            color="warning"
            icon={<img alt="icon" src="/assets/icons/navbar/ic-rental.svg" />}
            chart={{
              series: [dashboardData.rentedCars],
              categories: ['Rented'],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Maintenance"
            total={dashboardData.maintenanceCars}
            percent={0}
            hiddenPercent={true}
            color="error"
            icon={<img alt="icon" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              series: [dashboardData.maintenanceCars],
              categories: ['Maintenance'],
            }}
          />
        </Grid>

        {/* Fleet Utilization - Custom Card with Progress Bars */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader title="Fleet Utilization" />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Available</Typography>
                    <Typography variant="subtitle2">{dashboardData.fleetUtilization.available.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.available}
                    color="success"
                    sx={{ height: 10, borderRadius: 1 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Rented</Typography>
                    <Typography variant="subtitle2">{dashboardData.fleetUtilization.rented.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.rented}
                    color="warning"
                    sx={{ height: 10, borderRadius: 1 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">Maintenance</Typography>
                    <Typography variant="subtitle2">{dashboardData.fleetUtilization.maintenance.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dashboardData.fleetUtilization.maintenance}
                    color="error"
                    sx={{ height: 10, borderRadius: 1 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Rentals */}
        <Grid xs={12} md={6}>
          <Card>
            <CardHeader title="Overdue Rentals" />
            <CardContent>
              {dashboardData.overdueRentals === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No overdue rentals at this time.
                </Typography>
              ) : (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {dashboardData.overdueRentals} rental(s) are currently overdue.
                  </Alert>
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Iconify icon="eva:alert-triangle-fill" />}
                    onClick={handleViewOverdueRentals}
                  >
                    View Overdue Rentals
                  </Button>
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