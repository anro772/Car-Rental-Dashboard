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
import { getInitials } from 'src/utils/get-initials';
import { RentalExtended } from 'src/services/rentalsService';
import carsService, { Car } from 'src/services/carsService';
import customersService from 'src/services/customersService';
import contractService from 'src/services/contractService';
import invoiceService from 'src/services/invoiceService';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { RentalEditModal } from './rental-edit-modal';

// Translation mappings for UI display (preserving backend values)
const STATUS_TRANSLATIONS: Record<string, string> = {
    'pending': 'În așteptare',
    'active': 'Activ',
    'completed': 'Finalizat',
    'cancelled': 'Anulat'
};

const PAYMENT_STATUS_TRANSLATIONS: Record<string, string> = {
    'unpaid': 'Neplătit',
    'partial': 'Parțial',
    'paid': 'Plătit'
};

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
    hideCarColumn?: boolean;
};

export function RentalTableRow({
    row,
    selected,
    onSelectRow,
    onDeleteRow,
    onUpdateStatus,
    onUpdatePayment,
    hideCustomerColumn = false,
    hideCarColumn = false
}: Props) {
    const {
        id, car_id, customer_id, brand, model, license_plate,
        customer_name, customer_email, customer_avatar_url, // Destructure customer_avatar_url
        start_date, end_date, status, payment_status,
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
    const [customerData, setCustomerData] = useState<any>(null); // Consider typing this if you use it more

    const router = useRouter();

    useEffect(() => {
        if (!car_id || !isLoadingCar) return;
        let isMounted = true;
        const fetchCarData = async () => {
            try {
                const carData = await carsService.getCar(car_id);
                if (isMounted) {
                    if (carData.color) setCarColor(carData.color);
                    if (!carImage && carData.image_url) setCarImage(carData.image_url);
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
    const handleViewCarRentals = () => { router.push(`/rental?car=${car_id}`); handleCloseMenu(); };
    const handleUpdateStatus = (newStatus: RentalExtended['status']) => { onUpdateStatus(newStatus); handleCloseStatusMenu(); };
    const handleUpdatePayment = (newPaymentStatus: RentalExtended['payment_status']) => { onUpdatePayment(newPaymentStatus); handleClosePaymentMenu(); };
    const handleCarImageError = () => setCarImage('/assets/car-placeholder.png'); // Placeholder for car
    const handleCustomerAvatarError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // Fallback to initials if customer avatar fails to load
        const target = event.target as HTMLImageElement;
        if (customer_name) {
            target.style.display = 'none'; // Hide the img tag
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.MuiAvatar-fallback')) { // Avoid duplicate initials
                const initialsAvatar = document.createElement('div');
                initialsAvatar.className = 'MuiAvatar-root MuiAvatar-circular MuiAvatar-colorDefault MuiAvatar-fallback'; // Match classes
                initialsAvatar.textContent = getInitials(customer_name);
                parent.appendChild(initialsAvatar);
            }
        } else {
            target.src = '/assets/avatar_default.jpg'; // Generic placeholder
        }
    };


    const handleEditSuccess = (updatedRental: RentalExtended) => {
        if (updatedRental.status) onUpdateStatus(updatedRental.status);
        if (updatedRental.payment_status && updatedRental.payment_status !== payment_status) {
            onUpdatePayment(updatedRental.payment_status);
        }
    };

    const handleGenerateContract = async () => {
        try {
            let custData = customerData;
            if (!custData && customer_id) {
                custData = await customersService.getCustomer(customer_id);
                setCustomerData(custData);
            }
            if (custData) await contractService.downloadContract(custData, row);
            handleCloseMenu();
        } catch (error) {
            console.error('Failed to generate contract:', error);
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            let custData = customerData;
            if (!custData && customer_id) {
                custData = await customersService.getCustomer(customer_id);
                setCustomerData(custData);
            }
            if (custData) await invoiceService.downloadInvoice(custData, row);
            handleCloseMenu();
        } catch (error) {
            console.error('Failed to generate invoice:', error);
        }
    };

    return (
        <>
            <TableRow hover selected={selected}>
                <TableCell padding="checkbox">
                    <Checkbox checked={selected} onClick={onSelectRow} />
                </TableCell>

                {!hideCarColumn && (
                    <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            {loadingImage ? (
                                <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1 }} />
                            ) : (
                                <Avatar
                                    alt={brand || 'Imagine mașină'} src={carImage || '/assets/car-placeholder.png'} variant="rounded"
                                    sx={{ width: 48, height: 48, borderRadius: 1 }} imgProps={{ onError: handleCarImageError }}
                                />
                            )}
                            <Box>
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>{brand} {model}</Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    {isLoadingCar ? (
                                        <Skeleton width={80} height={16} />
                                    ) : (
                                        <>
                                            {carColor && (
                                                <Tooltip title={carColor}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getColorHex(carColor), border: carColor.toLowerCase() === 'white' ? '1px solid rgba(0,0,0,0.2)' : 'none', flexShrink: 0 }} />
                                                </Tooltip>
                                            )}
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                                {license_plate || 'N/A'} {carColor ? `• ${carColor}` : ''}
                                            </Typography>
                                        </>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </TableCell>
                )}

                {!hideCustomerColumn && (
                    <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                                alt={customer_name || 'Client'}
                                src={customer_avatar_url || ''} // Pass empty string if null/undefined to trigger onError or show default
                                imgProps={{ onError: handleCustomerAvatarError }}
                            >
                                {customer_name ? getInitials(customer_name) : '?'}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 150 }}>{customer_name || 'N/A'}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                    {customer_email || 'N/A'}
                                </Typography>
                            </Box>
                        </Stack>
                    </TableCell>
                )}

                <TableCell>{fDate(start_date)}</TableCell>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {fDate(end_date)}
                        {days_overdue && days_overdue > 0 && (
                            <Chip size="small" color="error" label={`${days_overdue} zile întârziere`} variant="outlined" />
                        )}
                    </Stack>
                </TableCell>

                <TableCell>
                    <Chip
                        label={status && STATUS_TRANSLATIONS[status] ? STATUS_TRANSLATIONS[status] : status}
                        color={getStatusColor(status)}
                        size="small" onClick={handleOpenStatusMenu} sx={{ textTransform: 'capitalize', cursor: 'pointer' }}
                    />
                </TableCell>
                <TableCell>
                    <Chip
                        label={payment_status && PAYMENT_STATUS_TRANSLATIONS[payment_status] ? PAYMENT_STATUS_TRANSLATIONS[payment_status] : payment_status}
                        color={getPaymentColor(payment_status)}
                        size="small" onClick={handleOpenPaymentMenu} sx={{ textTransform: 'capitalize', cursor: 'pointer' }}
                    />
                </TableCell>
                <TableCell align="right"><Typography variant="subtitle2">{fCurrency(total_cost)}</Typography></TableCell>
                <TableCell align="right"><IconButton onClick={handleOpenMenu}><Iconify icon="eva:more-vertical-fill" /></IconButton></TableCell>
            </TableRow>

            <Popover
                open={!!openMenu} anchorEl={openMenu} onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { width: 180 } } }}
            >
                <MenuItem onClick={handleEditRental} disabled={status === 'completed' || status === 'cancelled'}>
                    <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />Editează
                </MenuItem>
                {!hideCustomerColumn && customer_id && (
                    <MenuItem onClick={handleViewCustomerRentals}>
                        <Iconify icon="mdi:account" sx={{ mr: 2 }} />Client (Închirieri)
                    </MenuItem>
                )}
                {!hideCarColumn && car_id && (
                    <MenuItem onClick={handleViewCarRentals}>
                        <Iconify icon="eva:car-fill" sx={{ mr: 2 }} />Mașină (Închirieri)
                    </MenuItem>
                )}
                {car_id && (
                    <MenuItem onClick={handleViewCar}>
                        <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />Vezi mașina
                    </MenuItem>
                )}
                <MenuItem onClick={handleGenerateContract}>
                    <Iconify icon="mdi:file-document-outline" sx={{ mr: 2 }} />Afișare contract
                </MenuItem>
                {status === 'completed' && (
                    <MenuItem onClick={handleGenerateInvoice}>
                        <Iconify icon="mdi:receipt" sx={{ mr: 2 }} />Descarcă factură
                    </MenuItem>
                )}
                <MenuItem onClick={onDeleteRow} sx={{ color: 'error.main' }} disabled={status === 'active'}>
                    <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />Șterge
                </MenuItem>
            </Popover>

            <Menu anchorEl={openStatusMenu} open={!!openStatusMenu} onClose={handleCloseStatusMenu}>
                <MenuItem onClick={() => handleUpdateStatus('pending')} disabled={status === 'pending' || status === 'completed'}><ListItemText primary={STATUS_TRANSLATIONS['pending']} /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('active')} disabled={status === 'active' || status === 'completed'}><ListItemText primary={STATUS_TRANSLATIONS['active']} /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('completed')} disabled={status === 'completed'}><ListItemText primary={STATUS_TRANSLATIONS['completed']} /></MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('cancelled')} disabled={status === 'cancelled' || status === 'completed'}><ListItemText primary={STATUS_TRANSLATIONS['cancelled']} /></MenuItem>
            </Menu>

            <Menu anchorEl={openPaymentMenu} open={!!openPaymentMenu} onClose={handleClosePaymentMenu}>
                <MenuItem onClick={() => handleUpdatePayment('unpaid')} disabled={payment_status === 'unpaid'}><ListItemText primary={PAYMENT_STATUS_TRANSLATIONS['unpaid']} /></MenuItem>
                <MenuItem onClick={() => handleUpdatePayment('partial')} disabled={payment_status === 'partial'}><ListItemText primary={PAYMENT_STATUS_TRANSLATIONS['partial']} /></MenuItem>
                <MenuItem onClick={() => handleUpdatePayment('paid')} disabled={payment_status === 'paid'}><ListItemText primary={PAYMENT_STATUS_TRANSLATIONS['paid']} /></MenuItem>
            </Menu>

            <RentalEditModal
                open={openEditModal}
                onClose={() => setOpenEditModal(false)}
                onSuccess={handleEditSuccess}
                rental={{ ...row, color: carColor }}
            />
        </>
    );
}