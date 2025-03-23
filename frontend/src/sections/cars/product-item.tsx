import { useState } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ColorPreview } from 'src/components/color-utils';

// ----------------------------------------------------------------------

export type ProductItemProps = {
  id: string;
  name: string;
  price: number;
  status: string;
  coverUrl: string;
  colors: string[];
  priceSale: number | null;
  year?: number;
};

type ProductItemComponentProps = {
  product: ProductItemProps;
  onClick?: () => void;
};

export function ProductItem({ product, onClick }: ProductItemComponentProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click event
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleViewCar = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click event
    router.push(`/cars/${product.id}`);
    handleCloseMenu();
  };

  const handleEditCar = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card click event
    if (onClick) {
      onClick();
    }
    handleCloseMenu();
  };

  const renderStatus = (
    <Label
      variant="inverted"
      color={(product.status === 'sale' && 'error') || 'info'}
      sx={{
        zIndex: 9,
        top: 16,
        right: 16,
        position: 'absolute',
        textTransform: 'uppercase',
      }}
    >
      {product.status}
    </Label>
  );

  const renderImg = (
    <Box
      component="img"
      alt={product.name}
      src={product.coverUrl}
      sx={{
        top: 0,
        width: 1,
        height: 1,
        objectFit: 'cover',
        position: 'absolute',
      }}
    />
  );

  const renderPrice = (
    <Typography variant="subtitle1">
      <Typography
        component="span"
        variant="body1"
        sx={{
          color: 'text.disabled',
          textDecoration: 'line-through',
        }}
      >
        {product.priceSale && fCurrency(product.priceSale)}
      </Typography>
      &nbsp;
      {fCurrency(product.price)}
    </Typography>
  );

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[10],
        } : {},
        position: 'relative', // For positioning the menu button
      }}
    >
      <Box sx={{ pt: '100%', position: 'relative' }}>
        {product.status && renderStatus}
        {renderImg}
      </Box>

      <Stack spacing={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" noWrap>
              {product.name}
            </Typography>
            {product.year && (
              <Typography variant="body2" color="text.secondary">
                Year: {product.year}
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              ml: 1,
              mt: -0.5,
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Iconify icon="eva:more-vertical-fill" width={20} height={20} />
          </IconButton>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: { width: 140, p: 0.5 },
              },
            }}
          >
            <MenuItem onClick={handleViewCar} dense>
              <Iconify icon="eva:car-fill" sx={{ mr: 1 }} />
              View Car
            </MenuItem>

            <MenuItem onClick={handleEditCar} dense>
              <Iconify icon="eva:edit-fill" sx={{ mr: 1 }} />
              Edit Car
            </MenuItem>
          </Popover>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <ColorPreview colors={product.colors} />
          {renderPrice}
        </Box>
      </Stack>
    </Card>
  );
}