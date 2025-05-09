//src/user/user-table-row.tsx
import { useState, useRef, useEffect } from 'react';

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
import Paper from '@mui/material/Paper';
import FormControlLabel from '@mui/material/FormControlLabel';

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
  const { id, first_name, last_name, email, phone, address, driver_license, license_image_url, license_verified, status } = row;

  const [open, setOpen] = useState<HTMLElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editCustomer, setEditCustomer] = useState<UpdateCustomer>({
    first_name,
    last_name,
    email,
    phone,
    address,
    driver_license,
    license_image_url,
    license_verified,
    status
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Add state for license image preview and file input reference
  const [licenseImagePreview, setLicenseImagePreview] = useState<string | null>(license_image_url || null);
  const licenseFileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  // Initialize license image preview if available
  useEffect(() => {
    if (license_image_url) {
      setLicenseImagePreview(license_image_url);
    }
  }, [license_image_url]);

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
      license_image_url,
      license_verified,
      status
    });
    setLicenseImagePreview(license_image_url || null);
    setFormErrors({});
  };

  const handleRentals = () => {
    router.push(`/rental?customer=${id}`);
    handleCloseMenu();
  };

  // License image handlers
  const handleLicenseFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLicenseImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLicenseDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Create a new event to trigger the file input change handler
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    if (licenseFileInputRef.current) {
      licenseFileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      licenseFileInputRef.current.dispatchEvent(event);
    }
  };

  const handleLicenseBrowseClick = () => {
    licenseFileInputRef.current?.click();
  };

  // Add handler for quick license verification
  const handleLicenseVerification = async (verified: boolean) => {
    try {
      setLoading(true);
      const updatedCustomer = await customersService.updateLicenseVerification(id, verified);

      // Notify parent component of successful update
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedCustomer);
      }

      handleCloseMenu();
    } catch (error) {
      console.error('Failed to update license verification:', error);
    } finally {
      setLoading(false);
    }
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditCustomer(prev => ({
      ...prev,
      [name]: checked
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

  // Updated handleUpdateCustomer function
  const handleUpdateCustomer = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Upload license image if provided
      if (licenseFileInputRef.current?.files?.length) {
        const file = licenseFileInputRef.current.files[0];
        try {
          const filePath = await customersService.uploadLicenseImage(file, {
            firstName: editCustomer.first_name || '',
            lastName: editCustomer.last_name || '',
            licenseCode: editCustomer.driver_license || ''
          });

          // Update the editCustomer with the image path
          editCustomer.license_image_url = filePath;
        } catch (uploadError) {
          console.error('License image upload failed:', uploadError);
          // Continue with customer update even if image upload fails
        }
      }

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

        {/* License Status Cell */}
        <TableCell>
          {license_verified ? (
            <Chip
              label="Verified"
              color="success"
              size="small"
              icon={<Iconify icon="eva:checkmark-circle-fill" />}
            />
          ) : license_image_url ? (
            <Chip
              label="Unverified"
              color="warning"
              size="small"
              icon={<Iconify icon="eva:clock-fill" />}
            />
          ) : (
            <Chip
              label="No License"
              color="default"
              size="small"
              variant="outlined"
            />
          )}
        </TableCell>

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

      {/* Menu with Edit, Rentals, License Verification, and Delete */}
      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 180 },
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

        <MenuItem onClick={() => handleLicenseVerification(!license_verified)}>
          <Iconify icon={license_verified ? "eva:shield-fill" : "eva:shield-outline"} sx={{ mr: 2 }} />
          {license_verified ? 'Unverify License' : 'Verify License'}
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

            {/* License Image Upload */}
            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Driver's License Image</Typography>
            <Paper
              sx={{
                border: '2px dashed #ccc',
                p: 3,
                textAlign: 'center',
                mb: 2,
                cursor: 'pointer',
                height: licenseImagePreview ? 'auto' : 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
              }}
              onDragOver={handleLicenseDragOver}
              onDrop={handleLicenseDrop}
              onClick={handleLicenseBrowseClick}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseFileSelect}
                ref={licenseFileInputRef}
                style={{ display: 'none' }}
              />

              {licenseImagePreview ? (
                <>
                  <img
                    src={licenseImagePreview}
                    alt="License preview"
                    style={{ maxWidth: '100%', maxHeight: 200, marginBottom: 10 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Click to change image
                  </Typography>
                </>
              ) : (
                <>
                  <Iconify icon="eva:image-fill" width={48} height={48} color="#aaa" />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Drag & drop license image here or click to browse
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Supported formats: JPG, PNG, JPEG, GIF
                  </Typography>
                </>
              )}
            </Paper>

            {/* License Verification Checkbox */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="license_verified"
                    checked={!!editCustomer.license_verified}
                    onChange={handleCheckboxChange}
                  />
                }
                label="Verify License"
              />
              <FormHelperText>Check this box if you've verified the customer's license</FormHelperText>
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