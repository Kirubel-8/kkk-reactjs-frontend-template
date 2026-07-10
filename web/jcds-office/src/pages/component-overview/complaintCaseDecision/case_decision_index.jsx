import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment
} from '@mui/material';
import caseReviewService from '../../../service/caseReview.service';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

const FILTERS = [
  { label: 'Pending', caseStatus: 'open' },
  { label: 'Closed', caseStatus: 'closed' },
];

const CaseDecisionIndex = () => {
  const [casesData, setCasesData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setPage(0); // Reset to first page on tab change
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
      const caseStatus = activeFilter.caseStatus || 'open';

      // For case decision with 2 filters: awaiting decision (open) and closed cases (closed)
      const response = await caseReviewService.listComplaintsAndCases(
        'under_council_review',
        caseStatus,
        page + 1,
        rowsPerPage
      );
      setCasesData(response.cases || []);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({
        open: true,
        message: 'Unable to load cases. Please refresh the page.',
        severity: 'error'
      });
      setCasesData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (caseId) => {
    navigate('/case_decision_detail', { state: { caseId } });
  };

  const getCaseDecisionStatusMeta = (status) => {
    const normalized = (status || '').toLowerCase();
    // Treat open cases in decision view as pending
    if (normalized === 'open') {
      return { label: 'Pending', color: getStatusMeta(theme, 'pending').color };
    }
    // Allow under_council_review to show as Pending only on decision views
    return getStatusMeta(theme, status, null, 'under_council_review');
  };

  const columns = useMemo(() => {
    const showStatusColumn = (FILTERS[tabValue]?.status || 'all') === 'all';

    return [
      { id: 'rowNumber', label: 'No.', width: '70px' },
      { id: 'caseNumber', label: 'Case Number', sortable: true },
      { id: 'applicant', label: 'Applicant', sortable: true },
      ...(showStatusColumn
        ? [
            {
              id: 'status',
              label: 'Status',
              render: (row) => {
                const meta = getCaseDecisionStatusMeta(row.status);
                return (
                  <Box
                    sx={{
                      display: 'inline-block',
                      color: meta.color,
                      fontWeight: 'bold',
                      fontSize: 12
                    }}
                  >
                    {meta.label}
                  </Box>
                );
              }
            }
          ]
        : []),
      { id: 'submitted', label: 'Submitted on', sortable: true },
      {
        id: 'action',
        label: 'Action',
        align: 'center',
        render: (row) =>
          row.canView ? (
            <IconButton
              onClick={() => handleView(row.caseId)}
              sx={{
                color: '#2E3180',
                '&:hover': { backgroundColor: '#e0e0e0' }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          ) : null
      }
    ];
  }, [handleView, tabValue]);

  const rows = useMemo(() => casesData.map((item, index) => ({
    id: item.case_id || index,
    rowNumber: page * rowsPerPage + index + 1,
    caseNumber: item.case_number || '-',
    applicant: item.complaint?.applicant?.full_name || 'Anonymous',
    status: item.status,
    submitted: item.complaint?.submission_date ? new Date(item.complaint.submission_date).toLocaleDateString() : '-',
    canView: item?.complaint?.status !== 'under_investigation',
    caseId: item.case_id
  })), [casesData, page, rowsPerPage]);

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" color={'#215167'} sx={{ fontWeight: 700, fontSize: '22px' }} mb={0.5}>
          Case Decision Management
        </Typography>
        {/* <Typography variant="h6" color={'#2E3180'}>
          Below is the list of cases you have been assigned to review
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
            <FormControl
              fullWidth
              sx={{ minWidth: 200 }}
            >
              <InputLabel id="status-filter-label">Filter</InputLabel>
              <Select
                labelId="status-filter-label"
                value={tabValue}
                label="Filter"
                onChange={(e) => setTabValue(e.target.value)}
              >
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
                      backgroundColor: theme.palette.primary.main,
                    },
                    '&:hover': {
                      backgroundColor: tabValue === index ? theme.palette.primary.main : '#e8e8e8',
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaseDecisionIndex;
