import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  numSelected: number;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: () => void;
  onEmail?: () => void;
};

export function CustomerTableToolbar({
  numSelected,
  filterName,
  onFilterName,
  onDelete,
  onEmail
}: Props) {
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Delete">
            <Button
              color="error"
              variant="contained"
              startIcon={<Iconify icon="eva:trash-2-outline" />}
              onClick={onDelete}
            >
              Delete ({numSelected})
            </Button>
          </Tooltip>

          <Tooltip title="Send Email">
            <Button
              color="primary"
              variant="contained"
              startIcon={<Iconify icon="eva:email-outline" />}
              onClick={onEmail}
            >
              Email
            </Button>
          </Tooltip>
        </Stack>
      ) : (
        <OutlinedInput
          value={filterName}
          onChange={onFilterName}
          placeholder="Search customer..."
          startAdornment={
            <InputAdornment position="start">
              <Iconify
                icon="eva:search-fill"
                sx={{ color: 'text.disabled', width: 20, height: 20 }}
              />
            </InputAdornment>
          }
        />
      )}
    </Toolbar>
  );
}