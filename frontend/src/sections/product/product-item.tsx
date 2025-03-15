// Updated product-item.tsx
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
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
        } : {}
      }}
    >
      <Box sx={{ pt: '100%', position: 'relative' }}>
        {product.status && renderStatus}
        {renderImg}
      </Box>

      <Stack spacing={2} sx={{ p: 3 }}>
        <Box>
          <Link color="inherit" underline="hover" variant="subtitle2" noWrap>
            {product.name}
          </Link>
          {product.year && (
            <Typography variant="body2" color="text.secondary">
              Year: {product.year}
            </Typography>
          )}
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <ColorPreview colors={product.colors} />
          {renderPrice}
        </Box>
      </Stack>
    </Card>
  );
}