import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useState, useEffect } from 'react';
import { Car } from 'src/services/carsService';
import { RentalExtended } from 'src/services/rentalsService';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ColorPicker } from 'src/components/color-utils';

// ----------------------------------------------------------------------

export type FiltersProps = {
  price: string;
  rating: string;
  gender: string[]; // Used for status filtering
  colors: string[];
  category: string;
  // New property to handle display status filtering
  displayStatus?: string[];
};

type ProductFiltersProps = {
  canReset: boolean;
  openFilter: boolean;
  filters: FiltersProps;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  onResetFilter: () => void;
  onSetFilters: (updateState: Partial<FiltersProps>) => void;
  options: {
    colors: string[];
    ratings: string[];
    categories: { value: string; label: string }[];
    genders: { value: string; label: string }[];
    price: { value: string; label: string }[];
  };
  // Optional props for rental-aware filtering
  rentalsData?: Record<number, RentalExtended>;
  allCars?: Car[];
  onFilterCars?: (cars: Car[]) => void;
};

// Default status options including pending
const defaultStatusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' }
];

export function ProductFilters({
  filters,
  options,
  canReset,
  openFilter,
  onSetFilters,
  onOpenFilter,
  onCloseFilter,
  onResetFilter,
  rentalsData,
  allCars,
  onFilterCars,
}: ProductFiltersProps) {
  // Ensure status options include pending (fallback to default if not provided)
  const statusOptions = options.genders.length > 0
    ? options.genders
    : defaultStatusOptions;

  // Keep track of which cars are pending based on rental data
  const [pendingCarIds, setPendingCarIds] = useState<Set<number>>(new Set());

  // When rental data changes, identify cars that should be displayed as pending
  useEffect(() => {
    if (!rentalsData || !allCars) return;

    const pendingIds = new Set<number>();

    // Go through all cars with rented status and check if they have pending rentals
    allCars.forEach(car => {
      if (car.status === 'rented' && car.id && rentalsData[car.id]) {
        const rental = rentalsData[car.id];

        // Check if the rental status is pending
        if (rental.status === 'pending') {
          pendingIds.add(car.id);
          return;
        }

        // Or check if it's a future rental (even if active)
        const startDate = new Date(rental.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        if (startDate > today) {
          pendingIds.add(car.id);
        }
      }
    });

    setPendingCarIds(pendingIds);
  }, [rentalsData, allCars]);

  // Helper function to check if a car should be included based on filters
  const shouldIncludeCar = (car: Car): boolean => {
    // Category filter
    if (filters.category && car.category !== filters.category) {
      return false;
    }

    // Color filter
    if (filters.colors.length > 0 && !filters.colors.includes(car.color || '')) {
      return false;
    }

    // Price filter
    if (filters.price) {
      const [min, max] = filters.price.split('-').map(Number);
      if (min && car.daily_rate < min) return false;
      if (max && car.daily_rate > max) return false;
    }

    // Status filter
    if (filters.gender.length > 0) {
      // Check if car should be displayed as pending
      if (car.id && pendingCarIds.has(car.id)) {
        return filters.gender.includes('pending');
      }

      // Otherwise use the actual status
      if (!filters.gender.includes(car.status || '')) {
        return false;
      }
    }

    return true;
  };

  // Apply filters when they change
  useEffect(() => {
    if (onFilterCars && allCars) {
      const filteredCars = allCars.filter(shouldIncludeCar);
      onFilterCars(filteredCars);
    }
  }, [filters, pendingCarIds, allCars, onFilterCars]);

  // Status filter (formerly Gender)
  const renderStatus = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Status</Typography>
      <FormGroup>
        {statusOptions.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={filters.gender.includes(option.value)}
                onChange={() => {
                  const checked = filters.gender.includes(option.value)
                    ? filters.gender.filter((value) => value !== option.value)
                    : [...filters.gender, option.value];

                  onSetFilters({ gender: checked });
                }}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
    </Stack>
  );

  // Category filter
  const renderCategory = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Categorii</Typography>
      <FormGroup>
        {options.categories.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={filters.category === option.value}
                onChange={() => {
                  // If already selected, clear the selection
                  const newCategory = filters.category === option.value ? '' : option.value;
                  onSetFilters({ category: newCategory });
                }}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
    </Stack>
  );

  // Color filter
  const renderColors = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Culori</Typography>
      <ColorPicker
        selected={filters.colors}
        onSelectColor={(colors) => onSetFilters({ colors: colors as string[] })}
        colors={options.colors}
        limit={6}
      />
    </Stack>
  );

  // Price filter with ability to unselect
  const renderPrice = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Preț</Typography>
      <FormGroup>
        {options.price.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={filters.price === option.value}
                onChange={() => {
                  // If already selected, clear the selection
                  const newPrice = filters.price === option.value ? '' : option.value;
                  onSetFilters({ price: newPrice });
                }}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
    </Stack>
  );

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        endIcon={
          <Badge color="error" variant="dot" invisible={!canReset}>
            <Iconify icon="ic:round-filter-list" />
          </Badge>
        }
        onClick={onOpenFilter}
      >
        Filtre
      </Button>

      <Drawer
        anchor="right"
        open={openFilter}
        onClose={onCloseFilter}
        PaperProps={{
          sx: { width: 280, overflow: 'hidden' },
        }}
      >
        <Box display="flex" alignItems="center" sx={{ pl: 2.5, pr: 1.5, py: 2 }}>
          <Typography variant="h6" flexGrow={1}>
            Filters
          </Typography>

          <IconButton onClick={onResetFilter}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:refresh-linear" />
            </Badge>
          </IconButton>

          <IconButton onClick={onCloseFilter}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>

        <Divider />

        <Scrollbar>
          <Stack spacing={3} sx={{ p: 3 }}>
            {renderStatus}
            {renderCategory}
            {renderColors}
            {renderPrice}
            {/* Rating section removed */}
          </Stack>
        </Scrollbar>
      </Drawer>
    </>
  );
}