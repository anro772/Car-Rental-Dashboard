// src/sections/rental/rental-edit-modal.tsx
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

import { Iconify } from 'src/components/iconify';

import rentalsService, { RentalExtended, UpdateRental } from 'src/services/rentalsService';
import carsService, { Car } from 'src/services/carsService';

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

type RentalEditModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: (updatedRental: RentalExtended) => void;
    rental: RentalExtended | null;
};

export function RentalEditModal({ open, onClose, onSuccess, rental }: RentalEditModalProps) {
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Selected car info
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
    const [carColor, setCarColor] = useState<string | undefined>(rental?.color);

    // Form data
    const [rentalData, setRentalData] = useState<UpdateRental>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Helper function to format date string to YYYY-MM-DD
    const formatDateForUI = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return dateString;
        }
    };

    // Reset and initialize form when opening modal or rental changes
    useEffect(() => {
        if (open && rental) {
            // Set the color from the rental if available
            setCarColor(rental.color);

            // Format dates properly for the form fields
            setRentalData({
                start_date: formatDateForUI(rental.start_date),
                end_date: formatDateForUI(rental.end_date),
                status: rental.status,
                payment_status: rental.payment_status,
                total_cost: rental.total_cost,
                notes: rental.notes || ''
            });

            setError('');
            setFormErrors({});

            // Fetch car data for price calculation and color if needed
            fetchCarData();
        }
    }, [open, rental]);

    // Fetch car data for the selected car
    const fetchCarData = async () => {
        if (!rental || !rental.car_id) return;

        try {
            setLoading(true);
            const carData = await carsService.getCar(rental.car_id);
            setSelectedCar(carData);

            // If the color isn't in the rental, get it from the car data
            if (!rental.color && carData.color) {
                setCarColor(carData.color);
            }
        } catch (err) {
            console.error('Failed to load car data:', err);
            setError('Nu s-au putut încărca datele mașinii pentru calculul prețului.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate total cost when dates change
    useEffect(() => {
        if (selectedCar && rentalData.start_date && rentalData.end_date) {
            try {
                const start = new Date(rentalData.start_date);
                const end = new Date(rentalData.end_date);

                // Ensure dates are valid
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

                // Calculate days (including start and end day)
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (days <= 0) return;

                const total = selectedCar.daily_rate * days;
                setCalculatedTotal(parseFloat(total.toFixed(2)));

                // Only auto-update total_cost if it's not manually changed
                if (!rentalData.total_cost) {
                    setRentalData(prev => ({
                        ...prev,
                        total_cost: total
                    }));
                }
            } catch (err) {
                console.error('Failed to calculate total:', err);
            }
        }
    }, [selectedCar, rentalData.start_date, rentalData.end_date]);

    // Debug current rental data to verify status is tracked correctly
    useEffect(() => {
        console.log('Current rental data:', rentalData);
    }, [rentalData]);

    // Input change handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Convert total_cost to number if it's a number field
        if (name === 'total_cost') {
            setRentalData(prev => ({
                ...prev,
                [name]: parseFloat(value) || 0
            }));
        } else {
            setRentalData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear error when field is changed
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (e: SelectChangeEvent<unknown>) => {
        const { name, value } = e.target;

        if (name) {
            console.log(`Select changed - name: ${name}, value: ${value}`);

            setRentalData(prev => {
                const newData = { ...prev, [name]: value };
                console.log('New rental data after select change:', newData);
                return newData;
            });

            // Clear error when field is changed
            if (formErrors[name]) {
                setFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!rentalData.start_date) {
            errors.start_date = 'Data de început este obligatorie';
        }

        if (!rentalData.end_date) {
            errors.end_date = 'Data de sfârșit este obligatorie';
        } else if (rentalData.start_date && rentalData.end_date) {
            const start = new Date(rentalData.start_date);
            const end = new Date(rentalData.end_date);

            if (end < start) {
                errors.end_date = 'Data de sfârșit trebuie să fie după data de început';
            }
        }

        if (!rentalData.total_cost || rentalData.total_cost <= 0) {
            errors.total_cost = 'Costul total este obligatoriu și trebuie să fie mai mare decât 0';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form
    const handleSubmit = async () => {
        if (!rental || !validateForm()) return;

        try {
            setSubmitting(true);

            // Convert any string values that should be numbers to actual numbers
            const dataToSubmit: UpdateRental = {
                ...rentalData,
                total_cost: typeof rentalData.total_cost === 'string'
                    ? parseFloat(rentalData.total_cost)
                    : rentalData.total_cost
            };

            // Store the original status and payment_status to check for changes
            const originalStatus = rental.status;
            const originalPaymentStatus = rental.payment_status;

            console.log('Original status:', originalStatus);
            console.log('New status:', dataToSubmit.status);
            console.log('Original payment:', originalPaymentStatus);
            console.log('New payment:', dataToSubmit.payment_status);

            // First update the main rental data (dates, cost, notes)
            const baseUpdateData = {
                start_date: dataToSubmit.start_date,
                end_date: dataToSubmit.end_date,
                total_cost: dataToSubmit.total_cost,
                notes: dataToSubmit.notes
            };

            let updatedRental = await rentalsService.updateRental(rental.id, baseUpdateData);

            // If status has changed, update it separately
            if (dataToSubmit.status && dataToSubmit.status !== originalStatus) {
                console.log('Updating status to:', dataToSubmit.status);
                updatedRental = await rentalsService.updateRentalStatus(rental.id, dataToSubmit.status);
            }

            // If payment status has changed, update it separately
            if (dataToSubmit.payment_status && dataToSubmit.payment_status !== originalPaymentStatus) {
                console.log('Updating payment status to:', dataToSubmit.payment_status);
                updatedRental = await rentalsService.updatePaymentStatus(rental.id, dataToSubmit.payment_status);
            }

            // Create a combined updated rental object for passing back to parent
            const fullUpdatedRental: RentalExtended = {
                ...rental,
                ...baseUpdateData,
                ...updatedRental,
                // Ensure the status and payment_status reflect what was selected in the form
                // even if the API response doesn't include them
                status: dataToSubmit.status || updatedRental.status || rental.status,
                payment_status: dataToSubmit.payment_status || updatedRental.payment_status || rental.payment_status
            };

            // Call the success callback with the updated rental
            onSuccess(fullUpdatedRental);

            // Close the modal
            onClose();
        } catch (err: any) {
            console.error('Failed to update rental:', err);
            if (err.response?.status === 500) {
                setError('Eroare server: Nu s-a putut actualiza închirierea. Încercați din nou sau contactați asistența.');
            } else if (err.response?.data?.error?.includes('Car is already booked')) {
                setError('Această perioadă intră în conflict cu o altă rezervare.');
            } else {
                setError('Nu s-a putut actualiza închirierea. Verificați datele introduse și încercați din nou.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Check if the rental is editable
    const isCompleted = rental?.status === 'completed';
    const isCancelled = rental?.status === 'cancelled';
    const isNonEditable = isCompleted || isCancelled;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Editare Închiriere
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Iconify icon="eva:close-fill" />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {isNonEditable && (
                    <Alert severity="warning" sx={{ mb: 3, mt: 2 }}>
                        Această închiriere este {isCompleted ? 'finalizată' : 'anulată'} și majoritatea câmpurilor nu pot fi editate.
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box component="form" sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            {/* Car Information with Better Color Display */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Mașină"
                                    value={carColor
                                        ? `${rental?.brand} ${rental?.model} - ${rental?.license_plate} (${carColor})`
                                        : `${rental?.brand} ${rental?.model} - ${rental?.license_plate}`
                                    }
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {carColor && (
                                                        <Box
                                                            sx={{
                                                                width: 14,
                                                                height: 14,
                                                                borderRadius: '50%',
                                                                bgcolor: getColorHex(carColor),
                                                                border: carColor.toLowerCase() === 'white' ? '1px solid rgba(0,0,0,0.2)' : 'none',
                                                                mr: 1
                                                            }}
                                                        />
                                                    )}
                                                    <Iconify icon="mdi:car" />
                                                </Box>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Customer Information */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Client"
                                    value={rental?.customer_name || ''}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Iconify icon="mdi:account" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Date Range */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data de Început"
                                    name="start_date"
                                    type="date"
                                    value={rentalData.start_date || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting || isNonEditable}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!formErrors.start_date}
                                    helperText={formErrors.start_date}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data de Sfârșit"
                                    name="end_date"
                                    type="date"
                                    value={rentalData.end_date || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting || isNonEditable}
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
                                        value={rentalData.status || ''}
                                        label="Status"
                                        onChange={handleSelectChange}
                                        disabled={submitting || isNonEditable}
                                    >
                                        <MenuItem value="pending">{STATUS_TRANSLATIONS['pending']}</MenuItem>
                                        <MenuItem value="active">{STATUS_TRANSLATIONS['active']}</MenuItem>
                                        <MenuItem value="completed">{STATUS_TRANSLATIONS['completed']}</MenuItem>
                                        <MenuItem value="cancelled">{STATUS_TRANSLATIONS['cancelled']}</MenuItem>
                                    </Select>
                                </FormControl>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Status curent: {rentalData.status ? STATUS_TRANSLATIONS[rentalData.status as keyof typeof STATUS_TRANSLATIONS] || rentalData.status : '-'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="payment-status-label">Status Plată</InputLabel>
                                    <Select
                                        labelId="payment-status-label"
                                        name="payment_status"
                                        value={rentalData.payment_status || ''}
                                        label="Status Plată"
                                        onChange={handleSelectChange}
                                        disabled={submitting}
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
                                    fullWidth
                                    label="Cost Total"
                                    name="total_cost"
                                    type="number"
                                    value={rentalData.total_cost || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting || isNonEditable}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">Lei</InputAdornment>,
                                    }}
                                    error={!!formErrors.total_cost}
                                    helperText={formErrors.total_cost || (
                                        selectedCar && !isNonEditable ?
                                            `Calculat: ${calculatedTotal} Lei (${selectedCar.daily_rate}/zi)` :
                                            ''
                                    )}
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
                                    disabled={submitting}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>
                    Anulează
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submitting || loading}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                    {submitting ? 'Se actualizează...' : 'Actualizează Închirierea'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}