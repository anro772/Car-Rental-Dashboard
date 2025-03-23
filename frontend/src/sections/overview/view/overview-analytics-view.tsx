import { useState, useEffect } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';

import { DashboardContent } from 'src/layouts/dashboard';
import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { useRouter } from 'src/routes/hooks';

import carsService, { Car } from 'src/services/carsService';
import rentalsService, { RentalExtended } from 'src/services/rentalsService';
import customersService from 'src/services/customersService';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// Define types for the dashboard data
interface DashboardData {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars: number;
  activeRentals: number;
  totalCustomers: number;
  overdueRentals: number;
  monthlyRevenue: number;
  revenueChangePercent: number;
  upcomingRentals: RentalExtended[];
  carsByCategory: { label: string; value: number }[];
  rentalStatusData: { label: string; value: number }[];
  revenueData: {
    categories: string[];
    series: { name: string; data: number[] }[];
  };
  fleetUtilization: {
    available: number;
    rented: number;
    maintenance: number;
  };
}

// Define the initial state
const initialDashboardData: DashboardData = {
  totalCars: 0,
  availableCars: 0,
  rentedCars: 0,
  maintenanceCars: 0,
  activeRentals: 0,
  totalCustomers: 0,
  overdueRentals: 0,
  monthlyRevenue: 0,
  revenueChangePercent: 0,
  upcomingRentals: [],
  carsByCategory: [],
  rentalStatusData: [],
  revenueData: {
    categories: [],
    series: []
  },
  fleetUtilization: {
    available: 0,
    rented: 0,
    maintenance: 0
  }
};

// Custom colors for car categories
const CATEGORY_COLORS = {
  'Sedan': '#1890FF',
  'SUV': '#FF4842',
  'Sports': '#00AB55',
  'Luxury': '#FFC107',
  'Hatchback': '#9C27B0', // Purple for Hatchback
  'Wagon': '#FF9800',     // Orange for Wagon
  'Others': '#607D8B'     // Grey for any other categories
};

