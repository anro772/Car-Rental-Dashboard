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
import Select, { SelectChangeEvent } from '@mui/material/Select'; // Import SelectChangeEvent
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';

import { Iconify } from 'src/components/iconify';

import rentalsService, { NewRental } from 'src/services/rentalsService';
import carsService, { Car } from 'src/services/carsService';
import customersService, { Customer } from 'src/services/customersService';

// ----------------------------------------------------------------------

type RentalAddModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    customerId?: number | null;
};

export function RentalAddModal({ open, onClose, onSuccess, customerId = null }: RentalAddModalProps) {
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Available data for dropdowns
    const [cars, setCars] = useState<Car[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Form data
    const [rentalData, setRentalData] = useState<Partial<NewRental>>({
        status: 'pending',
        payment_status: 'unpaid',
        customer_id: customerId || undefined
    });

    // Calculate fields
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Reset form when opening modal
    useEffect(() => {
        if (open) {
            // Get current date and 3 days from now
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);

            // Format dates as YYYY-MM-DD
            const formatDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            setRentalData({
                status: 'pending',
                payment_status: 'unpaid',
                customer_id: customerId || undefined,
                start_date: formatDate(today),
                end_date: formatDate(threeDaysLater)
            });
            setError('');
            setFormErrors({});

            // Fetch data
            fetchCarsAndCustomers();
        }
    }, [open, customerId]);

    // Load cars and customers
    const fetchCarsAndCustomers = async () => {
        try {
            setLoading(true);

            // Fetch available cars
            const carsData = await carsService.getAvailableCars();
            setCars(carsData);

            // Fetch active customers
            const customersData = await customersService.getActiveCustomers();
            setCustomers(customersData);

            setError('');
        } catch (err) {
            console.error('Failed to load data:', err);
            setError('Failed to load cars and customers data.');
        } finally {
            setLoading(false);
        }
    };

    // Update selected car when car_id changes
    useEffect(() => {
        if (rentalData.car_id) {
            const car = cars.find(c => c.id === rentalData.car_id);
            setSelectedCar(car || null);
        } else {
            setSelectedCar(null);
        }
    }, [rentalData.car_id, cars]);

    // Calculate total cost when dates or car changes
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

                // Update total_cost in the form data
                setRentalData(prev => ({
                    ...prev,
                    total_cost: total
                }));
            } catch (err) {
                console.error('Failed to calculate total:', err);
            }
        }
    }, [selectedCar, rentalData.start_date, rentalData.end_date]);

    // Separate handlers for different input types
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setRentalData(prev => ({
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

    const handleSelectChange = (e: SelectChangeEvent<unknown>) => {
        const { name, value } = e.target;

        if (name) {
            setRentalData(prev => ({
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
        }
    };

    const handleDateChange = (field: 'start_date' | 'end_date', dateString: string) => {
        setRentalData(prev => ({
            ...prev,
            [field]: dateString
        }));

        // Clear error when field is changed
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!rentalData.car_id) {
            errors.car_id = 'Car is required';
        }

        if (!rentalData.customer_id) {
            errors.customer_id = 'Customer is required';
        }

        if (!rentalData.start_date) {
            errors.start_date = 'Start date is required';
        }

        if (!rentalData.end_date) {
            errors.end_date = 'End date is required';
        } else if (rentalData.start_date && rentalData.end_date) {
            const start = new Date(rentalData.start_date);
            const end = new Date(rentalData.end_date);

            if (end < start) {
                errors.end_date = 'End date must be after start date';
            }
        }

        if (!rentalData.total_cost || rentalData.total_cost <= 0) {
            errors.total_cost = 'Total cost is required and must be greater than 0';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            await rentalsService.createRental(rentalData as NewRental);

            // Close modal and trigger refresh
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to create rental:', err);
            if (err.response?.data?.error?.includes('Car is already booked')) {
                setError('This car is already booked during the selected dates.');
            } else {
                setError('Failed to create rental. Please check your input and try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                New Rental
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

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box component="form" sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            {/* Car Selection */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!formErrors.car_id}>
                                    <InputLabel id="car-label">Car</InputLabel>
                                    <Select
                                        labelId="car-label"
                                        name="car_id"
                                        value={rentalData.car_id || ''}
                                        label="Car"
                                        onChange={handleSelectChange}
                                        disabled={submitting}
                                    >
                                        {cars.map((car) => (
                                            <MenuItem key={car.id} value={car.id}>
                                                {car.brand} {car.model} - {car.license_plate} (${car.daily_rate}/day)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.car_id && (
                                        <FormHelperText>{formErrors.car_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Customer Selection */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth error={!!formErrors.customer_id}>
                                    <InputLabel id="customer-label">Customer</InputLabel>
                                    <Select
                                        labelId="customer-label"
                                        name="customer_id"
                                        value={rentalData.customer_id || ''}
                                        label="Customer"
                                        onChange={handleSelectChange}
                                        disabled={submitting || !!customerId}
                                    >
                                        {customers.map((customer) => (
                                            <MenuItem key={customer.id} value={customer.id}>
                                                {customer.first_name} {customer.last_name} - {customer.email}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.customer_id && (
                                        <FormHelperText>{formErrors.customer_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Grid>

                            {/* Date Range - using simple text fields instead of DatePicker to avoid date-fns dependency */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Start Date"
                                    name="start_date"
                                    type="date"
                                    value={rentalData.start_date || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                    InputLabelProps={{ shrink: true }}
                                    error={!!formErrors.start_date}
                                    helperText={formErrors.start_date}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="End Date"
                                    name="end_date"
                                    type="date"
                                    value={rentalData.end_date || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting}
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
                                        disabled={submitting}
                                    >
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="active">Active</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="payment-status-label">Payment Status</InputLabel>
                                    <Select
                                        labelId="payment-status-label"
                                        name="payment_status"
                                        value={rentalData.payment_status || 'unpaid'}
                                        label="Payment Status"
                                        onChange={handleSelectChange}
                                        disabled={submitting}
                                    >
                                        <MenuItem value="unpaid">Unpaid</MenuItem>
                                        <MenuItem value="partial">Partial</MenuItem>
                                        <MenuItem value="paid">Paid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Total Cost and Notes */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Total Cost"
                                    name="total_cost"
                                    type="number"
                                    value={rentalData.total_cost || ''}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    error={!!formErrors.total_cost}
                                    helperText={formErrors.total_cost || (
                                        selectedCar ? `Calculated: $${calculatedTotal} (${selectedCar.daily_rate}/day)` : ''
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Notes"
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
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={submitting || loading}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                    {submitting ? 'Creating...' : 'Create Rental'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}