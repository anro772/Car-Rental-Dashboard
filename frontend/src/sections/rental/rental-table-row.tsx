import { useState, useEffect } from 'react';

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

import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';

import { RentalExtended } from 'src/services/rentalsService';
import carsService from 'src/services/carsService';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

// Import the RentalEditModal
import { RentalEditModal } from './rental-edit-modal';

// ----------------------------------------------------------------------

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
        id,
        car_id,
        customer_id,
        brand,
        model,
        license_plate,
        customer_name,
        start_date,
        end_date,
        status,
        payment_status,
        total_cost,
        days_overdue
    } = row;

    const [openMenu, setOpenMenu] = useState<HTMLElement | null>(null);
    const [openStatusMenu, setOpenStatusMenu] = useState<HTMLElement | null>(null);
    const [openPaymentMenu, setOpenPaymentMenu] = useState<HTMLElement | null>(null);
    const [carImage, setCarImage] = useState<string | null>(row.image_url || null);
    const [loadingImage, setLoadingImage] = useState(!row.image_url);
    const [openEditModal, setOpenEditModal] = useState(false);

    const router = useRouter();

    // Fetch car image if not available
    useEffect(() => {
        // If we already have the image URL or there's no car_id, do nothing
        if (carImage || !car_id) return;

        const fetchCarImage = async () => {
            try {
                setLoadingImage(true);
                const carData = await carsService.getCar(car_id);
                if (carData.image_url) {
                    setCarImage(carData.image_url);
                }
            } catch (error) {
                console.error(`Error fetching car image for car ID ${car_id}:`, error);
            } finally {
                setLoadingImage(false);
            }
        };

        fetchCarImage();
    }, [car_id, carImage]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setOpenMenu(event.currentTarget);
    };

    const handleViewCar = () => {
        // Navigate to the car details page
        if (car_id) {
            router.push(`/cars/${car_id}`);
        }
        handleCloseMenu();
    };

    const handleCloseMenu = () => {
        setOpenMenu(null);
    };

    const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setOpenStatusMenu(event.currentTarget);
    };

    const handleCloseStatusMenu = () => {
        setOpenStatusMenu(null);
    };

    const handleOpenPaymentMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setOpenPaymentMenu(event.currentTarget);
    };

    const handleClosePaymentMenu = () => {
        setOpenPaymentMenu(null);
    };

    const handleEditRental = () => {
        // Open the edit modal
        setOpenEditModal(true);
        handleCloseMenu();
    };

    const handleViewCustomerRentals = () => {
        // Navigate to the rental page with customer filter
        router.push(`/rental?customer=${customer_id}`);
        handleCloseMenu();
    };

    const handleUpdateStatus = (newStatus: RentalExtended['status']) => {
        onUpdateStatus(newStatus);
        handleCloseStatusMenu();
    };

    const handleUpdatePayment = (newStatus: RentalExtended['payment_status']) => {
        onUpdatePayment(newStatus);
        handleClosePaymentMenu();
    };

    const getStatusColor = () => {
        switch (status) {
            case 'active':
                return 'success';
            case 'pending':
                return 'warning';
            case 'completed':
                return 'info';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getPaymentColor = () => {
        switch (payment_status) {
            case 'paid':
                return 'success';
            case 'partial':
                return 'warning';
            case 'unpaid':
                return 'error';
            default:
                return 'default';
        }
    };

    // Function to handle broken images
    const handleImageError = () => {
        setCarImage('/assets/car-placeholder.png');
    };

    return (
        <>
            <TableRow hover selected={selected}>
                <TableCell padding="checkbox">
                    <Checkbox checked={selected} onClick={onSelectRow} />
                </TableCell>

                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {loadingImage ? (
                            <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
                        ) : (
                            <Avatar
                                alt={brand}
                                src={carImage || '/assets/car-placeholder.png'}
                                variant="rounded"
                                sx={{ width: 48, height: 48, borderRadius: 1 }}
                                imgProps={{ onError: handleImageError }}
                            />
                        )}
                        <div>
                            <Typography variant="subtitle2" noWrap>
                                {brand} {model}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                {license_plate}
                            </Typography>
                        </div>
                    </Stack>
                </TableCell>

                {/* Customer column - only show if not filtered by customer */}
                {!hideCustomerColumn && (
                    <TableCell>
                        <Typography variant="subtitle2">{customer_name}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                            {row.customer_email}
                        </Typography>
                    </TableCell>
                )}

                <TableCell>{fDate(start_date)}</TableCell>

                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {fDate(end_date)}
                        {days_overdue && days_overdue > 0 && (
                            <Chip
                                size="small"
                                color="error"
                                label={`${days_overdue} days overdue`}
                                variant="outlined"
                            />
                        )}
                    </Stack>
                </TableCell>

                <TableCell>
                    <Chip
                        label={status}
                        color={getStatusColor()}
                        size="small"
                        variant="outlined"
                        onClick={handleOpenStatusMenu}
                        sx={{
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            backgroundColor:
                                status === 'active' ? 'rgba(84, 214, 44, 0.1)' :
                                    status === 'pending' ? 'rgba(255, 193, 7, 0.1)' :
                                        status === 'completed' ? 'rgba(24, 144, 255, 0.1)' :
                                            status === 'cancelled' ? 'rgba(255, 72, 66, 0.1)' : 'transparent'
                        }}
                    />
                </TableCell>

                <TableCell>
                    <Chip
                        label={payment_status}
                        color={getPaymentColor()}
                        size="small"
                        variant="outlined"
                        onClick={handleOpenPaymentMenu}
                        sx={{
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            backgroundColor:
                                payment_status === 'paid' ? 'rgba(84, 214, 44, 0.1)' :
                                    payment_status === 'partial' ? 'rgba(255, 193, 7, 0.1)' :
                                        payment_status === 'unpaid' ? 'rgba(255, 72, 66, 0.1)' : 'transparent'
                        }}
                    />
                </TableCell>

                <TableCell align="right">
                    <Typography variant="subtitle2">{fCurrency(total_cost)}</Typography>
                </TableCell>

                <TableCell align="right">
                    <IconButton onClick={handleOpenMenu}>
                        <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                </TableCell>
            </TableRow>

            {/* Action Menu - Simplified with only Edit, Customer and Delete options */}
            <Popover
                open={!!openMenu}
                anchorEl={openMenu}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: { width: 160 },
                    },
                }}
            >
                <MenuItem onClick={handleEditRental} disabled={status === 'completed' || status === 'cancelled'}>
                    <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
                    Edit
                </MenuItem>

                {!hideCustomerColumn && (
                    <MenuItem onClick={handleViewCustomerRentals}>
                        <Iconify icon="mdi:account" sx={{ mr: 2 }} />
                        Customer
                    </MenuItem>
                )}

                <MenuItem onClick={handleViewCar}>
                    <Iconify icon="eva:car-fill" sx={{ mr: 2 }} />
                    Car
                </MenuItem>

                <MenuItem onClick={onDeleteRow} sx={{ color: 'error.main' }} disabled={status === 'active'}>
                    <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
                    Delete
                </MenuItem>
            </Popover>

            {/* Status Menu */}
            <Menu
                anchorEl={openStatusMenu}
                open={!!openStatusMenu}
                onClose={handleCloseStatusMenu}
            >
                <MenuItem
                    onClick={() => handleUpdateStatus('pending')}
                    disabled={status === 'pending' || status === 'completed'}
                >
                    <ListItemText primary="Pending" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleUpdateStatus('active')}
                    disabled={status === 'active' || status === 'completed'}
                >
                    <ListItemText primary="Active" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={status === 'completed'}
                >
                    <ListItemText primary="Completed" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={status === 'cancelled' || status === 'completed'}
                >
                    <ListItemText primary="Cancelled" />
                </MenuItem>
            </Menu>

            {/* Payment Menu */}
            <Menu
                anchorEl={openPaymentMenu}
                open={!!openPaymentMenu}
                onClose={handleClosePaymentMenu}
            >
                <MenuItem
                    onClick={() => handleUpdatePayment('unpaid')}
                    disabled={payment_status === 'unpaid'}
                >
                    <ListItemText primary="Unpaid" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleUpdatePayment('partial')}
                    disabled={payment_status === 'partial'}
                >
                    <ListItemText primary="Partial" />
                </MenuItem>
                <MenuItem
                    onClick={() => handleUpdatePayment('paid')}
                    disabled={payment_status === 'paid'}
                >
                    <ListItemText primary="Paid" />
                </MenuItem>
            </Menu>

            {/* Edit Rental Modal */}
            <RentalEditModal
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                onSuccess={() => {
                    // Trigger update in the parent component
                    onUpdateStatus(status);
                }}
                rental={row}
            />
        </>
    );
}