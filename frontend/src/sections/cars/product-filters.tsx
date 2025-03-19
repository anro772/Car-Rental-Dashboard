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

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ColorPicker } from 'src/components/color-utils';

// ----------------------------------------------------------------------

export type FiltersProps = {
  price: string;
  rating: string;
  gender: string[];
  colors: string[];
  category: string;
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
};

export function ProductFilters({
  filters,
  options,
  canReset,
  openFilter,
  onSetFilters,
  onOpenFilter,
  onCloseFilter,
  onResetFilter,
}: ProductFiltersProps) {
  // Status filter (formerly Gender)
  const renderStatus = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Status</Typography>
      <FormGroup>
        {options.genders.map((option) => (
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
      <Typography variant="subtitle2">Category</Typography>
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
      <Typography variant="subtitle2">Colors</Typography>
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
      <Typography variant="subtitle2">Price</Typography>
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
        Filters
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