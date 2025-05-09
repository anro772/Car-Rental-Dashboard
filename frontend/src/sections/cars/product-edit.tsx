//src/sections/cars/product-edit.tsx
import { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import carsService from 'src/services/carsService';
import { Iconify } from 'src/components/iconify';

type ProductEditProps = {
    open: boolean;
    onClose: () => void;
    carId: number;
    initialDailyRate: number;
    initialFeatures: string;
    onSave: () => void;
};

// Car categories based on screenshot
const CAR_CATEGORIES = [
    'Sedan',
    'SUV',
    'Sports',
    'Luxury',
    'Hatchback',
    'Wagon'
];

// Car colors based on screenshot
const CAR_COLORS = [
    'Red',
    'Black',
    'White',
    'Silver',
    'Blue',
    'Gray',
    'Yellow',
    'Green'
];

// Car status options
const CAR_STATUSES = [
    { value: 'available', label: 'Functioning' },
    { value: 'maintenance', label: 'Maintenance' },
];

export function ProductEdit({
    open,
    onClose,
    carId,
    initialDailyRate,
    initialFeatures,
    onSave,
}: ProductEditProps) {
    const [dailyRate, setDailyRate] = useState(initialDailyRate);
    const [features, setFeatures] = useState(initialFeatures || '');
    const [category, setCategory] = useState('');
    const [color, setColor] = useState('');
    const [status, setStatus] = useState<'available' | 'rented' | 'maintenance' | 'pending'>('available');
    const [imageUrl, setImageUrl] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [year, setYear] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [previewImage, setPreviewImage] = useState('');
    const [brand, setBrand] = useState('');  // Added brand state
    const [model, setModel] = useState('');  // Added model state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);

    // Get current year for validation
    const currentYear = new Date().getFullYear();

    // Fetch car details when the dialog opens
    useEffect(() => {
        if (open && carId) {
            const fetchCarDetails = async () => {
                try {
                    setFetching(true);
                    const car = await carsService.getCar(carId);
                    setBrand(car.brand || '');
                    setModel(car.model || '');
                    setCategory(car.category || '');
                    setColor(car.color || '');
                    setStatus(car.status || 'available' as 'available' | 'rented' | 'maintenance' | 'pending'); setImageUrl(car.image_url || '');
                    setLicensePlate(car.license_plate || '');
                    setYear(car.year || '');
                    setPreviewImage(car.image_url || '');
                } catch (err) {
                    console.error('Failed to fetch car details:', err);
                    setError('Failed to load car details. Some values may be missing.');
                } finally {
                    setFetching(false);
                }
            };

            fetchCarDetails();
        }
    }, [open, carId]);

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            let updatedImageUrl = imageUrl;

            // If there's a file to upload, upload it first
            if (uploadedImage) {
                try {
                    // Upload the image with the car details
                    const filePath = await carsService.uploadCarImage(uploadedImage, {
                        brand,
                        model,
                        year: typeof year === 'number' ? year : currentYear,
                        color
                    });

                    // Update the image URL with the path returned from the server
                    updatedImageUrl = filePath;
                    console.log('Uploaded image path:', filePath);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    setError('Failed to upload image. Will continue with existing image.');
                }
            }

            // Update the current car
            await carsService.patchCar(carId, {
                daily_rate: dailyRate,
                features,
                category,
                color,
                status,
                image_url: updatedImageUrl,
                license_plate: licensePlate,
                year: typeof year === 'number' ? year : undefined
            });

            // If image URL has changed, update all other cars with the same brand, model, and year
            if (updatedImageUrl !== imageUrl && updatedImageUrl) {
                try {
                    console.log('Updating image for all similar cars');
                    await carsService.updateSimilarCarsImages({
                        brand,
                        model,
                        year: typeof year === 'number' ? year : currentYear,
                        imageUrl: updatedImageUrl
                    });
                } catch (updateError) {
                    console.error('Failed to update similar cars:', updateError);
                    // Continue even if updating similar cars fails
                }
            }

            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to update car:', err);
            setError('Failed to update car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setImageUrl(url);
        setPreviewImage(url);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setYear('');
        } else {
            const yearValue = parseInt(value, 10);
            if (!isNaN(yearValue)) {
                setYear(yearValue);
            }
        }
    };

    // Image handling functions
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Store the file for later upload
        setUploadedImage(file);

        // Create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreviewImage(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Store the file for later upload
        setUploadedImage(file);

        // Create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreviewImage(result);
        };
        reader.readAsDataURL(file);
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // Get color for color indicator
    const getColorHex = (colorName: string): string => {
        const colorMap: Record<string, string> = {
            'Red': '#FF0000',
            'Black': '#000000',
            'White': '#FFFFFF',
            'Silver': '#C0C0C0',
            'Blue': '#0000FF',
            'Gray': '#808080',
            'Yellow': '#FFFF00',
            'Green': '#008000',
        };
        return colorMap[colorName] || '#000000';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Car Details</DialogTitle>

            <DialogContent>
                {fetching ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            {/* First column */}
                            <Grid item xs={12} md={7}>
                                <Grid container spacing={2}>
                                    {/* Display brand and model (read-only) */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Brand"
                                            value={brand}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                readOnly: true,
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Model"
                                            value={model}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                readOnly: true,
                                            }}
                                        />
                                    </Grid>

                                    {/* License Plate */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="License Plate"
                                            value={licensePlate}
                                            onChange={(e) => setLicensePlate(e.target.value)}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                            inputProps={{ maxLength: 10 }}
                                        />
                                    </Grid>

                                    {/* Year */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Year"
                                            type="number"
                                            value={year}
                                            onChange={handleYearChange}
                                            fullWidth
                                            sx={{ mb: 2 }}
                                            inputProps={{
                                                min: 1900,
                                                max: currentYear + 1,
                                                step: 1
                                            }}
                                            error={typeof year === 'number' && (year < 1900 || year > currentYear + 1)}
                                            helperText={
                                                typeof year === 'number' && (year < 1900 || year > currentYear + 1)
                                                    ? `Year must be between 1900 and ${currentYear + 1}`
                                                    : ''
                                            }
                                        />
                                    </Grid>
                                </Grid>

                                <TextField
                                    label="Daily Rate"
                                    type="number"
                                    value={dailyRate}
                                    onChange={(e) => setDailyRate(Number(e.target.value))}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ mb: 3 }}
                                />

                                {/* Category selection */}
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel id="category-label">Category</InputLabel>
                                    <Select
                                        labelId="category-label"
                                        value={category}
                                        label="Category"
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {CAR_CATEGORIES.map((cat) => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Color selection */}
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel id="color-label">Color</InputLabel>
                                    <Select
                                        labelId="color-label"
                                        value={color}
                                        label="Color"
                                        onChange={(e) => setColor(e.target.value)}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: '50%',
                                                        backgroundColor: getColorHex(selected),
                                                        border: selected === 'White' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                                                        mr: 1
                                                    }}
                                                />
                                                {selected}
                                            </Box>
                                        )}
                                    >
                                        {CAR_COLORS.map((colorOption) => (
                                            <MenuItem key={colorOption} value={colorOption}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: '50%',
                                                            backgroundColor: getColorHex(colorOption),
                                                            border: colorOption === 'White' ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                                                            mr: 1
                                                        }}
                                                    />
                                                    {colorOption}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Status selection */}
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel id="status-label">Status</InputLabel>
                                    <Select
                                        labelId="status-label"
                                        value={status}
                                        label="Status"
                                        onChange={(e) => setStatus(e.target.value as 'available' | 'rented' | 'maintenance' | 'pending')}                                    >
                                        {CAR_STATUSES.map((statusOption) => (
                                            <MenuItem key={statusOption.value} value={statusOption.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            mr: 1,
                                                            bgcolor:
                                                                statusOption.value === 'available' ? 'success.main' :
                                                                    statusOption.value === 'rented' ? 'error.main' :
                                                                        statusOption.value === 'pending' ? 'warning.main' :
                                                                            statusOption.value === 'maintenance' ? 'warning.main' : 'info.main'
                                                        }}
                                                    />
                                                    {statusOption.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Image URL */}
                                <TextField
                                    label="Image URL"
                                    value={imageUrl}
                                    onChange={handleImageUrlChange}
                                    fullWidth
                                    placeholder="src/assets/cars/brand-model-year-color.jpg"
                                    helperText="Current image path (will be updated if you upload a new image)"
                                    sx={{ mb: 3 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Iconify icon="eva:image-fill" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Second column for image preview and upload */}
                            <Grid item xs={12} md={5}>
                                {/* Image Upload */}
                                <Paper
                                    sx={{
                                        border: '2px dashed #ccc',
                                        p: 3,
                                        textAlign: 'center',
                                        mb: 2,
                                        cursor: 'pointer',
                                        height: previewImage ? 'auto' : 200,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: '#f8f9fa'
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={handleBrowseClick}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                    />

                                    {previewImage ? (
                                        <>
                                            <img
                                                src={previewImage}
                                                alt="Car preview"
                                                style={{ maxWidth: '100%', maxHeight: 200, marginBottom: 10 }}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                Click to {uploadedImage ? 'change' : 'update'} image
                                            </Typography>
                                            <Typography variant="caption" color="info.main" sx={{ mt: 1 }}>
                                                Note: Updating this image will update all {brand} {model} ({year}) cars
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <Iconify icon="eva:image-fill" width={48} height={48} color="#aaa" />
                                            <Typography variant="body1" sx={{ mt: 2 }}>
                                                Drag & drop an image here or click to browse
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Supported formats: JPG, PNG, JPEG, GIF
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            </Grid>

                            {/* Features area spans both columns */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Features"
                                    multiline
                                    rows={4}
                                    value={features}
                                    onChange={(e) => setFeatures(e.target.value)}
                                    fullWidth
                                    placeholder="List car features (e.g., Bluetooth, Navigation, Leather seats)"
                                    helperText="Separate features with commas"
                                />
                            </Grid>
                        </Grid>

                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading || fetching}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading || fetching}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}