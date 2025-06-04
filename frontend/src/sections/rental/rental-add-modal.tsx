// Import section remains the same
import { useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import { Iconify } from 'src/components/iconify';

import rentalsService, { NewRental } from 'src/services/rentalsService';
import carsService, { Car } from 'src/services/carsService';
import customersService, { Customer } from 'src/services/customersService';

// Translation mappings for UI display (preserving backend values)
const CAR_STATUS_TRANSLATIONS: Record<string, string> = {
    'available': 'Disponibil',
    'rented': 'Închiriată',
    'maintenance': 'În mentenanță',
    'pending': 'În așteptare'
};

const RENTAL_STATUS_TRANSLATIONS: Record<string, string> = {
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

// Helper functions remain the same
const getColorHex = (colorName: string | undefined): string => {
    const colorMap: Record<string, string> = {
        'Red': '#FF0000', 'Black': '#000000', 'White': '#FFFFFF',
        'Silver': '#C0C0C0', 'Blue': '#0000FF', 'Gray': '#808080',
        'Yellow': '#FFFF00', 'Green': '#008000',
    };
    if (!colorName) return '#808080'; // Default to Gray if undefined
    return colorMap[colorName.trim()] || '#808080'; // Default to Gray if not found
};

const getCarStatusChip = (status: string) => {
    switch (status) {
        case 'available':
            return {
                label: CAR_STATUS_TRANSLATIONS['available'],
                color: 'success' as const,
                icon: 'eva:checkmark-circle-fill'
            };
        case 'rented':
            return {
                label: CAR_STATUS_TRANSLATIONS['rented'],
                color: 'primary' as const,
                icon: 'eva:car-fill'
            };
        case 'maintenance':
            return {
                label: CAR_STATUS_TRANSLATIONS['maintenance'],
                color: 'warning' as const,
                icon: 'eva:tools-fill'
            };
        case 'pending':
            return {
                label: CAR_STATUS_TRANSLATIONS['pending'],
                color: 'warning' as const,
                icon: 'eva:clock-fill'
            };
        default:
            return {
                label: status,
                color: 'default' as const,
                icon: 'eva:question-mark-circle-fill'
            };
    }
};

type RentalAddModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    customerId?: number | null;
    carId?: number | null; // Add this line
};

export function RentalAddModal({ open, onClose, onSuccess, customerId = null }: RentalAddModalProps) {
    // All the state variables remain the same
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [allCars, setAllCars] = useState<Car[]>([]);
    const [availableCars, setAvailableCars] = useState<Car[]>([]);
    const [unavailableCars, setUnavailableCars] = useState<Car[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [customerCanRent, setCustomerCanRent] = useState<boolean>(true);

    const [rentalData, setRentalData] = useState<Partial<NewRental>>({
        status: 'pending',
        payment_status: 'unpaid',
        customer_id: customerId || undefined
    });

    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Reset form when opening modal - remains the same
    useEffect(() => {
        if (open) {
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);
            const formatDate = (date: Date) => date.toISOString().split('T')[0];

            setRentalData({
                status: 'pending', payment_status: 'unpaid',
                customer_id: customerId || undefined,
                start_date: formatDate(today), end_date: formatDate(threeDaysLater)
            });
            setError(''); setFormErrors({}); setSelectedCar(null); setCalculatedTotal(0);
            fetchCarsAndCustomers();
        }
    }, [open, customerId]);

    // Load cars and customers - remains the same
    const fetchCarsAndCustomers = async () => {
        try {
            setLoading(true);

            // Get all cars to show available and unavailable cars
            const allCarsData = await carsService.getAllCars();

            // Get available cars separately for filtering
            const availableCarsData = await carsService.getAvailableCars();

            // Set all cars
            setAllCars(allCarsData);

            // Filter available and unavailable cars
            setAvailableCars(availableCarsData);
            setUnavailableCars(allCarsData.filter(car => car.status !== 'available'));

            // Get all active customers
            const customersData = await customersService.getActiveCustomers();
            setCustomers(customersData);

            // If a specific customer is pre-selected, check if they have a verified license
            if (customerId) {
                const preSelectedCustomer = customersData.find(c => c.id === customerId);
                if (preSelectedCustomer && !preSelectedCustomer.license_verified) {
                    setCustomerCanRent(false);
                    setError(`${preSelectedCustomer.first_name} ${preSelectedCustomer.last_name} nu are un permis verificat și nu poate închiria o mașină.`);
                } else {
                    setCustomerCanRent(true);
                }
            }

        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Nu s-au putut încărca datele mașinilor și clienților.');
        } finally {
            setLoading(false);
        }
    };

    // Update selected car when car_id changes - remains the same
    useEffect(() => {
        if (rentalData.car_id) {
            const car = allCars.find(c => c.id === rentalData.car_id);
            setSelectedCar(car || null);
        } else {
            setSelectedCar(null);
        }
    }, [rentalData.car_id, allCars]);

    // Check if selected customer has a verified license - remains the same
    useEffect(() => {
        if (rentalData.customer_id) {
            const customer = customers.find(c => c.id === rentalData.customer_id);
            if (customer) {
                setCustomerCanRent(!!customer.license_verified);
                if (!customer.license_verified) {
                    setFormErrors(prev => ({
                        ...prev,
                        customer_id: 'Clientul trebuie să aibă un permis verificat pentru a închiria o mașină'
                    }));
                }
            }
        }
    }, [rentalData.customer_id, customers]);

    // Calculate total cost when dates or car changes - remains the same
    useEffect(() => {
        if (selectedCar && rentalData.start_date && rentalData.end_date) {
            try {
                const start = new Date(rentalData.start_date);
                const end = new Date(rentalData.end_date);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
                    setCalculatedTotal(0);
                    setRentalData(prev => ({ ...prev, total_cost: 0 }));
                    return;
                };
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                if (days <= 0) {
                    setCalculatedTotal(0);
                    setRentalData(prev => ({ ...prev, total_cost: 0 }));
                    return;
                };
                const total = selectedCar.daily_rate * days;
                const roundedTotal = parseFloat(total.toFixed(2));
                setCalculatedTotal(roundedTotal);
                setRentalData(prev => ({ ...prev, total_cost: roundedTotal }));
            } catch (err) {
                console.error('Failed to calculate total:', err);
                setCalculatedTotal(0);
                setRentalData(prev => ({ ...prev, total_cost: 0 }));
            }
        } else {
            setCalculatedTotal(0);
            // Don't reset total_cost here if dates/car are cleared, allow manual entry
        }
    }, [selectedCar, rentalData.start_date, rentalData.end_date]);

    // Input change handlers - remain the same
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setRentalData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSelectChange = (e: SelectChangeEvent<unknown>) => {
        const { name, value } = e.target;
        if (name) {
            setRentalData(prev => ({ ...prev, [name]: value }));
            if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validation - with translated error messages
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!rentalData.car_id) errors.car_id = 'Mașina este obligatorie';
        if (!rentalData.customer_id) errors.customer_id = 'Clientul este obligatoriu';
        if (!rentalData.start_date) errors.start_date = 'Data de început este obligatorie';
        if (!rentalData.end_date) {
            errors.end_date = 'Data de sfârșit este obligatorie';
        } else if (rentalData.start_date && rentalData.end_date) {
            if (new Date(rentalData.end_date) < new Date(rentalData.start_date)) {
                errors.end_date = 'Data de sfârșit trebuie să fie la sau după data de început';
            }
        }
        if (!rentalData.total_cost || rentalData.total_cost <= 0) {
            errors.total_cost = 'Costul total este obligatoriu și trebuie să fie pozitiv';
        }

        // Check if selected customer has a verified license
        if (rentalData.customer_id) {
            const customer = customers.find(c => c.id === rentalData.customer_id);
            if (customer && !customer.license_verified) {
                errors.customer_id = 'Clientul trebuie să aibă un permis verificat pentru a închiria o mașină';
            }
        }

        // Check if selected car is available
        if (rentalData.car_id) {
            const car = allCars.find(c => c.id === rentalData.car_id);
            if (car && car.status && car.status !== 'available') {
                const statusDisplay = car.status in CAR_STATUS_TRANSLATIONS
                    ? CAR_STATUS_TRANSLATIONS[car.status as keyof typeof CAR_STATUS_TRANSLATIONS]
                    : car.status;
                errors.car_id = `Mașina nu este disponibilă (${statusDisplay})`;
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // UPDATED Submission function to also update car status - with translated error messages
    const handleSubmit = async () => {
        if (!validateForm()) return;

        // Double-check that customer has a verified license
        if (rentalData.customer_id) {
            const customer = customers.find(c => c.id === rentalData.customer_id);
            if (customer && !customer.license_verified) {
                setError('Nu se poate crea închirierea: Clientul trebuie să aibă un permis verificat');
                return;
            }
        }

        // Double-check that car is available
        if (rentalData.car_id) {
            const car = allCars.find(c => c.id === rentalData.car_id);
            if (car && car.status && car.status !== 'available') {
                const statusDisplay = car.status in CAR_STATUS_TRANSLATIONS
                    ? CAR_STATUS_TRANSLATIONS[car.status as keyof typeof CAR_STATUS_TRANSLATIONS]
                    : car.status;
                setError(`Nu se poate crea închirierea: Mașina nu este disponibilă (${statusDisplay})`);
                return;
            }
        }

        try {
            setSubmitting(true);

            // 1. Create the rental
            const createdRental = await rentalsService.createRental(rentalData as NewRental);

            if (rentalData.car_id) {
                try {
                    // Always set car status to rented for both active and pending rentals
                    const carStatus: 'rented' = 'rented';

                    // Use the direct status update method
                    await carsService.updateCarStatus(rentalData.car_id, carStatus);
                    console.log(`Updated car ${rentalData.car_id} status to ${carStatus} for rental starting on ${rentalData.start_date}`);
                } catch (carUpdateError) {
                    console.error('Failed to update car status:', carUpdateError);
                    // Don't fail the whole operation if car update fails - rental is already created
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to create rental:', err);
            const errorMsg = err.response?.data?.error || 'Nu s-a putut crea închirierea. Verificați datele introduse.';
            if (errorMsg.includes('already booked')) {
                setError('Această mașină este deja rezervată în perioada selectată.');
            } else {
                setError(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Render car item for the dropdown - remains the same
    const renderCarItem = (car: Car) => {
        const isAvailable = car.status === 'available';
        const statusChip = getCarStatusChip(car.status ?? 'unknown');

        return (
            <MenuItem
                key={car.id}
                value={car.id}
                disabled={!isAvailable}
                sx={{
                    opacity: isAvailable ? 1 : 0.7,
                    '&.Mui-disabled': {
                        color: 'text.secondary',
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {/* Color indicator */}
                    <Box sx={{
                        width: 14, height: 14, borderRadius: '50%', mr: 1.5, flexShrink: 0,
                        bgcolor: getColorHex(car.color),
                        border: car.color === 'White' ? '1px solid rgba(0,0,0,0.2)' : 'none'
                    }} />

                    <Typography variant="body2" component="span" sx={{ flexGrow: 1 }}>
                        {car.brand} {car.model} ({car.color || 'N/A'}) - {car.license_plate}
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1, mr: 1 }}>
                        {car.daily_rate} Lei/zi
                    </Typography>

                    <Chip
                        label={statusChip.label}
                        color={statusChip.color}
                        size="small"
                        icon={<Iconify icon={statusChip.icon} />}
                    />
                </Box>
            </MenuItem>
        );
    };

    // The return statement with translated text
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Închiriere Nouă
                <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                    <Iconify icon="eva:close-fill" />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}

                {!loading && (
                    <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
                        Doar clienții cu permis de conducere verificat pot închiria o mașină. Doar mașinile disponibile pot fi selectate.
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
                ) : (
                    <Box component="form" sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            {/* Car Selection */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!formErrors.car_id}>
                                    <InputLabel id="car-label">Mașină</InputLabel>
                                    <Select
                                        labelId="car-label" name="car_id" value={rentalData.car_id || ''}
                                        label="Mașină" onChange={handleSelectChange} disabled={submitting || !customerCanRent}
                                        // Render value to show selected car info (optional)
                                        renderValue={(selected) => {
                                            const car = allCars.find(c => c.id === selected);
                                            return car ? `${car.brand} ${car.model} (${car.color || 'N/A'}) - ${car.license_plate}` : '';
                                        }}
                                    >
                                        {/* Available Cars Section */}
                                        <MenuItem disabled>
                                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                                                Mașini Disponibile
                                            </Typography>
                                        </MenuItem>

                                        {availableCars.length > 0 ? (
                                            availableCars.map(car => renderCarItem(car))
                                        ) : (
                                            <MenuItem disabled>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    Nu există mașini disponibile
                                                </Typography>
                                            </MenuItem>
                                        )}

                                        {/* Unavailable Cars Section */}
                                        {unavailableCars.length > 0 && (
                                            <>
                                                <Divider sx={{ my: 1 }} />
                                                <MenuItem disabled>
                                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                        Mașini Indisponibile
                                                    </Typography>
                                                </MenuItem>
                                                {unavailableCars.map(car => renderCarItem(car))}
                                            </>
                                        )}
                                    </Select>
                                    {formErrors.car_id && <FormHelperText>{formErrors.car_id}</FormHelperText>}
                                </FormControl>
                            </Grid>

                            {/* Customer Selection */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!formErrors.customer_id}>
                                    <InputLabel id="customer-label">Client</InputLabel>
                                    <Select
                                        labelId="customer-label"
                                        name="customer_id"
                                        value={rentalData.customer_id || ''}
                                        label="Client"
                                        onChange={handleSelectChange}
                                        disabled={submitting || !!customerId}
                                    >
                                        {/* Verified Customers */}
                                        <MenuItem disabled>
                                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                                                Clienți cu Permise Verificate
                                            </Typography>
                                        </MenuItem>

                                        {customers.filter(c => c.license_verified).length > 0 ? (
                                            customers.filter(c => c.license_verified).map((customer) => (
                                                <MenuItem key={customer.id} value={customer.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                        <Typography variant="body2" component="span" sx={{ flexGrow: 1 }}>
                                                            {customer.first_name} {customer.last_name} - {customer.email}
                                                        </Typography>

                                                        <Chip
                                                            label="Verificat"
                                                            color="success"
                                                            size="small"
                                                            icon={<Iconify icon="eva:checkmark-circle-fill" />}
                                                            sx={{ ml: 1 }}
                                                        />
                                                    </Box>
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    Nu există clienți cu permise verificate
                                                </Typography>
                                            </MenuItem>
                                        )}

                                        {/* Unverified Customers */}
                                        {customers.filter(c => !c.license_verified).length > 0 && (
                                            <>
                                                <Divider sx={{ my: 1 }} />
                                                <MenuItem disabled>
                                                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                        Clienți cu Permise Neverificate
                                                    </Typography>
                                                </MenuItem>

                                                {customers.filter(c => !c.license_verified).map((customer) => (
                                                    <MenuItem
                                                        key={customer.id}
                                                        value={customer.id}
                                                        disabled={true}
                                                        sx={{
                                                            opacity: 0.6,
                                                            '&.Mui-disabled': {
                                                                color: 'text.secondary',
                                                            }
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                            <Typography variant="body2" component="span" sx={{ flexGrow: 1 }}>
                                                                {customer.first_name} {customer.last_name} - {customer.email}
                                                            </Typography>

                                                            <Tooltip title="Permis neverificat">
                                                                <Chip
                                                                    label="Neverificat"
                                                                    color="error"
                                                                    size="small"
                                                                    icon={<Iconify icon="eva:alert-triangle-fill" />}
                                                                    sx={{ ml: 1 }}
                                                                />
                                                            </Tooltip>
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </>
                                        )}
                                    </Select>
                                    {formErrors.customer_id && <FormHelperText>{formErrors.customer_id}</FormHelperText>}
                                </FormControl>
                            </Grid>

                            {/* Date Range */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth label="Data de Început" name="start_date" type="date"
                                    value={rentalData.start_date || ''} onChange={handleInputChange}
                                    disabled={submitting || !customerCanRent}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!formErrors.start_date}
                                    helperText={formErrors.start_date}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth label="Data de Sfârșit" name="end_date" type="date"
                                    value={rentalData.end_date || ''} onChange={handleInputChange}
                                    disabled={submitting || !customerCanRent}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!formErrors.end_date}
                                    helperText={formErrors.end_date}
                                />
                            </Grid>

                            {/* Status and Payment Status */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="status-label">Status</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        name="status"
                                        value={rentalData.status || 'pending'}
                                        label="Status"
                                        onChange={handleSelectChange}
                                        disabled={submitting || !customerCanRent}
                                    >
                                        <MenuItem value="pending">{RENTAL_STATUS_TRANSLATIONS['pending']}</MenuItem>
                                        <MenuItem value="active">{RENTAL_STATUS_TRANSLATIONS['active']}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="payment-status-label">Status Plată</InputLabel>
                                    <Select
                                        labelId="payment-status-label"
                                        name="payment_status"
                                        value={rentalData.payment_status || 'unpaid'}
                                        label="Status Plată"
                                        onChange={handleSelectChange}
                                        disabled={submitting || !customerCanRent}
                                    >
                                        <MenuItem value="unpaid">{PAYMENT_STATUS_TRANSLATIONS['unpaid']}</MenuItem>
                                        <MenuItem value="partial">{PAYMENT_STATUS_TRANSLATIONS['partial']}</MenuItem>
                                        <MenuItem value="paid">{PAYMENT_STATUS_TRANSLATIONS['paid']}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Total Cost and Notes */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth label="Cost Total" name="total_cost" type="number"
                                    value={rentalData.total_cost || ''} onChange={handleInputChange}
                                    disabled={submitting || !customerCanRent}
                                    InputProps={{ startAdornment: <InputAdornment position="start">Lei</InputAdornment> }}
                                    error={!!formErrors.total_cost}
                                    helperText={formErrors.total_cost || (selectedCar ? `Calculat: ${calculatedTotal} Lei` : '')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Note"
                                    name="notes"
                                    multiline
                                    rows={2}
                                    value={rentalData.notes || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting || !customerCanRent}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Anulează</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submitting || loading || !customerCanRent}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                    {submitting ? 'Se creează...' : 'Creează Închiriere'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}