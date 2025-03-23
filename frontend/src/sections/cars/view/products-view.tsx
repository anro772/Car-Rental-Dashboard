//src/sections/cars/view/products-view.tsx
import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

import { DashboardContent } from 'src/layouts/dashboard';
import toyotaCamryImage from 'src/assets/cars/toyota-camry.jpeg';

import carsService, { Car } from 'src/services/carsService';
import { ProductAdd } from '../product-add';
import { ProductItem } from '../product-item';
import { ProductSort } from '../product-sort';
// } from '../product-cart-widget';
import { ProductFilters } from '../product-filters';
import { ProductEdit } from '../product-edit';

import type { FiltersProps } from '../product-filters';

// ----------------------------------------------------------------------

// Adapt category options to car categories
const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Luxury', label: 'Luxury' },
  { value: 'Hatchback', label: 'Hatchback' },
  { value: 'Wagon', label: 'Wagon' },
];

// Adapt price options to daily rates
const PRICE_OPTIONS = [
  { value: 'below', label: 'Below $50/day' },
  { value: 'between', label: 'Between $50 - $80/day' },
  { value: 'above', label: 'Above $80/day' },
];

// Status options (renamed from GENDER_OPTIONS)
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' },
];

// Color options for cars
const COLOR_OPTIONS = [
  '#FF0000', // Red
  '#000000', // Black
  '#FFFFFF', // White
  '#C0C0C0', // Silver
  '#0000FF', // Blue
  '#808080', // Gray
  '#FFFF00', // Yellow
  '#008000', // Green
];

// Helper function to map color names to hex codes
const getColorHex = (colorName: string | undefined): string => {
  const colorMap: Record<string, string> = {
    'Red': '#FF0000',
    'Black': '#000000',
    'White': '#FFFFFF',
    'Silver': '#C0C0C0',
    'Blue': '#0000FF',
    'Gray': '#808080',
    'Yellow': '#FFFF00',
    'Green': '#008000',
  };

  if (!colorName) return '#000000';
  return colorMap[colorName] || '#000000';
};

// Keep the rating options for compatibility with filter props
const RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star'];

// Default filters with all options selected
const defaultFilters = {
  price: '',
  gender: STATUS_OPTIONS.map(option => option.value), // All statuses selected
  colors: COLOR_OPTIONS, // All colors selected
  rating: RATING_OPTIONS[0], // Needed for props type
  category: CATEGORY_OPTIONS[0].value,
};

