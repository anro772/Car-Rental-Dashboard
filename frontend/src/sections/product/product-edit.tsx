import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import carsService from 'src/services/carsService';

type ProductEditProps = {
    open: boolean;
    onClose: () => void;
    carId: number;
    initialDailyRate: number;
    initialFeatures: string;
    onSave: () => void;
};

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            await carsService.patchCar(carId, {
                daily_rate: dailyRate,
                features,
            });

            onSave();
            onClose();
        } catch (err) {
            console.error('Failed to update car:', err);
            setError('Failed to update car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Car Details</DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
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
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}