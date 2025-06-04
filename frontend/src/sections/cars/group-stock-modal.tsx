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
import type { Car } from 'src/services/carsService';
import rentalsService, { RentalExtended } from 'src/services/rentalsService';
import { TechnicalSheetDialog } from './technical-sheet-dialog';

const STATUS_TRANSLATIONS: Record<string, string> = {
    'available': 'Disponibil',
    'rented': 'Închiriat',
    'maintenance': 'În mentenanță',
    'pending': 'În așteptare',
    'unknown': 'Necunoscut'
};

type GroupStockModalProps = {
    open: boolean;
    onClose: () => void;
    groupName: string;
    cars: Car[];
    onEditCar: (car: Car) => void;
    onDeleteCar?: (carId: number) => Promise<void>;
    rentalData?: Record<number, RentalExtended>;
};

export function GroupStockModal({
    open,
    onClose,
    groupName,
    cars = [],
    onEditCar,
    onDeleteCar,
    rentalData,
}: GroupStockModalProps) {
    const router = useRouter();
    const [deletingCarId, setDeletingCarId] = useState<number | null>(null);
    const [carsRentalData, setCarsRentalData] = useState<Record<number, RentalExtended>>({});
    const [loading, setLoading] = useState(false);

    const [technicalSheetOpen, setTechnicalSheetOpen] = useState(false);
    const [selectedCarForTechnical, setSelectedCarForTechnical] = useState<Car | null>(null);

    useEffect(() => {
        async function fetchRentalData() {
            if (!open || rentalData) return;

            setLoading(true);
            const rentalInfo: Record<number, RentalExtended> = {};

            try {
                const activeRentals = await rentalsService.getRentalsByStatus('active');
                const pendingRentals = await rentalsService.getRentalsByStatus('pending');

                const allRentals = [...activeRentals, ...pendingRentals];

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

    const rentalInfoData = rentalData || carsRentalData;

    const handleViewDetails = (carId: number) => {
        router.push(`/cars/${carId}`);
        onClose();
    };

    const handleEditClick = (car: Car) => {
        onEditCar(car);
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

    const handleTechnicalSheetClick = (car: Car) => {
        setSelectedCarForTechnical(car);
        setTechnicalSheetOpen(true);
    };

    const handleTechnicalSheetClose = () => {
        setTechnicalSheetOpen(false);
        setSelectedCarForTechnical(null);
    };

    const getDisplayStatus = (car: Car): { status: string; color: "success" | "error" | "warning" | "default" } => {
        if (car.status !== 'rented') {
            return {
                status: car.status || 'unknown',
                color: getStatusColor(car.status)
            };
        }

        const rental = rentalInfoData[car.id];
        if (rental) {
            if (rental.status === 'pending') {
                return {
                    status: 'pending',
                    color: 'warning'
                };
            }

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

        return {
            status: 'rented',
            color: 'error'
        };
    };

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
        <>
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
                <DialogTitle>
                    Detalii stoc: {groupName}
                    <IconButton
                        aria-label="închide"
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                    >
                        <Iconify icon="eva:close-fill" />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {cars.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', py: 3 }}>
                            Nu s-au găsit mașini individuale pentru acest grup.
                        </Typography>
                    ) : (
                        <>
                            {loading && (
                                <Box display="flex" justifyContent="center" my={2}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        Încărcarea datelor de închiriere...
                                    </Typography>
                                </Box>
                            )}

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'background.neutral' }}>
                                        <TableRow>
                                            <TableCell>Plăcuță de înmatriculare</TableCell>
                                            <TableCell>Culoare</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Tarif zilnic</TableCell>
                                            <TableCell align="center">Acțiuni</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cars.map((car) => {
                                            const displayStatus = getDisplayStatus(car);
                                            const translatedStatus = STATUS_TRANSLATIONS[displayStatus.status] || displayStatus.status;

                                            return (
                                                <TableRow key={car.id} hover>
                                                    <TableCell component="th" scope="row">
                                                        {car.license_plate || '-'}
                                                    </TableCell>
                                                    <TableCell>{car.color || '-'}</TableCell>
                                                    <TableCell>
                                                        <Label color={displayStatus.color} variant="filled">
                                                            {translatedStatus}
                                                        </Label>
                                                    </TableCell>
                                                    <TableCell align="right">{fCurrency(car.daily_rate)}</TableCell>
                                                    <TableCell align="center">
                                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                                            <Tooltip title="Vezi detalii">
                                                                <IconButton size="small" onClick={() => handleViewDetails(car.id)}>
                                                                    <Iconify icon="eva:eye-fill" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Fișă tehnică">
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="info"
                                                                        onClick={() => handleTechnicalSheetClick(car)}
                                                                        disabled={false}
                                                                    >
                                                                        <Iconify icon="eva:file-text-outline" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title="Editează mașina">
                                                                <IconButton size="small" onClick={() => handleEditClick(car)}>
                                                                    <Iconify icon="eva:edit-fill" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            {onDeleteCar && (
                                                                <Tooltip title={
                                                                    displayStatus.status === 'rented' ? "Nu se pot șterge mașinile închiriate" :
                                                                        displayStatus.status === 'pending' ? "Nu se pot șterge mașinile în așteptare" :
                                                                            "Șterge mașina"
                                                                }>
                                                                    <span>
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

                            {onDeleteCar && cars.some(car => {
                                const displayStatus = getDisplayStatus(car);
                                return displayStatus.status === 'rented' || displayStatus.status === 'pending';
                            }) && (
                                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                                        * Mașinile cu statutul „închiriat" sau „în așteptare" nu pot fi șterse. Acestea trebuie mai întâi returnate sau rezervarea lor trebuie completată.
                                    </Typography>
                                )}
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>Închide</Button>
                </DialogActions>
            </Dialog>

            {selectedCarForTechnical && (
                <TechnicalSheetDialog
                    open={technicalSheetOpen}
                    onClose={handleTechnicalSheetClose}
                    carId={selectedCarForTechnical.id}
                    carName={`${selectedCarForTechnical.brand} ${selectedCarForTechnical.model} ${selectedCarForTechnical.year} (${selectedCarForTechnical.license_plate})`}
                />
            )}
        </>
    );
}