export function ProductsView() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState<FiltersProps>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 8;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch cars from the backend
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const data = await carsService.getAllCars();
        setCars(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch cars:', err);
        setError('No cars loaded');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleOpenFilter = useCallback(() => {
    setOpenFilter(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setOpenFilter(false);
  }, []);

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
  }, []);

  const handleSetFilters = useCallback((updateState: Partial<FiltersProps>) => {
    setFilters((prevValue) => ({ ...prevValue, ...updateState }));
  }, []);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const canReset = Object.keys(filters).some(
    (key) => filters[key as keyof FiltersProps] !== defaultFilters[key as keyof FiltersProps]
  );

  // Add these handler functions inside the ProductsView component
  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setEditDialogOpen(true);
  };

  const handleCarUpdated = async () => {
    // Refresh the car list after update
    try {
      const data = await carsService.getAllCars();
      setCars(data);
    } catch (err) {
      console.error('Failed to refresh cars:', err);
    }
  };

  // Filter and sort cars
  const filteredCars = cars.filter((car) => {
    // Filter by category - only if a category is selected and not 'all'
    if (filters.category && filters.category !== 'all' && car.category !== filters.category) {
      return false;
    }

    // Filter by price range
    if (filters.price === 'below' && car.daily_rate >= 50) return false;
    if (filters.price === 'between' && (car.daily_rate < 50 || car.daily_rate > 80)) return false;
    if (filters.price === 'above' && car.daily_rate <= 80) return false;

    // Filter by status (using gender prop for backwards compatibility)
    if (filters.gender?.length && !filters.gender.includes(car.status || 'available')) {
      return false;
    }

    // Filter by color
    if (filters.colors?.length) {
      const carColorHex = getColorHex(car.color);
      if (!filters.colors.includes(carColorHex)) {
        return false;
      }
    }

    return true;
  });

  // Sort cars
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    }
    if (sortBy === 'priceAsc') {
      return a.daily_rate - b.daily_rate;
    }
    if (sortBy === 'priceDesc') {
      return b.daily_rate - a.daily_rate;
    }
    // Default 'featured' sorting - could be based on popularity or another metric
    return 0;
  });

  // Paginate
  const indexOfLastCar = currentPage * carsPerPage;
  const indexOfFirstCar = indexOfLastCar - carsPerPage;
  const currentCars = sortedCars.slice(indexOfFirstCar, indexOfLastCar);
  const pageCount = Math.ceil(sortedCars.length / carsPerPage);

  // Convert cars to the product format expected by ProductItem
  const carsAsProducts = currentCars.map((car) => ({
    id: car.id.toString(),
    name: `${car.brand} ${car.model}`,
    coverUrl: car.image_url || toyotaCamryImage,
    price: car.daily_rate,
    colors: [getColorHex(car.color)], // Convert color name to hex
    status: car.status || 'available',
    priceSale: null,
    year: car.year, // Add the year
  }));

  return (
    <DashboardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h4">Car Fleet</Typography>

        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />} // Use Iconify instead of AddIcon
          onClick={() => setAddDialogOpen(true)}
        >
          Add New Car
        </Button>
      </Box>


      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap-reverse"
        justifyContent="flex-end"
        sx={{ mb: 5 }}
      >
        <Box gap={1} display="flex" flexShrink={0} sx={{ my: 1 }}>
          <ProductFilters
            canReset={canReset}
            filters={filters}
            onSetFilters={handleSetFilters}
            openFilter={openFilter}
            onOpenFilter={handleOpenFilter}
            onCloseFilter={handleCloseFilter}
            onResetFilter={() => setFilters(defaultFilters)}
            options={{
              genders: STATUS_OPTIONS, // Renamed to STATUS_OPTIONS but keep 'genders' prop name
              categories: CATEGORY_OPTIONS,
              ratings: RATING_OPTIONS, // Keep for props compatibility
              price: PRICE_OPTIONS,
              colors: COLOR_OPTIONS,
            }}
          />

          <ProductSort
            sortBy={sortBy}
            onSort={handleSort}
            options={[
              { value: 'featured', label: 'Featured' },
              { value: 'newest', label: 'Newest' },
              { value: 'priceDesc', label: 'Daily Rate: High-Low' },
              { value: 'priceAsc', label: 'Daily Rate: Low-High' },
            ]}
          />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {carsAsProducts.map((car) => {
              // Find the original car data
              const originalCar = currentCars.find(c => c.id.toString() === car.id);

              return (
                <Grid key={car.id} xs={12} sm={6} md={3}>
                  <ProductItem
                    product={car}
                    onClick={() => originalCar && handleEditCar(originalCar)}
                  />
                </Grid>
              );
            })}
          </Grid>

          {pageCount > 1 && (
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              sx={{ mt: 8, mx: 'auto' }}
            />
          )}
        </>
      )}

      {!loading && !error && filteredCars.length === 0 && (
        <Box textAlign="center" my={5}>
          <Typography variant="h6">No cars found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try changing your filters or check back later for new vehicles.
          </Typography>
        </Box>
      )}

      {/* Add this section for the edit dialog */}
      {selectedCar && (
        <ProductEdit
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          carId={selectedCar.id}
          initialDailyRate={selectedCar.daily_rate}
          initialFeatures={selectedCar.features || ''}
          onSave={handleCarUpdated}
        />
      )}
      <ProductAdd
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleCarUpdated} // Reuse the same handler you use for editing
      />
    </DashboardContent>
  );
}