export function OverviewAnalyticsView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch cars data
        const carsData = await carsService.getAllCars();
        const availableCars = carsData.filter(car => car.status === 'available').length;
        const rentedCars = carsData.filter(car => car.status === 'rented').length;
        const maintenanceCars = carsData.filter(car => car.status === 'maintenance').length;

        // Count cars by category
        const categoriesObj: Record<string, number> = {};
        carsData.forEach(car => {
          if (car.category) {
            categoriesObj[car.category] = (categoriesObj[car.category] || 0) + 1;
          }
        });

        const carsByCategory = Object.entries(categoriesObj).map(([label, value]) => ({
          label,
          value
        }));

        // Fetch rentals data
        const allRentals = await rentalsService.getAllRentals();

        // Get active rentals
        const activeRentals = allRentals.filter(r => r.status === 'active');

        const upcomingRentals = await rentalsService.getUpcomingRentals();
        const overdueRentals = await rentalsService.getOverdueRentals();

        // Count rentals by status
        const rentalsByStatus = {
          active: allRentals.filter(r => r.status === 'active').length,
          pending: allRentals.filter(r => r.status === 'pending').length,
          completed: allRentals.filter(r => r.status === 'completed').length,
          cancelled: allRentals.filter(r => r.status === 'cancelled').length
        };

        // Calculate revenue for each month over the last 6 months
        const monthlyRevenueData: number[] = [];
        const months: string[] = [];

        // Get date range for last 6 months
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        let currentMonthRevenue = 0;
        let previousMonthRevenue = 0;

        // For each of the last 6 months
        for (let i = 5; i >= 0; i--) {
          // Calculate the target month (go back i months from current)
          const targetMonth = (currentMonth - i + 12) % 12;
          const targetYear = currentYear - (currentMonth < i ? 1 : 0);

          // Get month name for the graph
          const monthName = new Date(2000, targetMonth).toLocaleString('default', { month: 'short' });
          months.push(monthName);

          // Calculate revenue for this month
          let monthRevenue = 0;
          allRentals
            .filter(r => {
              // Check if rental is completed or active
              const isValidStatus = r.status === 'completed' || r.status === 'active';

              // Check if rental started in the target month
              const rentalDate = new Date(r.start_date);
              const isTargetMonth = rentalDate.getMonth() === targetMonth &&
                rentalDate.getFullYear() === targetYear;

              return isValidStatus && isTargetMonth;
            })
            .forEach(rental => {
              // Ensure total_cost is a number
              const cost = typeof rental.total_cost === 'number'
                ? rental.total_cost
                : parseFloat(String(rental.total_cost)) || 0;

              // Round to 2 decimal places
              monthRevenue += Math.round(cost * 100) / 100;
            });

          // Add this month's revenue to data array
          monthlyRevenueData.push(monthRevenue);

          // Save current and previous month's revenue
          if (i === 0) {
            currentMonthRevenue = monthRevenue;
          } else if (i === 1) {
            previousMonthRevenue = monthRevenue;
          }
        }

        // Calculate revenue change percentage
        let revenueChangePercent = 0;
        if (previousMonthRevenue > 0) {
          revenueChangePercent = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
        }

        // Create revenue data object
        const revenueData = {
          categories: months,
          series: [
            {
              name: 'Revenue',
              data: monthlyRevenueData
            }
          ]
        };

        // Fetch customers data
        const customersData = await customersService.getAllCustomers();

        // Calculate fleet utilization percentages
        const totalCars = carsData.length;
        const fleetUtilization = {
          available: totalCars > 0 ? (availableCars / totalCars * 100) : 0,
          rented: totalCars > 0 ? (rentedCars / totalCars * 100) : 0,
          maintenance: totalCars > 0 ? (maintenanceCars / totalCars * 100) : 0
        };

        setDashboardData({
          totalCars: carsData.length,
          availableCars,
          rentedCars,
          maintenanceCars,
          activeRentals: activeRentals.length,
          totalCustomers: customersData.length,
          overdueRentals: overdueRentals.length,
          monthlyRevenue: currentMonthRevenue,
          revenueChangePercent,
          upcomingRentals: upcomingRentals.slice(0, 5),
          carsByCategory,
          rentalStatusData: [
            { label: 'Active', value: rentalsByStatus.active },
            { label: 'Pending', value: rentalsByStatus.pending },
            { label: 'Completed', value: rentalsByStatus.completed },
            { label: 'Cancelled', value: rentalsByStatus.cancelled }
          ],
          revenueData,
          fleetUtilization
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewOverdueRentals = () => {
    // Use the tab parameter to directly set the active tab to "overdue"
    router.push('/rental?tab=overdue');
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

  // Calculate percentages for widgets
  const availablePercent = dashboardData.totalCars > 0
    ? (dashboardData.availableCars / dashboardData.totalCars * 100)
    : 0;

  // Assign custom colors to each category
  const categoryColors = dashboardData.carsByCategory.map(category =>
    CATEGORY_COLORS[category.label as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Others
  );

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Car Rental Dashboard
      </Typography>

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
            percent={availablePercent}
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
            title="Active Rentals"
            total={dashboardData.activeRentals}
            percent={0}
            hiddenPercent={true} // Hide percent display
            color="warning"
            icon={<img alt="icon" src="/assets/icons/navbar/ic-rental.svg" />}
            chart={{
              series: [dashboardData.activeRentals],
              categories: ['Active'],
            }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Monthly Revenue"
            total={dashboardData.monthlyRevenue}
            percent={dashboardData.revenueChangePercent}
            color="primary"
            icon={<img alt="icon" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              series: [dashboardData.monthlyRevenue],
              categories: ['Revenue'],
            }}
          />
        </Grid>

        {/* Fleet Distribution by Category */}
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Fleet by Category"
            chart={{
              series: dashboardData.carsByCategory,
              colors: categoryColors, // Use custom colors for categories
            }}
          />
        </Grid>

        {/* Monthly Revenue Chart */}
        <Grid xs={12} md={6} lg={8}>
          <AnalyticsWebsiteVisits
            title="Monthly Revenue"
            subheader="Last 6 months"
            chart={dashboardData.revenueData}
            type="currency"
          />
        </Grid>

        {/* Rental Status Distribution */}
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Rental Status"
            chart={{
              series: dashboardData.rentalStatusData,
              colors: ['#00AB55', '#FFC107', '#1890FF', '#FF4842'],
            }}
          />
        </Grid>

        {/* Fleet Utilization - Custom Card with Progress Bars */}
        <Grid xs={12} md={6} lg={8}>
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

        {/* Upcoming Rentals Cards */}
        <Grid xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Upcoming Rentals" />
            <CardContent sx={{ p: 2 }}>
              {dashboardData.upcomingRentals.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}>
                  No upcoming rentals scheduled.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {dashboardData.upcomingRentals.map((rental, index) => (
                    <Box key={rental.id} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: `primary.${index % 5 + 1}00`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'primary.main'
                          }}
                        >
                          <Iconify icon="eva:car-fill" width={20} />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">
                            {rental.brand} {rental.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.customer_name || 'Customer'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                            {fDate(rental.start_date)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Rentals */}
        <Grid xs={12} md={6} lg={8}>
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
    </DashboardContent>
  );
}