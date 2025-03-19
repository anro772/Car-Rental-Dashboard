import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';

import customersService, { Customer, UpdateCustomer } from 'src/services/customersService';

// ----------------------------------------------------------------------

type Props = {
  row: Customer;
  selected: boolean;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction;
  onUpdateSuccess?: (updatedCustomer: Customer) => void;
};

export function CustomerTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
  onUpdateSuccess
}: Props) {
  const { id, first_name, last_name, email, phone, address, driver_license, status } = row;

  const [open, setOpen] = useState<HTMLElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editCustomer, setEditCustomer] = useState<UpdateCustomer>({
    first_name,
    last_name,
    email,
    phone,
    address,
    driver_license,
    status
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
    handleCloseMenu();
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    // Reset form state
    setEditCustomer({
      first_name,
      last_name,
      email,
      phone,
      address,
      driver_license,
      status
    });
    setFormErrors({});
  };

  // Update the handleRentals function in your CustomerTableRow component:

  const handleRentals = () => {
    router.push(`/rental?customer=${id}`);
    handleCloseMenu();
  };

  // Separate handlers for different input types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditCustomer(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!editCustomer.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!editCustomer.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!editCustomer.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editCustomer.email)) {
      errors.email = 'Email is invalid';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCustomer = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const updatedCustomer = await customersService.updateCustomer(id, editCustomer);

      handleCloseEditDialog();

      // Notify parent component of successful update
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedCustomer);
      }
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      if (err.response?.data?.error?.includes('Email address already exists')) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Email address already exists'
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${first_name} ${last_name}`;

  // Get initials for the avatar
  const getInitials = () => {
    return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <TableRow
        hover
        selected={selected}
        data-customer-id={row.id.toString()}
      >
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar>{getInitials()}</Avatar>
            <Typography variant="subtitle2" noWrap>
              {fullName}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{email}</TableCell>

        <TableCell>{phone || '-'}</TableCell>

        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 240 }} noWrap>
            {address || '-'}
          </Typography>
        </TableCell>

        <TableCell>{driver_license || '-'}</TableCell>

        <TableCell>
          <Chip
            label={status || 'active'}
            color={status === 'active' ? 'success' : 'error'}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: status === 'active' ? 'rgba(84, 214, 44, 0.1)' : 'rgba(255, 72, 66, 0.1)'
            }}
          />
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Menu with Edit, Rentals, and Delete */}
      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 140 },
          },
        }}
      >
        <MenuItem onClick={handleOpenEditDialog}>
          <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem onClick={handleRentals}>
          <Iconify icon="mdi:car-key" sx={{ mr: 2 }} />
          Rentals
        </MenuItem>

        <MenuItem onClick={onDeleteRow} sx={{ color: 'error.main' }}>
          <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      {/* Edit Customer Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }} noValidate>
            <FormControl fullWidth error={!!formErrors.first_name} sx={{ mb: 2 }}>
              <TextField
                required
                name="first_name"
                label="First Name"
                value={editCustomer.first_name}
                onChange={handleInputChange}
                error={!!formErrors.first_name}
              />
              {formErrors.first_name && (
                <FormHelperText>{formErrors.first_name}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={!!formErrors.last_name} sx={{ mb: 2 }}>
              <TextField
                required
                name="last_name"
                label="Last Name"
                value={editCustomer.last_name}
                onChange={handleInputChange}
                error={!!formErrors.last_name}
              />
              {formErrors.last_name && (
                <FormHelperText>{formErrors.last_name}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={!!formErrors.email} sx={{ mb: 2 }}>
              <TextField
                required
                name="email"
                label="Email"
                type="email"
                value={editCustomer.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
              />
              {formErrors.email && (
                <FormHelperText>{formErrors.email}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="phone"
                label="Phone"
                value={editCustomer.phone}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="address"
                label="Address"
                multiline
                rows={2}
                value={editCustomer.address}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                name="driver_license"
                label="Driver License"
                value={editCustomer.driver_license}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={editCustomer.status as "active" | "inactive"}
                label="Status"
                onChange={handleSelectChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateCustomer}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}