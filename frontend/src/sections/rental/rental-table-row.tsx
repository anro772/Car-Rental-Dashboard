// src/sections/rental/rental-table-row.tsx
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';

import { RentalExtended } from 'src/services/rentalsService';
import carsService, { Car } from 'src/services/carsService';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { RentalEditModal } from './rental-edit-modal';

// ----------------------------------------------------------------------

// Helper function to get color hex
const getColorHex = (colorName: string | undefined): string => {
    const colorMap: Record<string, string> = {
        'Red': '#FF0000', 'Dark Red': '#8B0000', 'Burgundy': '#800020',
        'Black': '#000000',
        'White': '#FFFFFF', 'Pearl White': '#F5F5F5', 'Ivory': '#FFFFF0',
        'Silver': '#C0C0C0', 'Platinum': '#E5E4E2',
        'Blue': '#0000FF', 'Navy Blue': '#000080', 'Sky Blue': '#87CEEB',
        'Gray': '#808080', 'Charcoal': '#36454F',
        'Yellow': '#FFFF00', 'Gold': '#FFD700',
        'Green': '#008000', 'Forest Green': '#228B22',
        'Brown': '#A52A2A', 'Beige': '#F5F5DC',
        'Orange': '#FFA500', 'Bronze': '#CD7F32',
        'Purple': '#800080', 'Violet': '#8F00FF',
        'Pink': '#FFC0CB', 'Magenta': '#FF00FF',
        'Teal': '#008080', 'Turquoise': '#40E0D0',
    };
    if (!colorName) return '#808080'; // Default to Gray if undefined
    return colorMap[colorName.trim()] || '#808080'; // Default to Gray if not found
};

// Helper function for Status Color
const getStatusColor = (status?: RentalExtended['status']): "success" | "warning" | "info" | "error" | "default" => {
    switch (status) {
        case 'active': return 'success';
        case 'pending': return 'warning';
        case 'completed': return 'info';
        case 'cancelled': return 'error';
        default: return 'default';
    }
};

// Helper function for Payment Color
const getPaymentColor = (payment_status?: RentalExtended['payment_status']): "success" | "warning" | "error" | "default" => {
    switch (payment_status) {
        case 'paid': return 'success';
        case 'partial': return 'warning';
        case 'unpaid': return 'error';
        default: return 'default';
    }
};

type Props = {
    row: RentalExtended;
    selected: boolean;
    onSelectRow: VoidFunction;
    onDeleteRow: VoidFunction;
    onUpdateStatus: (status: RentalExtended['status']) => void;
    onUpdatePayment: (status: RentalExtended['payment_status']) => void;
    hideCustomerColumn?: boolean;
};

