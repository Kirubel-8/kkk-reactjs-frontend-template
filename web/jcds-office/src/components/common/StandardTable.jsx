import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

/**
 * Renders a reusable styled table with teal header, rounded rows, sorting, and pagination.
 */
const StandardTable = ({
  columns,
  rows,
  getRowId = (row, index) => row.id ?? index,
  loading = false,
  emptyMessage = 'No records found',
  initialSort,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalCount,
  enablePagination = true,
  rowsPerPageOptions = [5, 10, 25, 50],
}) => {
  const theme = useTheme();
  const [sortConfig, setSortConfig] = useState(initialSort || { id: null, direction: 'asc' });
  const [internalPage, setInternalPage] = useState(page ?? 0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage ?? rowsPerPageOptions[0]);

  useEffect(() => {
    if (page !== undefined) setInternalPage(page);
  }, [page]);

  useEffect(() => {
    if (rowsPerPage !== undefined) setInternalRowsPerPage(rowsPerPage);
  }, [rowsPerPage]);

  const effectivePage = page ?? internalPage;
  const effectiveRowsPerPage = rowsPerPage ?? internalRowsPerPage;
  const effectiveTotal = totalCount ?? rows.length;

  const sortedRows = useMemo(() => {
    if (!sortConfig.id) return rows;
    const sorted = [...rows].sort((a, b) => {
      const aValue = a[sortConfig.id];
      const bValue = b[sortConfig.id];
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, sortConfig]);

  const pagedRows = useMemo(() => {
    if (!enablePagination) return sortedRows;
    if (effectiveRowsPerPage === undefined || effectivePage === undefined) return sortedRows;
    const start = effectivePage * effectiveRowsPerPage;
    return sortedRows.slice(start, start + effectiveRowsPerPage);
  }, [sortedRows, enablePagination, effectiveRowsPerPage, effectivePage]);

  const handleSort = (columnId, sortable) => {
    if (!sortable) return;
    setSortConfig(prev => {
      if (prev.id === columnId) {
        const nextDirection = prev.direction === 'asc' ? 'desc' : 'asc';
        return { id: columnId, direction: nextDirection };
      }
      return { id: columnId, direction: 'asc' };
    });
  };

  const handlePageChange = (event, newPage) => {
    if (onPageChange) onPageChange(event, newPage);
    else setInternalPage(newPage);
  };

  const handleRowsPerPageChange = event => {
    const next = parseInt(event.target.value, 10);
    if (onRowsPerPageChange) onRowsPerPageChange(event, next);
    else {
      setInternalRowsPerPage(next);
      setInternalPage(0);
    }
  };

  return (
    <Paper
		 id="standard-table"
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        width: '100%',
      }}
    >
      <TableContainer sx={{ width: '100%' }}>
        <Table
          sx={{
            width: '100%',
            tableLayout: 'auto',
            borderCollapse: 'separate',
            borderSpacing: '0 10px',
          }}
          aria-label="standard table"
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: theme.palette.primary.main,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                borderRadius: 2,
                '& th:first-of-type': {
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                },
                '& th:last-of-type': {
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                },
              }}
            >
              {columns.map((column, idx) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    color: theme.palette.primary.contrastText,
                    fontWeight: 700,
                    fontSize: 14,
                    py: 2,
                    px: 2.5,
                    borderBottom: 'none',
                    borderTopLeftRadius: idx === 0 ? 10 : 0,
                    borderTopRightRadius: idx === columns.length - 1 ? 10 : 0,
                    width: column.width,
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}
                  sortDirection={sortConfig.id === column.id ? sortConfig.direction : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig.id === column.id}
                      direction={sortConfig.id === column.id ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(column.id, column.sortable)}
                      sx={{
                        color: theme.palette.primary.contrastText,
                        '&.Mui-active': { color: theme.palette.primary.contrastText },
                        '& .MuiTableSortLabel-icon': { color: `${theme.palette.primary.contrastText} !important` },
                        textTransform: 'capitalize',
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pagedRows.map((row, rowIndex) => (
                <TableRow
                  hover
                  key={getRowId(row, rowIndex)}
                  sx={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    borderRadius: 2,
                    '& td': { borderBottom: 'none' },
                    '& td:first-of-type': {
                      borderTopLeftRadius: 10,
                      borderBottomLeftRadius: 10,
                    },
                    '& td:last-of-type': {
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                    },
                  }}
                >
                  {columns.map(column => (
                    <TableCell
                      key={`${column.id}-${getRowId(row, rowIndex)}`}
                      align={column.align || 'left'}
                      sx={{
                        fontSize: 14,
                        py: 2,
                        px: 2.5,
                      }}
                    >
                      {column.render ? column.render(row, rowIndex) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {enablePagination && (
        <Box sx={{ borderTop: '1px solid #e0e0e0' }}>
          <TablePagination
            component="div"
            count={effectiveTotal}
            page={effectivePage}
            onPageChange={handlePageChange}
            rowsPerPage={effectiveRowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        </Box>
      )}
    </Paper>
  );
};

StandardTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    align: PropTypes.oneOf(['left', 'right', 'center', 'inherit', 'justify']),
    sortable: PropTypes.bool,
    render: PropTypes.func,
  })).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  getRowId: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  initialSort: PropTypes.shape({
    id: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc']),
  }),
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  totalCount: PropTypes.number,
  enablePagination: PropTypes.bool,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
};

export default StandardTable;

