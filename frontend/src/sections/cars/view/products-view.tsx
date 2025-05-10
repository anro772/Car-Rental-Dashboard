// src/sections/cars/view/products-view.tsx
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
import toyotaCamryImage from 'src/assets/cars/toyota-camry.jpeg'; // Keep as fallback

import carsService, { Car } from 'src/services/carsService';
import rentalsService, { RentalExtended } from 'src/services/rentalsService';
import { ProductAdd } from '../product-add';
import { ProductItem, ProductItemProps } from '../product-item';
import { ProductSort } from '../product-sort';
import { ProductFilters } from '../product-filters';
import { ProductEdit } from '../product-edit';
import { GroupStockModal } from '../group-stock-modal'; // <-- Import the new modal

import type { FiltersProps } from '../product-filters';

// --- Helper function to get color hex ---
const getColorHex = (colorName: string | undefined): string => {
  const colorMap: Record<string, string> = {
    'Red': '#FF0000', 'Black': '#000000', 'White': '#FFFFFF',
    'Silver': '#C0C0C0', 'Blue': '#0000FF', 'Gray': '#808080',
    'Yellow': '#FFFF00', 'Green': '#008000',
  };
  if (!colorName) return '#808080'; // Default to Gray if undefined
  return colorMap[colorName.trim()] || '#808080'; // Default to Gray if not found
};

// --- Filter/Sort Options ---
const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Toate categoriile' }, { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' }, { value: 'Sports', label: 'Sport' },
  { value: 'Luxury', label: 'Lux' }, { value: 'Hatchback', label: 'Hatchback' },
  { value: 'Wagon', label: 'Wagon' },
];
const PRICE_OPTIONS = [
  { value: 'below', label: 'Sub 50 Lei pe zi' }, { value: 'between', label: 'Între 50 - 80 Lei pe zi' },
  { value: 'above', label: 'Peste 80 Lei pe zi' },
];
const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponibile' },
  { value: 'pending', label: 'În așteptare' }, // Added pending option
  { value: 'rented', label: 'Închiriate' },
  { value: 'maintenance', label: 'În mentenanță' },
];
const COLOR_OPTIONS = [
  '#FF0000', '#000000', '#FFFFFF', '#C0C0C0', '#0000FF',
  '#808080', '#FFFF00', '#008000',
];
const RATING_OPTIONS = ['up4Star', 'up3Star', 'up2Star', 'up1Star']; // Keep for filter props

const defaultFilters: FiltersProps = {
  price: '', gender: [], colors: [], rating: '', category: 'all',
};

// --- Interface for Grouped Car Data ---
interface GroupedCarProduct {
  groupKey: string; // e.g., "Toyota-Camry-2022"
  brand: string;
  model: string;
  year: number;
  coverUrl: string; // Representative image
  minPrice: number;
  maxPrice: number;
  colors: string[]; // Unique hex colors in the group
  totalCount: number;
  availableCount: number;
  rentedCount: number;
  pendingCount: number; // Count of cars with pending rentals
  maintenanceCount: number;
  representativeCarId: number; // ID of one car in the group
  individualCars: Car[]; // Store the original cars belonging to this group
}

// --- Grouping Function ---
const groupCars = (cars: Car[], pendingRentals: Record<number, boolean> = {}): GroupedCarProduct[] => {
  const groups: Record<string, GroupedCarProduct> = {};

  cars.forEach((car) => {
    const key = `${car.brand}-${car.model}-${car.year}`;
    if (!groups[key]) {
      groups[key] = {
        groupKey: key, brand: car.brand, model: car.model, year: car.year,
        coverUrl: car.image_url || toyotaCamryImage,
        minPrice: car.daily_rate, maxPrice: car.daily_rate,
        colors: [], totalCount: 0, availableCount: 0, rentedCount: 0,
        pendingCount: 0, // Initialize pending count
        maintenanceCount: 0,
        representativeCarId: car.id, individualCars: [],
      };
    }
    groups[key].totalCount += 1;
    groups[key].minPrice = Math.min(groups[key].minPrice, car.daily_rate);
    groups[key].maxPrice = Math.max(groups[key].maxPrice, car.daily_rate);
    groups[key].individualCars.push(car);

    // Check if this car has a pending rental
    const hasPendingRental = pendingRentals[car.id] || false;

    if (hasPendingRental) {
      // Car has a pending rental
      groups[key].pendingCount += 1;
    } else {
      // Normal car status counting
      switch (car.status) {
        case 'available': groups[key].availableCount += 1; break;
        case 'rented': groups[key].rentedCount += 1; break;
        case 'maintenance': groups[key].maintenanceCount += 1; break;
        default: break;
      }
    }
  });

  Object.values(groups).forEach(group => {
    const uniqueColors = new Set<string>();
    group.individualCars.forEach(c => { if (c.color) { uniqueColors.add(getColorHex(c.color)); } });
    group.colors = Array.from(uniqueColors);
    if (group.colors.length === 0) { group.colors.push('#808080'); }
  });

  return Object.values(groups);
};

