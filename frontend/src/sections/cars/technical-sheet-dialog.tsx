// src/sections/cars/technical-sheet-dialog.tsx
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
// import Divider from '@mui/material/Divider'; // Not used
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Iconify } from '../../components/iconify';
import { useRouter } from 'src/routes/hooks';
import carsService, { CarTechnicalSheet, CarTechnicalHistory, TechnicalUpdateData } from 'src/services/carsService';
import { generateTechnicalSheetPDF } from 'src/services/technicalSheetService';

export type TechnicalSheetDialogProps = {
    open: boolean;
    onClose: () => void;
    carId: number;
    carName: string;
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`technical-tabpanel-${index}`}
            aria-labelledby={`technical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const FUEL_TYPE_TRANSLATIONS: Record<string, string> = {
    'benzina': 'Benzină',
    'motorina': 'Motorină',
    'electric': 'Electric',
    'hybrid': 'Hibrid',
    'gpl': 'GPL'
};

const TRANSMISSION_TRANSLATIONS: Record<string, string> = {
    'manual': 'Manuală',
    'automat': 'Automată',
    'semi-automat': 'Semi-automată'
};

const formatDateRo = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return 'N/A';
    }
};

const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
};

const calculateDaysUntilExpiry = (expiryDate: string | undefined): { days: number; status: 'expired' | 'warning' | 'ok' } => {
    if (!expiryDate) return { days: 0, status: 'ok' };
    try {
        const expiry = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { days: Math.abs(diffDays), status: 'expired' };
        if (diffDays <= 30) return { days: diffDays, status: 'warning' };
        return { days: diffDays, status: 'ok' };
    } catch {
        return { days: 0, status: 'ok' };
    }
};

export function TechnicalSheetDialog({
    open,
    onClose,
    carId,
    carName,
}: TechnicalSheetDialogProps) {
    const router = useRouter();
    const [tabValue, setTabValue] = useState(0);
    const [technicalData, setTechnicalData] = useState<CarTechnicalSheet | null>(null);
    const [history, setHistory] = useState<CarTechnicalHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);

    const [editData, setEditData] = useState<TechnicalUpdateData>({});

    const fetchData = async () => {
        if (!open || !carId) return;

        try {
            setLoading(true);
            setError(null);

            const [techData, historyData] = await Promise.all([
                carsService.getTechnicalSheet(carId),
                carsService.getTechnicalHistory(carId)
            ]);

            setTechnicalData(techData);
            setHistory(historyData);

            setEditData({
                kilometers: techData.kilometers,
                fuel_level: techData.fuel_level,
                last_service_date: formatDateForInput(techData.last_service_date),
                last_service_km: techData.last_service_km,
                next_service_km: techData.next_service_km,
                insurance_expiry: formatDateForInput(techData.insurance_expiry),
                itp_expiry: formatDateForInput(techData.itp_expiry),
            });
        } catch (err) {
            console.error('Error fetching technical data:', err);
            setError('Nu s-au putut încărca datele tehnice.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && carId) { // Ensure fetchData is called only when dialog is open and carId is valid
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, carId]); // Removed fetchData from dependencies as it causes infinite loop if not memoized

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSave = async () => {
        if (!technicalData) return;

        try {
            setSaving(true);
            setError(null);

            const dataToSend: TechnicalUpdateData = {
                ...editData,
                admin_id: 1 // Assuming admin_id is 1, replace with actual admin ID from auth context
            };

            // Ensure dates are in YYYY-MM-DD format
            if (dataToSend.last_service_date) {
                dataToSend.last_service_date = dataToSend.last_service_date.split('T')[0];
            }
            if (dataToSend.insurance_expiry) {
                dataToSend.insurance_expiry = dataToSend.insurance_expiry.split('T')[0];
            }
            if (dataToSend.itp_expiry) {
                dataToSend.itp_expiry = dataToSend.itp_expiry.split('T')[0];
            }

            await carsService.updateTechnicalData(carId, dataToSend);

            await fetchData();
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating technical data:', err);
            setError('Nu s-au putut salva modificările.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (technicalData) {
            setEditData({
                kilometers: technicalData.kilometers,
                fuel_level: technicalData.fuel_level,
                last_service_date: formatDateForInput(technicalData.last_service_date),
                last_service_km: technicalData.last_service_km,
                next_service_km: technicalData.next_service_km,
                insurance_expiry: formatDateForInput(technicalData.insurance_expiry),
                itp_expiry: formatDateForInput(technicalData.itp_expiry),
            });
        }
        setIsEditing(false);
    };

    const handleGeneratePDF = async () => {
        if (!technicalData) return;

        try {
            setGeneratingPDF(true);
            const pdfBlob = await generateTechnicalSheetPDF(technicalData, history);

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Fisa_Tehnica_${technicalData.brand}_${technicalData.model}_${technicalData.license_plate}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Nu s-a putut genera fișa tehnică PDF.');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const handleViewRentals = () => {
        router.push(`/rental?car=${carId}`);
        onClose();
    };

    if (!open) return null; // Render nothing if not open

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Fișă Tehnică - {carName}
                    </Typography>
                    <Box>
                        <Tooltip title="Generează PDF">
                            <span>
                                <IconButton
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF || !technicalData || loading}
                                    color="primary"
                                >
                                    {generatingPDF ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <Iconify icon="eva:file-text-outline" />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>
                        <IconButton onClick={onClose}>
                            <Iconify icon="eva:close-fill" />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : technicalData ? (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="technical sheet tabs">
                                <Tab label="Informații Generale" id="technical-tab-0" aria-controls="technical-tabpanel-0" />
                                <Tab label="Stare Curentă" id="technical-tab-1" aria-controls="technical-tabpanel-1" />
                                <Tab label="Documentație" id="technical-tab-2" aria-controls="technical-tabpanel-2" />
                                <Tab label="Istoric" id="technical-tab-3" aria-controls="technical-tabpanel-3" />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabValue} index={0}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardHeader title="Specificații Tehnice" />
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Tip Combustibil:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {FUEL_TYPE_TRANSLATIONS[technicalData.fuel_type || ''] || technicalData.fuel_type || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Motor:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.engine_size || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Transmisie:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {TRANSMISSION_TRANSLATIONS[technicalData.transmission_type || ''] || technicalData.transmission_type || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Locuri:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.seats_count || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Uși:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.doors_count || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Capacitate Rezervor:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.tank_capacity || 'N/A'} {technicalData.fuel_type === 'electric' ? 'kWh' : 'L'}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardHeader title="Informații Vehicul" />
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        VIN:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.vin_number || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Data Înmatriculării:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {formatDateRo(technicalData.registration_date)}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total Închirieri (Estimat):
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.total_rentals || 0}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Ultim KM Înregistrat:
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {technicalData.last_recorded_km || 'N/A'} km
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Card>
                                        <CardHeader
                                            title="Stare Curentă & Service"
                                            action={
                                                !isEditing ? (
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => setIsEditing(true)}
                                                        startIcon={<Iconify icon="eva:edit-outline" />}
                                                    >
                                                        Modifică Date Service/Stare
                                                    </Button>
                                                ) : null
                                            }
                                        />
                                        <CardContent>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <TextField
                                                        label="Kilometraj Curent"
                                                        type="number"
                                                        value={isEditing ? (editData.kilometers ?? '') : technicalData.kilometers ?? ''}
                                                        onChange={(e) => setEditData({ ...editData, kilometers: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                            readOnly: !isEditing,
                                                        }}
                                                        fullWidth
                                                        variant={isEditing ? "outlined" : "filled"}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <TextField
                                                        label="Nivel Combustibil"
                                                        type="number"
                                                        value={isEditing ? (editData.fuel_level ?? '') : technicalData.fuel_level ?? ''}
                                                        onChange={(e) => setEditData({ ...editData, fuel_level: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                            readOnly: !isEditing,
                                                        }}
                                                        inputProps={{ min: 0, max: 100 }}
                                                        fullWidth
                                                        variant={isEditing ? "outlined" : "filled"}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <TextField
                                                        label="Data Ultimului Service"
                                                        type="date"
                                                        value={isEditing ? (editData.last_service_date || '') : formatDateForInput(technicalData.last_service_date)}
                                                        onChange={(e) => setEditData({ ...editData, last_service_date: e.target.value })}
                                                        InputProps={{ readOnly: !isEditing }}
                                                        InputLabelProps={{ shrink: true }}
                                                        fullWidth
                                                        variant={isEditing ? "outlined" : "filled"}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <TextField
                                                        label="KM la Ultimul Service"
                                                        type="number"
                                                        value={isEditing ? (editData.last_service_km ?? '') : technicalData.last_service_km ?? ''}
                                                        onChange={(e) => setEditData({ ...editData, last_service_km: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                            readOnly: !isEditing,
                                                        }}
                                                        fullWidth
                                                        variant={isEditing ? "outlined" : "filled"}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <TextField
                                                        label="Următorul Service la KM"
                                                        type="number"
                                                        value={isEditing ? (editData.next_service_km ?? '') : technicalData.next_service_km ?? ''}
                                                        onChange={(e) => setEditData({ ...editData, next_service_km: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">km</InputAdornment>,
                                                            readOnly: !isEditing,
                                                        }}
                                                        fullWidth
                                                        variant={isEditing ? "outlined" : "filled"}
                                                    />
                                                </Grid>
                                                {isEditing && (
                                                    <Grid item xs={12} sm={6} md={8}>
                                                        <TextField
                                                            label="Note Actualizare (Opțional)"
                                                            multiline
                                                            rows={3}
                                                            value={editData.notes || ''}
                                                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                                            fullWidth
                                                            placeholder="Ex: Schimb ulei, verificare frâne, etc."
                                                        />
                                                    </Grid>
                                                )}
                                            </Grid>

                                            {isEditing && (
                                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Stack direction="row" spacing={2}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={handleCancelEdit}
                                                            disabled={saving}
                                                        >
                                                            Anulează
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <Iconify icon="eva:save-outline" />}
                                                        >
                                                            {saving ? 'Se salvează...' : 'Salvează Modificările'}
                                                        </Button>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Card>
                                        <CardHeader title="Asigurare (RCA)" />
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={isEditing ? 2 : 0}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Expiră la:
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {formatDateRo(isEditing && editData.insurance_expiry ? editData.insurance_expiry : technicalData.insurance_expiry)}
                                                    </Typography>
                                                </Box>
                                                {(isEditing && editData.insurance_expiry ? editData.insurance_expiry : technicalData.insurance_expiry) && (() => {
                                                    const expiryInfo = calculateDaysUntilExpiry(isEditing && editData.insurance_expiry ? editData.insurance_expiry : technicalData.insurance_expiry);
                                                    return (
                                                        <Chip
                                                            label={
                                                                expiryInfo.status === 'expired' ? `Expirat de ${expiryInfo.days} zile` :
                                                                    expiryInfo.status === 'warning' ? `Expiră în ${expiryInfo.days} zile` :
                                                                        `Valabil ${expiryInfo.days} zile`
                                                            }
                                                            color={
                                                                expiryInfo.status === 'expired' ? 'error' :
                                                                    expiryInfo.status === 'warning' ? 'warning' : 'success'
                                                            }
                                                            variant="filled"
                                                        />
                                                    );
                                                })()}
                                            </Box>
                                            {isEditing && (
                                                <TextField
                                                    label="Noua Dată Expirare Asigurare"
                                                    type="date"
                                                    value={editData.insurance_expiry || ''}
                                                    onChange={(e) => setEditData({ ...editData, insurance_expiry: e.target.value })}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Card>
                                        <CardHeader title="Inspecție Tehnică Periodică (ITP)" />
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={isEditing ? 2 : 0}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Expiră la:
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {formatDateRo(isEditing && editData.itp_expiry ? editData.itp_expiry : technicalData.itp_expiry)}
                                                    </Typography>
                                                </Box>
                                                {(isEditing && editData.itp_expiry ? editData.itp_expiry : technicalData.itp_expiry) && (() => {
                                                    const expiryInfo = calculateDaysUntilExpiry(isEditing && editData.itp_expiry ? editData.itp_expiry : technicalData.itp_expiry);
                                                    return (
                                                        <Chip
                                                            label={
                                                                expiryInfo.status === 'expired' ? `Expirat de ${expiryInfo.days} zile` :
                                                                    expiryInfo.status === 'warning' ? `Expiră în ${expiryInfo.days} zile` :
                                                                        `Valabil ${expiryInfo.days} zile`
                                                            }
                                                            color={
                                                                expiryInfo.status === 'expired' ? 'error' :
                                                                    expiryInfo.status === 'warning' ? 'warning' : 'success'
                                                            }
                                                            variant="filled"
                                                        />
                                                    );
                                                })()}
                                            </Box>
                                            {isEditing && (
                                                <TextField
                                                    label="Noua Dată Expirare ITP"
                                                    type="date"
                                                    value={editData.itp_expiry || ''}
                                                    onChange={(e) => setEditData({ ...editData, itp_expiry: e.target.value })}
                                                    InputLabelProps={{ shrink: true }}
                                                    fullWidth
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {isEditing && ( // Show save/cancel only when editing this tab's specific fields
                                    <Grid item xs={12}>
                                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Stack direction="row" spacing={2}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleCancelEdit} // This will reset all edit fields
                                                    disabled={saving}
                                                >
                                                    Anulează Modificările
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleSave} // This will save all edit fields
                                                    disabled={saving}
                                                    startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <Iconify icon="eva:save-outline" />}
                                                >
                                                    {saving ? 'Se salvează...' : 'Salvează Datele Documentației'}
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={3}>
                            <Card>
                                <CardHeader title="Istoric Modificări Tehnice & Service" />
                                <CardContent>
                                    {history.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                                            Nu există istoric de modificări tehnice.
                                        </Typography>
                                    ) : (
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small" aria-label="istoric tehnic">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Data</TableCell>
                                                        <TableCell>Kilometraj</TableCell>
                                                        <TableCell>Combustibil</TableCell>
                                                        <TableCell>Note</TableCell>
                                                        <TableCell>Modificat de</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {history.map((entry) => (
                                                        <TableRow key={entry.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                            <TableCell component="th" scope="row">
                                                                {formatDateRo(entry.created_at)} <Typography variant="caption" display="block">{new Date(entry.created_at).toLocaleTimeString('ro-RO')}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.kilometers != null ? `${entry.kilometers} km` : '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.fuel_level != null ? `${entry.fuel_level}%` : '-'}
                                                            </TableCell>
                                                            <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                                                {entry.notes || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {entry.updated_by_name || `Admin ID: ${entry.updated_by || 'N/A'}`}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </TabPanel>
                    </>
                ) : (
                    <Typography sx={{ p: 3 }}>Nu s-au putut încărca datele tehnice pentru această mașină.</Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} color="inherit">
                    Închide
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleViewRentals}
                    startIcon={<Iconify icon="eva:calendar-outline" />}
                >
                    Vezi închirierile
                </Button>
                <Button
                    variant="contained"
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF || !technicalData || loading}
                    startIcon={generatingPDF ? <CircularProgress color="inherit" size={16} /> : <Iconify icon="eva:download-outline" />}
                >
                    {generatingPDF ? 'Se generează...' : 'Descarcă PDF'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}