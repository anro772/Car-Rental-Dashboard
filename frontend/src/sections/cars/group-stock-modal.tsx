// src/sections/cars/group-stock-modal.tsx
import { useState, useEffect } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';
import { fCurrency } from 'src/utils/format-number';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import type { Car } from 'src/services/carsService'; // Import the Car type
import rentalsService, { RentalExtended } from 'src/services/rentalsService'; // Import rentals service

// Define props for the modal
type GroupStockModalProps = {
    open: boolean;
    onClose: () => void;
    groupName: string;
    cars: Car[];
    onEditCar: (car: Car) => void;
    onDeleteCar?: (carId: number) => Promise<void>;
    // Optional prop to pass rental data if already available
    rentalData?: Record<number, RentalExtended>;
};

export function GroupStockModal({
    open,
    onClose,
    groupName,
    cars = [], // Default to empty array
    onEditCar,
    onDeleteCar,
    rentalData,
}: GroupStockModalProps) {
    const router = useRouter();
    const [deletingCarId, setDeletingCarId] = useState<number | null>(null);
    const [carsRentalData, setCarsRentalData] = useState<Record<number, RentalExtended>>({});
    const [loading, setLoading] = useState(false);

    // Fetch rental information for cars when the modal opens
    useEffect(() => {
        async function fetchRentalData() {
            if (!open || rentalData) return; // Skip if modal not open or data already provided

            setLoading(true);
            const rentalInfo: Record<number, RentalExtended> = {};

            try {
                // Fetch active and pending rentals
                const activeRentals = await rentalsService.getRentalsByStatus('active');
                const pendingRentals = await rentalsService.getRentalsByStatus('pending');

                // Combine all rentals
                const allRentals = [...activeRentals, ...pendingRentals];

                // Create lookup by car_id
                allRentals.forEach(rental => {
                    rentalInfo[rental.car_id] = rental;
                });

                setCarsRentalData(rentalInfo);
            } catch (error) {
                console.error('Failed to fetch rental data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchRentalData();
    }, [open, rentalData]);

    // Use provided rental data or the fetched data
    const rentalInfoData = rentalData || carsRentalData;

    const handleViewDetails = (carId: number) => {
        router.push(`/cars/${carId}`);
        onClose(); // Close modal after navigation
    };

    const handleEditClick = (car: Car) => {
        onEditCar(car); // Trigger the edit handler passed from parent
    };

    const handleDeleteClick = async (carId: number) => {
        if (onDeleteCar) {
            setDeletingCarId(carId);
            try {
                await onDeleteCar(carId);
            } finally {
                setDeletingCarId(null);
            }
        }
    };

    // Helper to determine the displayed status based on database status and rental info
    const getDisplayStatus = (car: Car): { status: string; color: "success" | "error" | "warning" | "default" } => {
        // If car isn't rented, use the actual status
        if (car.status !== 'rented') {
            return {
                status: car.status || 'unknown',
                color: getStatusColor(car.status)
            };
        }

        // If car is rented, check if there's rental info to determine if it's pending
        const rental = rentalInfoData[car.id];
        if (rental) {
            // If rental status is pending, display as pending
            if (rental.status === 'pending') {
                return {
                    status: 'pending',
                    color: 'warning'
                };
            }

            // Check if rental is future-dated (even if active)
            const startDate = new Date(rental.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);

            if (startDate > today) {
                return {
                    status: 'pending',
                    color: 'warning'
                };
            }
        }

        // Default: just show as rented
        return {
            status: 'rented',
            color: 'error'
        };
    };

    // Helper to get status color (used for non-rented cars)
    const getStatusColor = (status?: 'available' | 'rented' | 'maintenance' | 'pending'): "success" | "error" | "warning" | "default" => {
        switch (status) {
            case 'available': return 'success';
            case 'rented': return 'error';
            case 'maintenance': return 'warning';
            case 'pending': return 'warning';
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
                    <>
                        {loading && (
                            <Box display="flex" justifyContent="center" my={2}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    Loading rental data...
                                </Typography>
                            </Box>
                        )}

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
                                    {cars.map((car) => {
                                        const displayStatus = getDisplayStatus(car);

                                        return (
                                            <TableRow key={car.id} hover>
                                                <TableCell component="th" scope="row">
                                                    {car.license_plate || '-'}
                                                </TableCell>
                                                <TableCell>{car.color || '-'}</TableCell>
                                                <TableCell>
                                                    <Label color={displayStatus.color} variant="filled">
                                                        {displayStatus.status}
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
                                                        {/* Delete button - only show if onDeleteCar prop is provided and car is not rented or pending */}
                                                        {onDeleteCar && (
                                                            <Tooltip title={
                                                                displayStatus.status === 'rented' ? "Can't delete rented cars" :
                                                                    displayStatus.status === 'pending' ? "Can't delete pending cars" :
                                                                        "Delete Car"
                                                            }>
                                                                <span> {/* Wrapper to maintain tooltip when button is disabled */}
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteClick(car.id)}
                                                                        disabled={
                                                                            displayStatus.status === 'rented' ||
                                                                            displayStatus.status === 'pending' ||
                                                                            deletingCarId === car.id
                                                                        }
                                                                    >
                                                                        {deletingCarId === car.id ? (
                                                                            <CircularProgress size={20} />
                                                                        ) : (
                                                                            <Iconify icon="eva:trash-2-outline" />
                                                                        )}
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Information about deleting cars */}
                        {onDeleteCar && cars.some(car => {
                            const displayStatus = getDisplayStatus(car);
                            return displayStatus.status === 'rented' || displayStatus.status === 'pending';
                        }) && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                                    * Cars with status "rented" or "pending" cannot be deleted. They must be returned or have their reservation completed first.
                                </Typography>
                            )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}