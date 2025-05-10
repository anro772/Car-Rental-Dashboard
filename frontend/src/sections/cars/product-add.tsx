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

const CATEGORIES = ['Sedan', 'SUV', 'Sport', 'Lux', 'Hatchback', 'Break'];

// Color mapping for display and functionality
const COLOR_MAPPING = [
    { value: 'Red', display: 'Roșu', cssColor: 'red' },
    { value: 'Black', display: 'Negru', cssColor: 'black' },
    { value: 'White', display: 'Alb', cssColor: 'white' },
    { value: 'Silver', display: 'Argintiu', cssColor: 'silver' },
    { value: 'Blue', display: 'Albastru', cssColor: 'blue' },
    { value: 'Gray', display: 'Gri', cssColor: 'gray' },
    { value: 'Yellow', display: 'Galben', cssColor: 'yellow' },
    { value: 'Green', display: 'Verde', cssColor: 'green' }
];

// Keep original status values for backend but create a translation map for display
const STATUSES = ['available', 'rented', 'maintenance'] as const;
const STATUS_TRANSLATIONS: Record<string, string> = {
    'available': 'Disponibil',
    'rented': 'Închiriat',
    'maintenance': 'În mentenanță'
};

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
        color: 'Silver', // English color value for backend
        category: 'Sedan',
        daily_rate: 50,
        status: 'available', // Keep English status for backend compatibility
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
            // Status values are in English for backend compatibility
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
                setError('Vă rugăm să completați toate câmpurile obligatorii (Marcă, Model, Număr de Înmatriculare)');
                return;
            }

            setLoading(true);
            setError('');

            // Make a copy of the formData that we'll update
            let updatedFormData = { ...formData };

            // If there's a file to upload, upload it first
            if (fileInputRef.current?.files?.length) {
                const file = fileInputRef.current.files[0];

                try {
                    // Use the uploadCarImage method
                    const filePath = await carsService.uploadCarImage(file, {
                        brand: formData.brand,
                        model: formData.model,
                        year: formData.year,
                        color: formData.color
                    });

                    // Update the formData copy with the path returned from the server
                    updatedFormData = {
                        ...updatedFormData,
                        image_url: filePath
                    };

                    console.log('Uploaded image path:', filePath);
                } catch (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    setError('Nu s-a putut încărca imaginea. Se va continua cu calea implicită pentru imagine.');

                    // If upload fails, generate a consistent path that matches our naming convention
                    const safeBrand = formData.brand.replace(/\s+/g, '-').toLowerCase();
                    const safeModel = formData.model.replace(/\s+/g, '-').toLowerCase();
                    const safeColor = formData.color ? formData.color.replace(/\s+/g, '-').toLowerCase() : '';

                    let defaultPath;
                    if (safeColor) {
                        defaultPath = `src/assets/cars/${safeBrand}-${safeModel}-${formData.year}-${safeColor}.jpeg`;
                    } else {
                        defaultPath = `src/assets/cars/${safeBrand}-${safeModel}-${formData.year}.jpeg`;
                    }

                    updatedFormData = {
                        ...updatedFormData,
                        image_url: defaultPath
                    };

                    console.log('Using default image path:', defaultPath);
                }
            } else if (imagePreview && !formData.image_url) {
                // If we have an image preview but no image_url, generate a path with the same naming convention
                const safeBrand = formData.brand.replace(/\s+/g, '-').toLowerCase();
                const safeModel = formData.model.replace(/\s+/g, '-').toLowerCase();
                const safeColor = formData.color ? formData.color.replace(/\s+/g, '-').toLowerCase() : '';

                let defaultPath;
                if (safeColor) {
                    defaultPath = `src/assets/cars/${safeBrand}-${safeModel}-${formData.year}-${safeColor}.jpeg`;
                } else {
                    defaultPath = `src/assets/cars/${safeBrand}-${safeModel}-${formData.year}.jpeg`;
                }

                updatedFormData = {
                    ...updatedFormData,
                    image_url: defaultPath
                };

                console.log('Using generated image path:', defaultPath);
            }

            // Submit the car data with the updated image_url
            await carsService.createCar(updatedFormData);

            onSave();
            onClose();

            // Reset form
            setFormData({
                brand: '',
                model: '',
                year: new Date().getFullYear(),
                license_plate: '',
                color: 'Silver', // English color value for backend
                category: 'Sedan',
                daily_rate: 50,
                status: 'available', // Keep English status value for backend 
                features: '',
                image_url: ''
            });
            setImagePreview(null);
        } catch (err) {
            console.error('Failed to add car:', err);
            setError('Nu s-a putut adăuga mașina. Vă rugăm să încercați din nou.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Adaugă Mașină Nouă</DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="brand"
                                label="Marcă *"
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
                                label="An"
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
                                label="Număr de Înmatriculare *"
                                value={formData.license_plate}
                                onChange={handleTextChange}
                                fullWidth
                                required
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Culoare</InputLabel>
                                <Select
                                    name="color"
                                    value={formData.color || ''}
                                    onChange={handleSelectChange}
                                    label="Culoare"
                                >
                                    {COLOR_MAPPING.map((colorOption) => (
                                        <MenuItem key={colorOption.value} value={colorOption.value}>
                                            <Box display="flex" alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        bgcolor: colorOption.cssColor,
                                                        borderRadius: '50%',
                                                        mr: 1,
                                                        border: '1px solid #ccc'
                                                    }}
                                                />
                                                {colorOption.display}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Categorie</InputLabel>
                                <Select
                                    name="category"
                                    value={formData.category || ''}
                                    onChange={handleSelectChange}
                                    label="Categorie"
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
                                label="Tarif Zilnic"
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
                                <InputLabel>Stare</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status || ''}
                                    onChange={handleSelectChange}
                                    label="Stare"
                                >
                                    {STATUSES.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {STATUS_TRANSLATIONS[status]}
                                        </MenuItem>
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
                                            alt="Previzualizare mașină"
                                            style={{ maxWidth: '100%', maxHeight: 300, marginBottom: 10 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Faceți clic pentru a schimba imaginea
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <Iconify icon="eva:image-fill" width={48} height={48} color="#aaa" />
                                        <Typography variant="body1" sx={{ mt: 2 }}>
                                            Trageți și plasați o imagine aici sau faceți clic pentru a naviga
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Formate acceptate: JPG, PNG, JPEG, GIF
                                        </Typography>
                                    </>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="features"
                                label="Caracteristici"
                                multiline
                                rows={4}
                                value={formData.features || ''}
                                onChange={handleTextChange}
                                fullWidth
                                placeholder="Enumerați caracteristicile mașinii (ex: Bluetooth, Navigație, Scaune din piele)"
                                helperText="Separați caracteristicile prin virgule"
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
                    Anulează
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Se adaugă mașina...' : 'Adaugă Mașină'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}