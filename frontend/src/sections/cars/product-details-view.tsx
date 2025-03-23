import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    Grid,
    Divider,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Stack
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { fCurrency } from 'src/utils/format-number';
import { useRouter } from 'src/routes/hooks';

import carsService, { Car } from 'src/services/carsService';
import rentalsService from 'src/services/rentalsService';
import { ProductEdit } from './product-edit';
import toyotaCamryImage from 'src/assets/cars/toyota-camry.jpeg';

export function CarDetailsView() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rentals, setRentals] = useState<any[]>([]);
    const [rentalsLoading, setRentalsLoading] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const carId = parseInt(id || '0', 10);

    // Function to ensure absolute image path
    const getAbsoluteImagePath = (imagePath: string | undefined) => {
        if (!imagePath) return toyotaCamryImage;

        // If the path already starts with http or https, return it as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // If the path doesn't start with /, add it
        if (!imagePath.startsWith('/')) {
            return `/${imagePath}`;
        }

        return imagePath;
    };

    useEffect(() => {
        const fetchCar = async () => {
            if (!carId || isNaN(carId)) {
                setError('Invalid car ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await carsService.getCar(carId);
                setCar(data);

                // Fetch car rentals
                setRentalsLoading(true);
                const rentalsData = await rentalsService.getRentalsForCar(carId);
                setRentals(rentalsData);
                setRentalsLoading(false);
            } catch (err) {
                console.error('Failed to fetch car details:', err);
                setError('Failed to load car details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCar();
    }, [carId]);

    const handleBack = () => {
        router.push('/cars');
    };

    const handleEdit = () => {
        setEditDialogOpen(true);
    };

    const handleCarUpdated = async () => {
        // Refresh car data
        try {
            const data = await carsService.getCar(carId);
            setCar(data);
        } catch (err) {
            console.error('Failed to refresh car data:', err);
        }
    };

    if (loading) {
        return (
            <DashboardContent>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            </DashboardContent>
        );
    }

    if (error || !car) {
        return (
            <DashboardContent>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Car not found'}
                </Alert>
                <Button
                    variant="outlined"
                    startIcon={<Iconify icon="eva:arrow-back-fill" />}
                    onClick={handleBack}
                >
                    Back to Cars
                </Button>
            </DashboardContent>
        );
    }

    const {
        brand,
        model,
        year,
        license_plate,
        color,
        status,
        category,
        daily_rate,
        image_url,
        features,
        created_at,
    } = car;

    // Parse features string into array
    const featuresList = features ? features.split(',').map(f => f.trim()) : [];

    return (
        <DashboardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
                <Box display="flex" alignItems="center">
                    <Button
                        variant="text"
                        startIcon={<Iconify icon="eva:arrow-back-fill" />}
                        onClick={handleBack}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4">{brand} {model} ({year})</Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Iconify icon="eva:edit-fill" />}
                    onClick={handleEdit}
                >
                    Edit Car
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Car Image */}
                <Grid item xs={12} md={6} lg={5}>
                    <Card>
                        <Box sx={{ pt: '100%', position: 'relative' }}>
                            <Box
                                component="img"
                                alt={`${brand} ${model}`}
                                src={getAbsoluteImagePath(image_url)}
                                onError={(e) => {
                                    // Fallback to default image if loading fails
                                    e.currentTarget.src = toyotaCamryImage;
                                }}
                                sx={{
                                    top: 0,
                                    width: 1,
                                    height: 1,
                                    objectFit: 'cover',
                                    position: 'absolute',
                                }}
                            />
                            <Label
                                variant="inverted"
                                color={
                                    status === 'available' ? 'success' :
                                        status === 'rented' ? 'error' : 'warning'
                                }
                                sx={{
                                    zIndex: 9,
                                    top: 16,
                                    right: 16,
                                    position: 'absolute',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {status}
                            </Label>
                        </Box>
                    </Card>
                </Grid>

                {/* Car Details */}
                <Grid item xs={12} md={6} lg={7}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h4" sx={{ mb: 3 }}>
                            {fCurrency(daily_rate)}<Typography component="span" variant="body1">/day</Typography>
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                            License Plate
                                        </Typography>
                                        <Typography variant="body2">{license_plate}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                            Category
                                        </Typography>
                                        <Typography variant="body2">{category}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                            Color
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    bgcolor: color,
                                                    border: '1px solid rgba(145, 158, 171, 0.16)',
                                                    mr: 1,
                                                }}
                                            />
                                            <Typography variant="body2">{color}</Typography>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                            Added on
                                        </Typography>
                                        <Typography variant="body2">
                                            {created_at ? new Date(created_at).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>

                        {/* Features */}
                        {featuresList.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                                    Features
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {featuresList.map((feature, index) => (
                                        <Chip
                                            key={index}
                                            label={feature}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Card>
                </Grid>

                {/* Rental History */}
                <Grid item xs={12}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Rental History</Typography>

                        {rentalsLoading ? (
                            <Box display="flex" justifyContent="center" py={3}>
                                <CircularProgress size={30} />
                            </Box>
                        ) : rentals.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                                No rental history found for this car.
                            </Typography>
                        ) : (
                            <Box sx={{ overflowX: 'auto' }}>
                                <Box sx={{
                                    display: 'table',
                                    width: '100%',
                                    borderSpacing: '0',
                                    borderCollapse: 'collapse'
                                }}>
                                    <Box sx={{ display: 'table-header-group', bgcolor: 'background.neutral' }}>
                                        <Box sx={{ display: 'table-row' }}>
                                            <Box sx={{ display: 'table-cell', p: 2 }}>Customer</Box>
                                            <Box sx={{ display: 'table-cell', p: 2 }}>Start Date</Box>
                                            <Box sx={{ display: 'table-cell', p: 2 }}>End Date</Box>
                                            <Box sx={{ display: 'table-cell', p: 2 }}>Status</Box>
                                            <Box sx={{ display: 'table-cell', p: 2, textAlign: 'right' }}>Cost</Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'table-row-group' }}>
                                        {rentals.map((rental) => (
                                            <Box
                                                key={rental.id}
                                                sx={{
                                                    display: 'table-row',
                                                    '&:not(:last-child)': {
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'table-cell', p: 2 }}>{rental.customer_name}</Box>
                                                <Box sx={{ display: 'table-cell', p: 2 }}>
                                                    {new Date(rental.start_date).toLocaleDateString()}
                                                </Box>
                                                <Box sx={{ display: 'table-cell', p: 2 }}>
                                                    {new Date(rental.end_date).toLocaleDateString()}
                                                </Box>
                                                <Box sx={{ display: 'table-cell', p: 2 }}>
                                                    <Label
                                                        variant="filled"
                                                        color={
                                                            rental.status === 'active' ? 'primary' :
                                                                rental.status === 'completed' ? 'success' :
                                                                    rental.status === 'cancelled' ? 'error' : 'default'
                                                        }
                                                    >
                                                        {rental.status}
                                                    </Label>
                                                </Box>
                                                <Box sx={{ display: 'table-cell', p: 2, textAlign: 'right' }}>
                                                    ${rental.total_cost}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Card>
                </Grid>
            </Grid>

            {car && (
                <ProductEdit
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    carId={car.id}
                    initialDailyRate={car.daily_rate}
                    initialFeatures={car.features || ''}
                    onSave={handleCarUpdated}
                />
            )}
        </DashboardContent>
    );
}