// src/sections/cars/group-stock-modal.tsx
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';

import { useRouter } from 'src/routes/hooks';
import { fCurrency } from 'src/utils/format-number';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import type { Car } from 'src/services/carsService'; // Import the Car type

// Define props for the modal
type GroupStockModalProps = {
    open: boolean;
    onClose: () => void;
    groupName: string; // e.g., "Toyota Camry (2022)"
    cars: Car[]; // Array of individual cars in the group
    onEditCar: (car: Car) => void; // Callback to open the edit dialog
};

export function GroupStockModal({
    open,
    onClose,
    groupName,
    cars = [], // Default to empty array
    onEditCar,
}: GroupStockModalProps) {
    const router = useRouter();

    const handleViewDetails = (carId: number) => {
        router.push(`/cars/${carId}`);
        onClose(); // Close modal after navigation
    };

    const handleEditClick = (car: Car) => {
        onEditCar(car); // Trigger the edit handler passed from parent
        // Keep the modal open while editing? Or close it? Let's close it for now.
        // onClose();
    };

    // Helper to get status label color
    const getStatusColor = (status?: 'available' | 'rented' | 'maintenance'): "success" | "error" | "warning" | "default" => {
        switch (status) {
            case 'available': return 'success';
            case 'rented': return 'error';
            case 'maintenance': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle>
                Stock Details: {groupName}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <Iconify icon="eva:close-fill" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {cars.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', py: 3 }}>
                        No individual cars found for this group.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'background.neutral' }}>
                                <TableRow>
                                    <TableCell>License Plate</TableCell>
                                    <TableCell>Color</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Daily Rate</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cars.map((car) => (
                                    <TableRow key={car.id} hover>
                                        <TableCell component="th" scope="row">
                                            {car.license_plate || '-'}
                                        </TableCell>
                                        <TableCell>{car.color || '-'}</TableCell>
                                        <TableCell>
                                            <Label color={getStatusColor(car.status)} variant="filled">
                                                {car.status || 'unknown'}
                                            </Label>
                                        </TableCell>
                                        <TableCell align="right">{fCurrency(car.daily_rate)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => handleViewDetails(car.id)}>
                                                        <Iconify icon="eva:eye-fill" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit Car">
                                                    <IconButton size="small" onClick={() => handleEditClick(car)}>
                                                        <Iconify icon="eva:edit-fill" />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* Add Delete button if needed */}
                                                {/* <Tooltip title="Delete Car">
                          <IconButton size="small" color="error">
                            <Iconify icon="eva:trash-2-outline" />
                          </IconButton>
                        </Tooltip> */}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}