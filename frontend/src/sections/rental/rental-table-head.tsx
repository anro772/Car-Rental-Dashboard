// src/sections/rental/rental-table-head.tsx
import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const visuallyHidden = {
    border: 0,
    margin: -1,
    padding: 0,
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
    clip: 'rect(0 0 0 0)',
} as const;

// ----------------------------------------------------------------------

type Props = {
    order: 'asc' | 'desc';
    orderBy: string;
    rowCount: number;
    headLabel: any[];
    numSelected: number;
    onSort: (id: string) => void;
    onSelectAllRows: (checked: boolean) => void;
};

export function RentalTableHead({
    order,
    orderBy,
    rowCount,
    headLabel,
    numSelected,
    onSort,
    onSelectAllRows,
}: Props) {
    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={(event) => onSelectAllRows(event.target.checked)}
                    />
                </TableCell>

                {headLabel.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.align || 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{ width: headCell.width, minWidth: headCell.minWidth }}
                    >
                        <TableSortLabel
                            hideSortIcon
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={() => onSort(headCell.id)}
                        >
                            {/* Add car color icon to the Car column */}
                            {headCell.id === 'car' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {headCell.label}
                                    <Box component="span" sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                        <Iconify icon="mdi:car-sports" width={16} height={16} />
                                    </Box>
                                </Box>
                            ) : (
                                headCell.label
                            )}

                            {orderBy === headCell.id ? (
                                <Box sx={{ ...visuallyHidden }}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </Box>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}