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

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
    numSelected: number;
    filterName: string;
    onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
    selectedIds?: string[];
    onExportCSV?: () => void;
};

export function RentalTableToolbar({
    numSelected,
    filterName,
    onFilterName,
    onBulkDelete,
    selectedIds = [],
    onExportCSV
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
            console.error('Failed to delete rentals:', error);
        } finally {
            setDeleting(false);
        }
    };

    return (
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
                        {numSelected} selected
                    </Typography>
                    <Tooltip title="Delete">
                        <Button
                            color="error"
                            variant="contained"
                            startIcon={<Iconify icon="eva:trash-2-outline" />}
                            onClick={handleOpenConfirmDelete}
                        >
                            Delete
                        </Button>
                    </Tooltip>

                    <Tooltip title="Export to CSV">
                        <Button
                            color="primary"
                            variant="contained"
                            startIcon={<Iconify icon="mdi:file-export" />}
                            onClick={onExportCSV}
                        >
                            Export CSV
                        </Button>
                    </Tooltip>
                </Stack>
            ) : (
                <OutlinedInput
                    value={filterName}
                    onChange={onFilterName}
                    placeholder="Search rental..."
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

            {/* Confirmation Dialog */}
            <Dialog open={confirmDelete} onClose={handleCloseConfirmDelete}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {numSelected} rental{numSelected > 1 ? 's' : ''}?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDelete} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : null}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Toolbar>
    );
}