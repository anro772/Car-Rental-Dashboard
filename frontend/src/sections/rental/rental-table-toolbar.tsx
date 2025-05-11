//src/sections/rental/rental-table-toolbar.tsx
import { useState } from 'react';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';
import { RentalExtended } from 'src/services/rentalsService';
import { fDate } from 'src/utils/format-time';

// Translation mappings for CSV export
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

type Props = {
    numSelected: number;
    filterName: string;
    onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
    selectedIds?: string[];
    onExportCSV?: () => void;
    rentals?: RentalExtended[]; // Added prop for direct access to rentals data
};

export function RentalTableToolbar({
    numSelected,
    filterName,
    onFilterName,
    onBulkDelete,
    selectedIds = [],
    onExportCSV,
    rentals = []
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'info' | 'warning'
    });

    const handleOpenConfirmDelete = () => {
        setConfirmDelete(true);
    };

    const handleCloseConfirmDelete = () => {
        setConfirmDelete(false);
    };

    const handleConfirmDelete = async () => {
        if (!onBulkDelete) return;

        try {
            setDeleting(true);
            await onBulkDelete(selectedIds);
            handleCloseConfirmDelete();
        } catch (error) {
            console.error('Eroare la ștergerea închirierilor:', error);
            showSnackbar('Nu s-au putut șterge închirierile selectate.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleExportCSV = () => {
        try {
            // Get selected rentals or use all rentals if none selected
            const selectedRentals = selectedIds.length > 0
                ? rentals.filter(rental => selectedIds.includes(rental.id.toString()))
                : rentals;

            if (selectedRentals.length === 0) {
                showSnackbar('Nu există date pentru export.', 'warning');
                return;
            }

            // Define CSV headers
            const headers = [
                'ID',
                'Mașină',
                'Model',
                'Culoare',
                'Număr înmatriculare',
                'ID Client',
                'Nume client',
                'Email client',
                'Data început',
                'Data sfârșit',
                'Zile',
                'Zile întârziere',
                'Status',
                'Status plată',
                'Cost total',
                'Cost/zi',
                'Note'
            ];

            // Map rental data to CSV rows with translated status values
            const rows = selectedRentals.map(rental => {
                // Calculate rental duration in days
                const startDate = new Date(rental.start_date);
                const endDate = new Date(rental.end_date);
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                // Calculate daily rate
                const dailyRate = rental.total_cost && days ? (rental.total_cost / days).toFixed(2) : 'N/A';

                // Format dates properly for Excel (DD.MM.YYYY) - Romanian format
                const formattedStartDate = startDate.getDate().toString().padStart(2, '0') + '.' +
                    (startDate.getMonth() + 1).toString().padStart(2, '0') + '.' +
                    startDate.getFullYear();
                const formattedEndDate = endDate.getDate().toString().padStart(2, '0') + '.' +
                    (endDate.getMonth() + 1).toString().padStart(2, '0') + '.' +
                    endDate.getFullYear();

                return [
                    rental.id,
                    rental.brand || '',
                    rental.model || '',
                    rental.color || '',
                    rental.license_plate || '',
                    rental.customer_id || '',
                    rental.customer_name || '',
                    rental.customer_email || '',
                    formattedStartDate,
                    formattedEndDate,
                    days,
                    rental.days_overdue || 0,
                    STATUS_TRANSLATIONS[rental.status as keyof typeof STATUS_TRANSLATIONS] || rental.status,
                    PAYMENT_STATUS_TRANSLATIONS[rental.payment_status as keyof typeof PAYMENT_STATUS_TRANSLATIONS] || rental.payment_status,
                    rental.total_cost || 0,
                    dailyRate,
                    (rental.notes || '').replace(/;/g, ',').replace(/\n/g, ' ') // Replace semicolons and newlines
                ].map(value => {
                    // Wrap values containing semicolons in quotes and escape existing quotes
                    const stringValue = String(value);
                    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
            });

            // Use Excel's Text Import Wizard formatting - create HTML table instead
            let excelHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            excelHtml += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Închirieri</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
            excelHtml += '<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head>';
            excelHtml += '<body><table>';

            // Add header row
            excelHtml += '<tr>';
            headers.forEach(header => {
                excelHtml += `<th style="font-weight: bold;">${header}</th>`;
            });
            excelHtml += '</tr>';

            // Add data rows
            rows.forEach(row => {
                excelHtml += '<tr>';
                row.forEach(cell => {
                    excelHtml += `<td>${cell}</td>`;
                });
                excelHtml += '</tr>';
            });

            excelHtml += '</table></body></html>';

            // Create and trigger download as .xls file
            const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            // Create filename with date and selection info
            const today = new Date().toISOString().split('T')[0];
            const filenameSuffix = selectedIds.length > 0 ? `_selectate_${selectedIds.length}` : '_toate';
            link.setAttribute('href', url);
            link.setAttribute('download', `inchirieri${filenameSuffix}_${today}.xls`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up and show success message
            URL.revokeObjectURL(url);
            showSnackbar('Export finalizat cu succes!', 'success');
        } catch (err) {
            console.error('Eroare la exportul datelor:', err);
            showSnackbar('Exportul datelor a eșuat', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
    };

    return (
        <>
            <Toolbar
                sx={{
                    height: 96,
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: (theme) => theme.spacing(0, 1, 0, 3),
                    ...(numSelected > 0 && {
                        color: 'primary.main',
                        bgcolor: 'primary.lighter',
                    }),
                }}
            >
                {numSelected > 0 ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1">
                            {numSelected} selectate
                        </Typography>
                        <Tooltip title="Șterge închirierile selectate">
                            <Button
                                color="error"
                                variant="contained"
                                startIcon={<Iconify icon="eva:trash-2-outline" />}
                                onClick={handleOpenConfirmDelete}
                            >
                                Șterge
                            </Button>
                        </Tooltip>

                        <Tooltip title="Exportă selectate în format CSV">
                            <Button
                                color="primary"
                                variant="contained"
                                startIcon={<Iconify icon="mdi:file-export" />}
                                onClick={handleExportCSV}
                            >
                                Exportă CSV
                            </Button>
                        </Tooltip>
                    </Stack>
                ) : (
                    <OutlinedInput
                        value={filterName}
                        onChange={onFilterName}
                        placeholder="Caută închiriere..."
                        startAdornment={
                            <InputAdornment position="start">
                                <Iconify
                                    icon="eva:search-fill"
                                    sx={{ color: 'text.disabled', width: 20, height: 20 }}
                                />
                            </InputAdornment>
                        }
                    />
                )}

                {numSelected === 0 && (
                    <Tooltip title="Exportă toate închirierile în format CSV">
                        <Button
                            color="primary"
                            variant="outlined"
                            startIcon={<Iconify icon="mdi:file-export" />}
                            onClick={() => handleExportCSV()}
                            sx={{ ml: 1 }}
                        >
                            Exportă Toate
                        </Button>
                    </Tooltip>
                )}
            </Toolbar>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDelete} onClose={handleCloseConfirmDelete}>
                <DialogTitle>Confirmă Ștergerea</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sigur doriți să ștergeți {numSelected} închiriere{numSelected > 1 ? '' : 'a'}?
                        Această acțiune nu poate fi anulată.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDelete} disabled={deleting}>
                        Anulează
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : null}
                    >
                        {deleting ? 'Se șterge...' : 'Șterge'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}