export function RentalTableRow({
    row,
    selected,
    onSelectRow,
    onDeleteRow,
    onUpdateStatus,
    onUpdatePayment,
    hideCustomerColumn = false
}: Props) {
    const {
        id, car_id, customer_id, brand, model, license_plate,
        customer_name, start_date, end_date, status, payment_status,
        total_cost, days_overdue, image_url, color
    } = row;

    const [openMenu, setOpenMenu] = useState<HTMLElement | null>(null);
    const [openStatusMenu, setOpenStatusMenu] = useState<HTMLElement | null>(null);
    const [openPaymentMenu, setOpenPaymentMenu] = useState<HTMLElement | null>(null);
    const [carImage, setCarImage] = useState<string | null>(image_url || null);
    const [loadingImage, setLoadingImage] = useState(!image_url && !!car_id);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [carColor, setCarColor] = useState<string | undefined>(color);
    const [isLoadingCar, setIsLoadingCar] = useState(!color && !!car_id);

    const router = useRouter();

    // Fetch car data if color is missing
    useEffect(() => {
        if (!car_id || !isLoadingCar) return;

        let isMounted = true;
        const fetchCarData = async () => {
            try {
                const carData = await carsService.getCar(car_id);
                if (isMounted) {
                    if (carData.color) {
                        setCarColor(carData.color);
                    }
                    if (!carImage && carData.image_url) {
                        setCarImage(carData.image_url);
                    }
                }
            } catch (error) {
                console.error(`Error fetching car data for ID ${car_id}:`, error);
            } finally {
                if (isMounted) {
                    setIsLoadingCar(false);
                    setLoadingImage(false);
                }
            }
        };

        fetchCarData();
        return () => { isMounted = false; };
    }, [car_id, carImage, isLoadingCar]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => setOpenMenu(event.currentTarget);
    const handleCloseMenu = () => setOpenMenu(null);
    const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); setOpenStatusMenu(event.currentTarget); };
    const handleCloseStatusMenu = () => setOpenStatusMenu(null);
    const handleOpenPaymentMenu = (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); setOpenPaymentMenu(event.currentTarget); };
    const handleClosePaymentMenu = () => setOpenPaymentMenu(null);

    const handleViewCar = () => { if (car_id) router.push(`/cars/${car_id}`); handleCloseMenu(); };
    const handleEditRental = () => { setOpenEditModal(true); handleCloseMenu(); };
    const handleViewCustomerRentals = () => { router.push(`/rental?customer=${customer_id}`); handleCloseMenu(); };
    const handleUpdateStatus = (newStatus: RentalExtended['status']) => { onUpdateStatus(newStatus); handleCloseStatusMenu(); };
    const handleUpdatePayment = (newStatus: RentalExtended['payment_status']) => { onUpdatePayment(newStatus); handleClosePaymentMenu(); };
    const handleImageError = () => setCarImage('/assets/car-placeholder.png');

    const handleEditSuccess = () => {
        onUpdateStatus(status);
    };

    return (
        <>
            <TableRow hover selected={selected}>
                <TableCell padding="checkbox">
                    <Checkbox checked={selected} onClick={onSelectRow} />
                </TableCell>

                {/* === CAR COLUMN WITH INLINE COLOR DISPLAY === */}
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {/* Avatar/Skeleton */}
                        {loadingImage ? (
                            <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
                        ) : (
                            <Avatar
                                alt={brand || 'Car image'} src={carImage || '/assets/car-placeholder.png'} variant="rounded"
                                sx={{ width: 48, height: 48, borderRadius: 1 }} imgProps={{ onError: handleImageError }}
                            />
                        )}

                        {/* Text content with inline color */}
                        <Box>
                            <Typography variant="subtitle2" noWrap>
                                {brand} {model}
                            </Typography>

                            {/* License plate and color in the same line */}
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                {isLoadingCar ? (
                                    <Skeleton width={80} height={16} />
                                ) : (
                                    <>
                                        {/* Color dot indicator */}
                                        {carColor && (
                                            <Tooltip title={carColor}>
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        bgcolor: getColorHex(carColor),
                                                        border: carColor.toLowerCase() === 'white' ? '1px solid rgba(0,0,0,0.2)' : 'none',
                                                        flexShrink: 0
                                                    }}
                                                />
                                            </Tooltip>
                                        )}

                                        {/* License plate and color text */}
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                            {license_plate || 'N/A'} {carColor ? `• ${carColor}` : ''}
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </TableCell>

                {/* Customer column */}
                {!hideCustomerColumn && (
                    <TableCell>
                        <Typography variant="subtitle2">{customer_name}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                            {row.customer_email}
                        </Typography>
                    </TableCell>
                )}

                {/* Dates */}
                <TableCell>{fDate(start_date)}</TableCell>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {fDate(end_date)}
                        {days_overdue && days_overdue > 0 && (
                            <Chip size="small" color="error" label={`${days_overdue} days overdue`} variant="outlined" />
                        )}
                    </Stack>
                </TableCell>

                {/* Status Chip */}
                <TableCell>
                    <Chip
                        label={status}
                        color={getStatusColor(status)}
                        size="small"
                        onClick={handleOpenStatusMenu}
                        sx={{
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                        }}
                    />
                </TableCell>

                {/* Payment Status Chip */}
                <TableCell>
                    <Chip
                        label={payment_status}
                        color={getPaymentColor(payment_status)}
                        size="small"
                        onClick={handleOpenPaymentMenu}
                        sx={{
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                        }}
                    />
                </TableCell>

                {/* Total Cost */}
                <TableCell align="right"><Typography variant="subtitle2">{fCurrency(total_cost)}</Typography></TableCell>

                {/* Actions Menu Button */}
                <TableCell align="right"><IconButton onClick={handleOpenMenu}><Iconify icon="eva:more-vertical-fill" /></IconButton></TableCell>
            </TableRow>

            {/* Popover for Actions Menu */}
            <Popover
                open={!!openMenu}
                anchorEl={openMenu}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { width: 160 } } }}
            >
                <MenuItem onClick={handleEditRental} disabled={status === 'completed' || status === 'cancelled'}>
                    <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />Edit
                </MenuItem>
                {!hideCustomerColumn && (
                    <MenuItem onClick={handleViewCustomerRentals}>
                        <Iconify icon="mdi:account" sx={{ mr: 2 }} />Customer
                    </MenuItem>
                )}
                <MenuItem onClick={handleViewCar}>
                    <Iconify icon="eva:car-fill" sx={{ mr: 2 }} />Car
                </MenuItem>
                <MenuItem onClick={onDeleteRow} sx={{ color: 'error.main' }} disabled={status === 'active'}>
                    <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />Delete
                </MenuItem>
            </Popover>

            {/* Menu for Status Update */}
            <Menu anchorEl={openStatusMenu} open={!!openStatusMenu} onClose={handleCloseStatusMenu}>
                <MenuItem onClick={() => handleUpdateStatus('pending')} disabled={status === 'pending' || status === 'completed'}><ListItemText primary="Pending" /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('active')} disabled={status === 'active' || status === 'completed'}><ListItemText primary="Active" /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('completed')} disabled={status === 'completed'}><ListItemText primary="Completed" /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('cancelled')} disabled={status === 'cancelled' || status === 'completed'}><ListItemText primary="Cancelled" /></MenuItem>
            </Menu>

            {/* Menu for Payment Update */}
            <Menu anchorEl={openPaymentMenu} open={!!openPaymentMenu} onClose={handleClosePaymentMenu}>
                <MenuItem onClick={() => handleUpdatePayment('unpaid')} disabled={payment_status === 'unpaid'}><ListItemText primary="Unpaid" /></MenuItem>
                <MenuItem onClick={() => handleUpdatePayment('partial')} disabled={payment_status === 'partial'}><ListItemText primary="Partial" /></MenuItem>
                <MenuItem onClick={() => handleUpdatePayment('paid')} disabled={payment_status === 'paid'}><ListItemText primary="Paid" /></MenuItem>
            </Menu>

            {/* Edit Rental Modal */}
            <RentalEditModal
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                onSuccess={handleEditSuccess}
                rental={{ ...row, color: carColor }} // Pass the fetched color to the modal
            />
        </>
    );
}