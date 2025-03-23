//src/sections/cars/product-add.tsx
import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Paper from '@mui/material/Paper';

import { Iconify } from 'src/components/iconify';
import carsService, { NewCar } from 'src/services/carsService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Default image paths - you can expand this as needed
const CAR_IMAGES = {
    'default': 'src/assets/cars/default-car.jpeg'
};

const CATEGORIES = ['Sedan', 'SUV', 'Sports', 'Luxury', 'Hatchback', 'Wagon'];
const COLORS = ['Red', 'Black', 'White', 'Silver', 'Blue', 'Gray', 'Yellow', 'Green'];
const STATUSES = ['available', 'rented', 'maintenance'] as const;

type ProductAddProps = {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
};

export function ProductAdd({ open, onClose, onSave }: ProductAddProps) {
    const [formData, setFormData] = useState<NewCar>({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        color: 'Silver',
        category: 'Sedan',
        daily_rate: 50,
        status: 'available',
        features: '',
        image_url: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;

        if (name === 'status') {
            const status = value as 'available' | 'rented' | 'maintenance';
            setFormData({
                ...formData,
                status
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });

            // If category changes, suggest a default image
            if (name === 'category' && !formData.image_url) {
                const defaultImage = CAR_IMAGES.default;
                setFormData(prev => ({
                    ...prev,
                    image_url: defaultImage
                }));
            }
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: Number(value)
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setImagePreview(result);

            // Suggest a filename based on car details
            const safeBrand = formData.brand.replace(/\s+/g, '-').toLowerCase() || 'car';
            const safeModel = formData.model.replace(/\s+/g, '-').toLowerCase() || 'model';
            const fileExt = file.name.split('.').pop();
            const suggestedPath = `src/assets/cars/${safeBrand}-${safeModel}.${fileExt}`;

            setFormData(prev => ({
                ...prev,
                image_url: suggestedPath
            }));
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

        // Create a new event to trigger the file input change handler
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(event);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        try {
            // Validate form
            if (!formData.brand || !formData.model || !formData.license_plate) {
                setError('Please fill in all required fields (Brand, Model, License Plate)');
                return;
            }

            setLoading(true);
            setError('');

            // If there's a file to upload, upload it first
            if (fileInputRef.current?.files?.length) {
                const file = fileInputRef.current.files[0];
                const formDataForUpload = new FormData();
                formDataForUpload.append('image', file);
                formDataForUpload.append('brand', formData.brand);
                formDataForUpload.append('model', formData.model);

                try {
                    const response = await axios.post(`${API_URL}/upload`, formDataForUpload);

                    // Update the image_url field with the path returned from the server
                    if (response.data && response.data.filePath) {
                        setFormData(prev => ({
                            ...prev,
                            image_url: response.data.filePath
                        }));
                    }
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    setError('Failed to upload image. Will continue with default image path.');
                    // Continue with car creation even if image upload fails
                }
            }

            // If we have an image preview but no image_url, generate a default path
            if (imagePreview && !formData.image_url) {
                const safeBrand = formData.brand.replace(/\s+/g, '-').toLowerCase();
                const safeModel = formData.model.replace(/\s+/g, '-').toLowerCase();
                setFormData(prev => ({
                    ...prev,
                    image_url: `src/assets/cars/${safeBrand}-${safeModel}.jpeg`
                }));
            }

            // Submit the car data
            await carsService.createCar(formData);

            onSave();
            onClose();

            // Reset form
            setFormData({
                brand: '',
                model: '',
                year: new Date().getFullYear(),
                license_plate: '',
                color: 'Silver',
                category: 'Sedan',
                daily_rate: 50,
                status: 'available',
                features: '',
                image_url: ''
            });
            setImagePreview(null);
        } catch (err) {
            console.error('Failed to add car:', err);
            setError('Failed to add car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add New Car</DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="brand"
                                label="Brand *"
                                value={formData.brand}
                                onChange={handleTextChange}
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="model"
                                label="Model *"
                                value={formData.model}
                                onChange={handleTextChange}
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="year"
                                label="Year"
                                type="number"
                                value={formData.year}
                                onChange={handleNumberChange}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="license_plate"
                                label="License Plate *"
                                value={formData.license_plate}
                                onChange={handleTextChange}
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Color</InputLabel>
                                <Select
                                    name="color"
                                    value={formData.color || ''}
                                    onChange={handleSelectChange}
                                    label="Color"
                                >
                                    {COLORS.map((color) => (
                                        <MenuItem key={color} value={color}>
                                            <Box display="flex" alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        bgcolor: color.toLowerCase(),
                                                        borderRadius: '50%',
                                                        mr: 1,
                                                        border: '1px solid #ccc'
                                                    }}
                                                />
                                                {color}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    name="category"
                                    value={formData.category || ''}
                                    onChange={handleSelectChange}
                                    label="Category"
                                >
                                    {CATEGORIES.map((category) => (
                                        <MenuItem key={category} value={category}>{category}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="daily_rate"
                                label="Daily Rate"
                                type="number"
                                value={formData.daily_rate}
                                onChange={handleNumberChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status || ''}
                                    onChange={handleSelectChange}
                                    label="Status"
                                >
                                    {STATUSES.map((status) => (
                                        <MenuItem key={status} value={status}>{status}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Image upload section */}
                        <Grid item xs={12}>
                            <Paper
                                sx={{
                                    border: '2px dashed #ccc',
                                    p: 3,
                                    textAlign: 'center',
                                    mb: 2,
                                    cursor: 'pointer',
                                    height: imagePreview ? 'auto' : 200,
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

                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Car preview"
                                            style={{ maxWidth: '100%', maxHeight: 300, marginBottom: 10 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Click to change image
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

                            <TextField
                                name="image_url"
                                label="Image Path"
                                value={formData.image_url || ''}
                                onChange={handleTextChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                placeholder="src/assets/cars/your-filename.jpg"
                                helperText="Path where the image should be saved"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="features"
                                label="Features"
                                multiline
                                rows={4}
                                value={formData.features || ''}
                                onChange={handleTextChange}
                                fullWidth
                                placeholder="List car features (e.g., Bluetooth, Navigation, Leather seats)"
                                helperText="Separate features with commas"
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                    </Grid>

                    {error && (
                        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Adding Car...' : 'Add Car'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}