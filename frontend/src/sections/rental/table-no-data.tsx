import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { Iconify } from 'src/components/iconify'; // Assuming you might want an icon

// ----------------------------------------------------------------------

type Props = {
  searchQuery: string;
  colSpan?: number; // Add this line
};

export function TableNoData({ searchQuery, colSpan = 1 }: Props) { // Provide a default colSpan
  return (
    <TableRow>
      <TableCell align="center" colSpan={colSpan} sx={{ height: 200 }}> {/* Use colSpan here */}
        <Paper
          sx={{
            textAlign: 'center',
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          {/* Optional: Add an icon for better visual feedback */}
          <Iconify icon="eva:search-outline" width={64} sx={{ mb: 2, color: 'text.disabled' }} />

          <Typography variant="h6" paragraph>
            Nu s-a găsit
          </Typography>

          <Typography variant="body2">
            Nu s-au găsit rezultate pentru
            <strong>"{searchQuery}"</strong>.
            <br /> Încercați să verificați dacă există greșeli de scriere sau folosiți cuvinte complete.
          </Typography>
        </Paper>
      </TableCell>
    </TableRow>
  );
}