// --- Main Component ---
export function ProductsView() {
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [pendingRentals, setPendingRentals] = useState<Record<number, boolean>>({});
  const [allRentals, setAllRentals] = useState<Record<number, RentalExtended>>({});
  const [groupedCars, setGroupedCars] = useState<GroupedCarProduct[]>([]);
  const [displayData, setDisplayData] = useState<GroupedCarProduct[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState<FiltersProps>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCarForEdit, setSelectedCarForEdit] = useState<Car | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false); // <-- State for stock modal
  const [selectedGroupForModal, setSelectedGroupForModal] = useState<GroupedCarProduct | null>(null); // <-- State for modal data

  // --- Fetch and Process Data ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch cars
      const rawData = await carsService.getAllCars();
      setAllCars(rawData);
      setFilteredCars(rawData); // Initialize filtered cars with all cars

      // Fetch all rentals to identify cars that are pending or active
      try {
        const pendingRentalsData = await rentalsService.getRentalsByStatus('pending');
        const activeRentalsData = await rentalsService.getRentalsByStatus('active');

        // Combine all rentals
        const allRentalsData = [...pendingRentalsData, ...activeRentalsData];

        // Create a map of car IDs that have pending rentals
        const pendingRentalsMap: Record<number, boolean> = {};
        const rentalsMap: Record<number, RentalExtended> = {};

        allRentalsData.forEach(rental => {
          // Store the rental by car ID
          rentalsMap[rental.car_id] = rental;

          // Mark cars with pending rentals
          if (rental.status === 'pending') {
            pendingRentalsMap[rental.car_id] = true;
          } else if (rental.status === 'active') {
            // Check if it's a future rental (active but start date in future)
            const startDate = new Date(rental.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);

            if (startDate > today) {
              pendingRentalsMap[rental.car_id] = true;
            }
          }
        });

        setPendingRentals(pendingRentalsMap);
        setAllRentals(rentalsMap);
      } catch (err) {
        console.error('Failed to fetch rentals:', err);
        // If we can't fetch rentals, continue with empty maps
        setPendingRentals({});
        setAllRentals({});
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch cars:', err);
      setError('Failed to load car fleet.');
      setAllCars([]);
      setFilteredCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filtered cars from the ProductFilters component
  const handleFilteredCars = useCallback((filtered: Car[]) => {
    setFilteredCars(filtered);
  }, []);

  // --- Apply Filters, Group, Sort, Paginate ---
  useEffect(() => {
    // Apply filters directly here instead of relying on external filtering
    const filteredRawCars = allCars.filter((car) => {
      // Category filter
      if (filters.category && filters.category !== 'all' && car.category !== filters.category) return false;

      // Price filter
      if (filters.price === 'below' && car.daily_rate >= 50) return false;
      if (filters.price === 'between' && (car.daily_rate < 50 || car.daily_rate > 80)) return false;
      if (filters.price === 'above' && car.daily_rate <= 80) return false;

      // Color filter
      if (filters.colors?.length) {
        const carColorHex = getColorHex(car.color);
        if (!filters.colors.includes(carColorHex)) return false;
      }

      // Status filter (with pending detection)
      if (filters.gender?.length) {
        const hasPendingRental = pendingRentals[car.id] || false;

        // Handle the special case for pending status
        if (hasPendingRental) {
          // If car has a pending rental, it should only be included when "pending" is selected
          if (!filters.gender.includes('pending')) return false;
        } else {
          // For normal statuses, check if the car's status is in the selected statuses
          if (!filters.gender.includes(car.status || 'available')) return false;
        }
      }

      return true;
    });

    // Group cars, passing the pending rentals information
    const currentGroupedCars = groupCars(filteredRawCars, pendingRentals);
    setGroupedCars(currentGroupedCars);

    const sortedGroups = [...currentGroupedCars].sort((a, b) => {
      switch (sortBy) {
        case 'nameAsc': return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        case 'nameDesc': return `${b.brand} ${b.model}`.localeCompare(`${a.brand} ${a.model}`);
        case 'priceAsc': return a.minPrice - b.minPrice;
        case 'priceDesc': return b.maxPrice - a.maxPrice;
        case 'countAsc': return a.totalCount - b.totalCount;
        case 'countDesc': return b.totalCount - a.totalCount;
        case 'featured': default: return b.availableCount - a.availableCount;
      }
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setDisplayData(sortedGroups.slice(indexOfFirstItem, indexOfLastItem));
  }, [allCars, filters, sortBy, currentPage, pendingRentals]);

  // --- Handlers ---
  const handleOpenFilter = useCallback(() => setOpenFilter(true), []);
  const handleCloseFilter = useCallback(() => setOpenFilter(false), []);
  const handleSort = useCallback((newSort: string) => { setSortBy(newSort); setCurrentPage(1); }, []);
  const handleSetFilters = useCallback((updateState: Partial<FiltersProps>) => { setFilters((prev) => ({ ...prev, ...updateState })); setCurrentPage(1); }, []);
  const handleResetFilters = useCallback(() => { setFilters(defaultFilters); setCurrentPage(1); }, []);
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => { setCurrentPage(page); };

  const handleDeleteCar = async (carId: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
      try {
        await carsService.deleteCar(carId);

        // Refresh the data after deletion
        await fetchData();

        // Show success message (you could add a snackbar/toast here)
        console.log('Car deleted successfully');

        // Close the modal if no cars left in the group
        if (selectedGroupForModal) {
          const deletedCar = selectedGroupForModal.individualCars.find(car => car.id === carId);
          const remainingCarsInGroup = selectedGroupForModal.individualCars.filter(car => car.id !== carId);

          if (remainingCarsInGroup.length === 0) {
            setStockModalOpen(false);
          } else {
            // Update the selected group data to reflect the deletion
            const hasPendingRental = pendingRentals[carId] || false;

            setSelectedGroupForModal({
              ...selectedGroupForModal,
              individualCars: remainingCarsInGroup,
              totalCount: selectedGroupForModal.totalCount - 1,
              // Update appropriate count based on status or pending rental
              availableCount: !hasPendingRental && deletedCar?.status === 'available'
                ? selectedGroupForModal.availableCount - 1
                : selectedGroupForModal.availableCount,
              rentedCount: !hasPendingRental && deletedCar?.status === 'rented'
                ? selectedGroupForModal.rentedCount - 1
                : selectedGroupForModal.rentedCount,
              pendingCount: hasPendingRental
                ? selectedGroupForModal.pendingCount - 1
                : selectedGroupForModal.pendingCount,
              maintenanceCount: !hasPendingRental && deletedCar?.status === 'maintenance'
                ? selectedGroupForModal.maintenanceCount - 1
                : selectedGroupForModal.maintenanceCount,
            });
          }
        }
      } catch (error: any) {
        // Handle errors, especially the case where a car has active rentals
        if (error.response?.status === 400 && error.response?.data?.error?.includes('active rentals')) {
          alert('Cannot delete this car because it has active rentals. Please complete or cancel the rentals first.');
        } else {
          console.error('Failed to delete car:', error);
          alert('Failed to delete car. Please try again later.');
        }
      }
    }
  };

  // --- Open Stock Modal ---
  const handleOpenStockModal = (group: GroupedCarProduct) => {
    setSelectedGroupForModal(group);
    setStockModalOpen(true);
  };

  // --- Open Edit Dialog (from Stock Modal or potentially elsewhere) ---
  const handleOpenEditDialog = (car: Car) => {
    setSelectedCarForEdit(car);
    setEditDialogOpen(true);
    setStockModalOpen(false); // Close stock modal when opening edit dialog
  };

  // --- Handle Car Update (after Add/Edit) ---
  const handleCarUpdated = async () => {
    await fetchData(); // Refresh the entire list
    setEditDialogOpen(false);
    setAddDialogOpen(false);
    // No need to close stock modal here as it's likely already closed
  };

  const canReset = Object.keys(filters).some(key => {
    const filterKey = key as keyof FiltersProps;
    if (Array.isArray(filters[filterKey])) return (filters[filterKey] as string[]).length > 0;
    return filters[filterKey] !== defaultFilters[filterKey];
  });

  // --- Transform Grouped Data for ProductItem with pending count included ---
  const groupedProductsForDisplay: (ProductItemProps & { groupData?: GroupedCarProduct })[] = displayData.map((group) => {
    // Create status text showing available and pending counts
    let statusText = '';
    if (group.availableCount > 0) {
      statusText += `${group.availableCount} Available`;
    }
    if (group.pendingCount > 0) {
      statusText += statusText ? `, ${group.pendingCount} Pending` : `${group.pendingCount} Pending`;
    }
    if (statusText === '') {
      statusText = 'Unavailable';
    }

    return {
      id: group.groupKey,
      name: `${group.brand} ${group.model}`,
      coverUrl: group.coverUrl,
      price: group.minPrice,
      priceSale: group.maxPrice,
      colors: group.colors,
      status: statusText,
      year: group.year,
      groupData: group,
    };
  });

  const pageCount = Math.ceil(groupedCars.length / itemsPerPage);

  return (
    <DashboardContent>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h4">Parc Automobile</Typography>
        <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => setAddDialogOpen(true)}>
          Adaugă o mașină
        </Button>
      </Box>

      {/* Filters and Sort */}
      <Box display="flex" alignItems="center" flexWrap="wrap-reverse" justifyContent="flex-end" sx={{ mb: 5 }}>
        <Box gap={1} display="flex" flexShrink={0} sx={{ my: 1 }}>
          <ProductFilters
            canReset={canReset} filters={filters} onSetFilters={handleSetFilters}
            openFilter={openFilter} onOpenFilter={handleOpenFilter} onCloseFilter={handleCloseFilter}
            onResetFilter={handleResetFilters}
            options={{ genders: STATUS_OPTIONS, categories: CATEGORY_OPTIONS, ratings: RATING_OPTIONS, price: PRICE_OPTIONS, colors: COLOR_OPTIONS }}
            // Pass rental data and cars for advanced filtering
            rentalsData={allRentals}
            allCars={allCars}
            onFilterCars={handleFilteredCars}
          />
          <ProductSort sortBy={sortBy} onSort={handleSort}
            options={[
              { value: 'featured', label: 'Prezentate (Disp.)' }, { value: 'nameAsc', label: 'Nume: A-Z' },
              { value: 'nameDesc', label: 'Nume: Z-A' }, { value: 'priceAsc', label: 'Preț: Mic-Mare' },
              { value: 'priceDesc', label: 'Preț: Mare-Mic' }, { value: 'countDesc', label: 'Stoc: Mare-Mic' },
              { value: 'countAsc', label: 'Stoc: Mic-Mare' },
            ]}
          />
        </Box>
      </Box>

      {/* Content Area */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          {/* Grid Display */}
          <Grid container spacing={3}>
            {groupedProductsForDisplay.map((product) => (
              <Grid key={product.id} xs={12} sm={6} md={4} lg={3}>
                <ProductItem
                  product={product}
                  // Clicking the card or "View Stock" opens the modal
                  onClick={() => product.groupData && handleOpenStockModal(product.groupData)}
                  mode="group"
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pageCount > 1 && (
            <Pagination
              count={pageCount} page={currentPage} onChange={handlePageChange}
              color="primary" sx={{ display: 'flex', justifyContent: 'center', mt: 8, mx: 'auto' }}
            />
          )}

          {/* No Results Message */}
          {!loading && !error && displayData.length === 0 && (
            <Box textAlign="center" my={5}>
              <Typography variant="h6">No car groups found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or adding more vehicles.
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* --- Modals and Dialogs --- */}

      {/* Stock Details Modal */}
      {selectedGroupForModal && (
        <GroupStockModal
          open={stockModalOpen}
          onClose={() => setStockModalOpen(false)}
          groupName={`${selectedGroupForModal.brand} ${selectedGroupForModal.model} (${selectedGroupForModal.year})`}
          cars={selectedGroupForModal.individualCars}
          onEditCar={handleOpenEditDialog} // Pass the handler to open edit dialog
          onDeleteCar={handleDeleteCar} // Add the new delete handler
          // Pass rental data to show pending status
          rentalData={allRentals}
        />
      )}
      {/* Edit Car Dialog */}
      {selectedCarForEdit && (
        <ProductEdit
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          carId={selectedCarForEdit.id}
          // Pass initial values from the selected car
          initialDailyRate={selectedCarForEdit.daily_rate}
          initialFeatures={selectedCarForEdit.features || ''}
          onSave={handleCarUpdated}
        />
      )}

      {/* Add Car Dialog */}
      <ProductAdd
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleCarUpdated}
      />
    </DashboardContent>
  );
}