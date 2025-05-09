// src/sections/cars/product-item.tsx
import { useState } from 'react';
import Box from '@mui/material/Box';
// import Link from '@mui/material/Link'; // Not used directly now
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// import { useRouter } from 'src/routes/hooks'; // Not used directly for group view

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ColorPreview } from 'src/components/color-utils';

// Interface for the grouped data passed within product prop
interface GroupedCarProductData {
  groupKey: string;
  brand: string;
  model: string;
  year: number;
  coverUrl: string;
  minPrice: number;
  maxPrice: number;
  colors: string[];
  totalCount: number;
  availableCount: number;
  rentedCount: number;
  maintenanceCount: number;
  pendingCount: number; // Add support for pending cars count
  representativeCarId: number;
  individualCars: any[]; // Use 'any' or import 'Car' type if needed here
}

// Update ProductItemProps to potentially include groupData
export type ProductItemProps = {
  id: string; // Can be car ID or groupKey
  name: string;
  price: number; // Represents minPrice for groups
  status: string; // Represents availability summary for groups
  coverUrl: string;
  colors: string[]; // Represents unique colors for groups
  priceSale: number | null; // Represents maxPrice for groups
  year?: number;
  groupData?: GroupedCarProductData; // Optional group data
};

// Add mode prop to differentiate rendering
type ProductItemComponentProps = {
  product: ProductItemProps;
  onClick?: () => void;
  mode?: 'group' | 'individual'; // Specify the mode
};

export function ProductItem({ product, onClick, mode = 'individual' }: ProductItemComponentProps) {
  // const router = useRouter(); // Keep if needed for individual view later
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click event
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // --- Actions depend on mode ---
  const handlePrimaryAction = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (onClick) {
      onClick(); // Trigger the action passed from parent (view group / edit car)
    }
    handleCloseMenu();
  };

  // --- Render Status Label ---
  // For groups, show total count or availability. For individuals, show actual status.
  const renderStatus = () => {
    let labelText;
    let labelColor: "info" | "success" | "warning" | "error" = 'info';

    if (mode === 'group' && product.groupData) {
      // For group mode, show total count
      labelText = `${product.groupData.totalCount} Total`;

      // Set color based on availability
      if (product.groupData.availableCount > 0) {
        labelColor = 'success';
      } else if (product.groupData.totalCount > 0) {
        labelColor = 'warning';
      }
    } else if (mode === 'individual') {
      // For individual cars, always show the actual status text (rented, pending, maintenance, etc.)
      labelText = product.status;

      // Set color based on status
      if (product.status === 'available') {
        labelColor = 'success';
      } else if (product.status === 'rented') {
        labelColor = 'error';
      } else if (product.status === 'maintenance') {
        labelColor = 'warning';
      } else if (product.status === 'pending') {
        // Add handling for "pending" status
        labelColor = 'info';
      } else {
        // Default for any other statuses
        labelColor = 'info';
      }
    }

    return (
      <Label
        variant="filled"
        color={labelColor}
        sx={{
          zIndex: 9,
          top: 16,
          right: 16,
          position: 'absolute',
          textTransform: 'uppercase',
        }}
      >
        {labelText}
      </Label>
    );
  };

  // --- Render Image (No change needed) ---
  const renderImg = (
    <Box
      component="img"
      alt={product.name}
      src={product.coverUrl}
      sx={{ top: 0, width: 1, height: 1, objectFit: 'cover', position: 'absolute' }}
    />
  );

  // --- Render Price ---
  // For groups, show range. For individuals, show single price.
  const renderPrice = () => {
    if (mode === 'group' && product.groupData && product.groupData.minPrice !== product.groupData.maxPrice) {
      return (
        <Typography variant="subtitle1">
          {fCurrency(product.groupData.minPrice)} - {fCurrency(product.groupData.maxPrice)}
        </Typography>
      );
    }
    // Show single price for individual cars or groups with only one price point
    return (
      <Typography variant="subtitle1">
        {fCurrency(product.price)}
      </Typography>
    );
  };

  // --- Render Availability Counts (for Group mode) ---
  const renderGroupCounts = () => {
    if (mode !== 'group' || !product.groupData) return null;

    return (
      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>
          {product.groupData.availableCount} Avail.
        </Typography>
        <Typography variant="caption" sx={{ color: 'error.main' }}>
          {product.groupData.rentedCount} Rented
        </Typography>
        <Typography variant="caption" sx={{ color: 'warning.main' }}>
          {product.groupData.maintenanceCount} Maint.
        </Typography>
        {/* Add Pending count to the display */}
        <Typography variant="caption" sx={{ color: 'info.main' }}>
          {product.groupData.pendingCount || 0} Pending
        </Typography>
      </Stack>
    );
  }

  return (
    <Card
      onClick={onClick} // Main card click action
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[10],
        } : {},
        position: 'relative', // For positioning menu button and label
        display: 'flex',
        flexDirection: 'column',
        height: '100%', // Ensure cards have same height
      }}
    >
      {/* Image Box */}
      <Box sx={{ pt: '75%', position: 'relative' }}> {/* Adjusted pt for aspect ratio */}
        {renderStatus()}
        {renderImg}
      </Box>

      {/* Content Box */}
      <Stack spacing={1} sx={{ p: 2, flexGrow: 1, justifyContent: 'space-between' }}> {/* Adjusted padding and spacing */}
        {/* Top section: Name, Year, Menu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}> {/* Allow name to take space */}
            <Typography variant="subtitle2" noWrap>
              {product.name}
            </Typography>
            {product.year && (
              <Typography variant="body2" color="text.secondary" noWrap>
                Year: {product.year}
              </Typography>
            )}
          </Box>

          {/* Menu Button */}
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{ flexShrink: 0, mt: -0.5, '&:hover': { backgroundColor: 'action.hover' } }}
          >
            <Iconify icon="eva:more-vertical-fill" width={20} height={20} />
          </IconButton>

          {/* Popover Menu */}
          <Popover
            open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 140, p: 0.5 } } }}
          >
            {/* Actions depend on mode */}
            {mode === 'group' && (
              <MenuItem onClick={handlePrimaryAction} dense>
                <Iconify icon="eva:list-fill" sx={{ mr: 1 }} />
                View Stock
              </MenuItem>
            )}
            {mode === 'individual' && (
              <>
                <MenuItem onClick={handlePrimaryAction} dense> {/* Assumes onClick handles edit for individual */}
                  <Iconify icon="eva:edit-fill" sx={{ mr: 1 }} />
                  Edit Car
                </MenuItem>
                {/* Add View Details for individual if needed */}
                {/* <MenuItem onClick={handleViewDetails} dense>
                    <Iconify icon="eva:eye-fill" sx={{ mr: 1 }} />
                    View Details
                 </MenuItem> */}
              </>
            )}
            {/* Add Delete action if applicable */}
            {/* <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }} dense>
              <Iconify icon="eva:trash-2-outline" sx={{ mr: 1 }} />
              Delete
            </MenuItem> */}
          </Popover>
        </Box>

        {/* Group Counts (only in group mode) */}
        {renderGroupCounts()}

        {/* Bottom section: Colors, Price */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <ColorPreview colors={product.colors} limit={4} /> {/* Show multiple colors */}
          {renderPrice()}
        </Box>
      </Stack>
    </Card>
  );
}