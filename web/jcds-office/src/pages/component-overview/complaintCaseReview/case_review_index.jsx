import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Checkbox,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import caseReviewService from '../../../service/caseReview.service';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

// Filter configuration for council head case review.
// Each filter is defined by the `status` parameter passed to the backend.
const FILTERS = [
  { label: 'All', status: 'all' },
  { label: 'Pending', status: 'accepted' },
  { label: 'Approved', status: 'under_council_review' },
  // "Rejected" view shows complaints that were sent back to investigation after head rejection
  { label: 'Returned', status: 'rejected' },
  { label: 'Decided', status: 'closed' }
];

const CaseReviewIndex = () => {
  const [data, setData] = useState([]);
  const [casesData, setCasesData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('approve');
  const [rejectionComment, setRejectionComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setPage(0); // Reset to first page on tab change
    setSelectedIds([]); // Clear selections on tab change
  }, [tabValue]);

  useEffect(() => {
    fetchData();
  }, [tabValue, page, rowsPerPage]);

  // Force refresh when component becomes visible (e.g., after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabValue, page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeFilter = FILTERS[tabValue] || FILTERS[0];
      const status = activeFilter.status || 'all';

      const response = await caseReviewService.listComplaintsAndCases(status, null, page + 1, rowsPerPage);
      setData(response.complaints || []);
      setCasesData(response.cases || []);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({
        open: true,
        message: 'Unable to load cases. Please refresh the page.',
        severity: 'error'
      });
      setData([]);
      setCasesData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (complaintId) => {
    navigate('/case_review_detail', { state: { complaintId } });
  };

  const getComplaintStatusMeta = (item) => {
    const complaintStatus = item.status;
    const caseStatus = item.case?.status;
    
    // For complaints with 'accepted' status, show as 'Pending' in case review context
    if ((complaintStatus || '').toLowerCase() === 'accepted') {
      return { label: 'Pending', color: getStatusMeta(theme, 'pending').color };
    }
    
    // Show under_council_review as "Under Review" on this page
    if ((complaintStatus || '').toLowerCase() === 'under_council_review') {
      return getStatusMeta(theme, 'under_council_review');
    }
    
    return getStatusMeta(theme, complaintStatus, caseStatus);
  };

  const getCaseStatusMeta = (item) => {
    const status = (item.status || '').toLowerCase();
    if (status === 'returned_to_office') {
      return getStatusMeta(theme, 'returned');
    }
    if (status === 'open') {
      return { label: 'Approved', color: getStatusMeta(theme, 'approved').color };
    }
    return getStatusMeta(theme, 'closed');
  };

  const rows = useMemo(() => {
    const complaintRows = data.map((item) => ({
      id: `complaint-${item.complaint_id}`,
      complaint_id: item.complaint_id,
      type: 'complaint',
      reporter: item.applicant?.full_name || 'Anonymous',
      caseType: item.case_type || 'N/A',
      judgeName: item.judge_name || 'N/A',
      caseFileNumber: item.case_file_number || 'N/A',
      statusMeta: getComplaintStatusMeta(item),
      selectable: (tabValue === 0 || tabValue === 1) && (item.status || '').toLowerCase() !== 'under_investigation'
    }));

    const includeCases = tabValue === 0 || tabValue === 2 || tabValue === 4;
    const caseRows = includeCases
      ? casesData.map((item) => ({
          id: `case-${item.case_id}`,
          complaint_id: item.complaint?.complaint_id,
          type: 'case',
          reporter: item.complaint?.applicant?.full_name || 'Anonymous',
          caseType: item.case_type || 'N/A',
          judgeName: item.complaint?.judge_name || 'N/A',
          caseFileNumber: item.complaint?.case_file_number || 'N/A',
          statusMeta: getCaseStatusMeta(item),
          selectable: false
        }))
      : [];

    const merged = [...complaintRows, ...caseRows].map((row, index) => ({
      ...row,
      rowNumber: page * rowsPerPage + index + 1
    }));

    return merged;
  }, [data, casesData, tabValue, page, rowsPerPage]);

  const handleSelectAll = (event) => {
    const selectableIds = rows.filter((row) => row.selectable).map((row) => row.complaint_id);
    if (event.target.checked) {
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedIds.slice(0, selectedIndex), selectedIds.slice(selectedIndex + 1));
    }

    setSelectedIds(newSelected);
  };

  const handleBulkAction = async () => {
    if (bulkAction === 'reject' && !rejectionComment.trim()) {
      setSnackbar({
        open: true,
        message: 'Rejection comment is required',
        severity: 'error'
      });
      return;
    }

    if (selectedIds.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one item',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await caseReviewService.bulkApproveReject(selectedIds, bulkAction, rejectionComment);

      setSnackbar({
        open: true,
        message: response.message || `${bulkAction} successful`,
        severity: 'success'
      });

      setSelectedIds([]);
      setBulkActionOpen(false);
      setRejectionComment('');
      fetchData();
    } catch (error) {
      const actionText = bulkAction === 'approve' ? 'approve' : 'reject';
      let errorMessage = `Unable to ${actionText} selected complaints.`;

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message && error.message.length < 100) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    const selectableCount = rows.filter((row) => row.selectable).length;
    const allSelected = selectableCount > 0 && selectedIds.length === selectableCount;
    const someSelected = selectedIds.length > 0 && selectedIds.length < selectableCount;
    const showStatusColumn = (FILTERS[tabValue]?.status || 'all') === 'all';

    return [
      {
        id: 'select',
        label: (
          <Checkbox
            indeterminate={someSelected}
            checked={allSelected}
            onChange={handleSelectAll}
            sx={{
              color: theme.palette.primary.contrastText,
              '&.Mui-checked': { color: theme.palette.primary.contrastText },
              '&.MuiCheckbox-indeterminate': { color: theme.palette.primary.contrastText }
            }}
          />
        ),
        align: 'center',
        render: (row) =>
          row.selectable ? (
            <Checkbox checked={selectedIds.includes(row.complaint_id)} onChange={() => handleSelectOne(row.complaint_id)} color="primary" />
          ) : null
      },
      { id: 'rowNumber', label: 'No.', width: '70px' },
      { id: 'reporter', label: 'Reporter', sortable: true },
      { id: 'caseType', label: 'Case Type' },
      { id: 'judgeName', label: 'Judge Name' },
      { id: 'caseFileNumber', label: 'Case File Number', sortable: true },
      ...(showStatusColumn
        ? [
            {
              id: 'status',
              label: 'Status',
              render: (row) => (
                <Box
                  sx={{
                    display: 'inline-block',
                    color: row.statusMeta?.color || '#777',
                    fontWeight: 'bold',
                    fontSize: 12
                  }}
                >
                  {row.statusMeta?.label || 'Pending'}
                </Box>
              )
            }
          ]
        : []),
      {
        id: 'action',
        label: 'Action',
        align: 'center',
        render: (row) => (
          <IconButton
            onClick={() => handleView(row.complaint_id)}
            sx={{
              color: '#2E3180',
              '&:hover': { backgroundColor: '#e0e0e0' }
            }}
          >
            <VisibilityIcon />
          </IconButton>
        )
      }
    ];
  }, [handleSelectAll, selectedIds, rows, handleSelectOne, theme, tabValue]);

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" color={theme.palette.primary.main} sx={{ fontWeight: 700 }} mb={0.5}>
          Review Management
        </Typography>
        {/* <Typography variant="h6" color={'#2E3180'}>
          Below is the list of complaints requiring council head review
        </Typography> */}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
          width: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          {isMobile ? (
            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel id="status-filter-label">Filter</InputLabel>
              <Select labelId="status-filter-label" value={tabValue} label="Filter" onChange={(e) => setTabValue(e.target.value)}>
                {FILTERS.map((filter, index) => (
                  <MenuItem key={filter.label} value={index}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
                p: 0.5,
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              {FILTERS.map((filter, index) => (
                <Tab
                  key={filter.label}
                  label={filter.label}
                  value={index}
                  sx={{
                    textTransform: 'none',
                    minHeight: 36,
                    minWidth: 'auto',
                    px: 2.5,
                    py: 1,
                    mr: 0.5,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '4px',
                    color: '#666',
                    backgroundColor: '#F7F7FF',
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      color: theme.palette.primary.contrastText,
                      backgroundColor: theme.palette.primary.main
                    },
                    '&:hover': {
                      backgroundColor: tabValue === index ? theme.palette.primary.main : '#e8e8e8'
                    }
                  }}
                />
              ))}
            </Tabs>
          )}
        </Box>

        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for ..."
          size="small"
          sx={{ minWidth: { xs: '100%', md: 260 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Box>

      <StandardTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />

      {/* Bulk Action Buttons */}
      {selectedIds.length > 0 && (tabValue === 0 || tabValue === 1) && (
        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {selectedIds.length} item(s) selected
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                setBulkAction('approve');
                handleBulkAction();
              }}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Approve Selected
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<CancelIcon />}
              onClick={() => {
                setBulkAction('reject');
                setBulkActionOpen(true);
              }}
              disabled={loading}
            >
              Return Selected
            </Button>
          </Box>
        </Box>
      )}

      {/* Rejection Dialog */}
      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)}>
        <DialogTitle>Reject Selected Complaints</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Please provide a reason for rejecting these complaints:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            placeholder="Enter rejection comment..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setBulkActionOpen(false);
              setRejectionComment('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setBulkActionOpen(false);
              handleBulkAction();
            }}
            disabled={!rejectionComment.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Chip
          label={snackbar.message}
          color={snackbar.severity === 'success' ? 'success' : 'error'}
          onDelete={() => setSnackbar({ ...snackbar, open: false })}
        />
      </Snackbar>
    </Box>
  );
};

export default CaseReviewIndex;
