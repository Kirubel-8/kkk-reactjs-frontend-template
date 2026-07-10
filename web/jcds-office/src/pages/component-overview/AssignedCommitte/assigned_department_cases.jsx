import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import informExpertService from '../../../service/informExpert.service';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Selected', value: 'selected' },
  { label: 'Decided', value: 'under_council_review' }
];

export default function AssignedDepartmentCases() {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // User permission states
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [canSelectCase, setCanSelectCase] = useState(false);

  // Enhanced Snackbar state with better defaults
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 4000
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get current user and permissions from localStorage
  const getCurrentUserAndPermissions = () => {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (user) {
        setCurrentUser(user);

        let permissions = [];

        // Method 1: Direct permissions array
        if (user.permissions && Array.isArray(user.permissions)) {
          permissions = user.permissions;
        }
        // Method 2: Permissions nested in roles
        else if (user.roles && Array.isArray(user.roles)) {
          user.roles.forEach((role) => {
            if (role.permissions && Array.isArray(role.permissions)) {
              permissions = [...permissions, ...role.permissions];
            }
          });
        }

        console.log('📋 Final extracted permissions:', permissions);
        setUserPermissions(permissions);

        // Check select_case permission
        const hasSelectCase = permissions.some((perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'select_case');
        setCanSelectCase(hasSelectCase);

        console.log('🔐 User permissions check:', {
          userId: user.user_id,
          hasSelectCase,
          totalPermissions: permissions.length
        });
      }

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  // Snackbar handler functions
  const showSnackbar = (message, severity = 'info', autoHideDuration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity,
      autoHideDuration
    });
  };

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchAssignedCases = async () => {
    setLoading(true);
    try {
      const res = await informExpertService.getAssignedCases();

      if (!res.data?.cases?.length) {
        setRows([]);
        setFilteredRows([]);
        showSnackbar('No assigned cases found.', 'info');
        return;
      }

      const data = res.data.cases
        .filter((item) => item.case_id)
        .map((item) => ({
          case_id: item.case_id,
          case_number: item.case_number,
          file_number: item.disciplinary_complaint?.file_number || 'N/A',
          judge_name: item.disciplinary_complaint?.judge_name || 'N/A',
          court_office: item.disciplinary_complaint?.court_office || 'N/A',
          status: item.status || 'N/A',
          committee_priority: item.committee_priority || 'Not Selected',
          applicant_name: item.disciplinary_complaint?.applicant?.full_name || 'N/A',
          issues_count: item.disciplinary_complaint?.issues?.length || 0,
          evidences_count: item.disciplinary_complaint?.evidences?.length || 0,
          createdAt: new Date(item.createdAt).toISOString().split('T')[0],
          updatedAt: new Date(item.updatedAt).toISOString().split('T')[0],
          department_name: item.assigned_committee_ref?.name || 'N/A'
        }));

      setRows(data);

      // Show success message only if we have data
      if (data.length > 0) {
        showSnackbar(`Loaded ${data.length} assigned cases successfully.`, 'success');
      }
    } catch (err) {
      console.error('Error fetching assigned cases:', err);
      setRows([]);
      setFilteredRows([]);
      showSnackbar(
        'Failed to fetch department assigned cases. Please try again.',
        'error',
        6000 // Longer duration for errors
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user permissions first, then fetch cases
    getCurrentUserAndPermissions();
    fetchAssignedCases();
  }, []);

  const filteredRows = useMemo(() => {
    const filterValue = FILTERS[tabValue]?.value || 'all';
    let filtered = rows;

    switch (filterValue) {
      case 'all': {
        filtered = rows.filter((item) => {
          const normalizedStatus = item.status?.toLowerCase()?.trim() || '';
          return (
            item.status === 'assigned to committee' ||
            item.status === 'under_council_review' ||
            item.status === 'under judiciary expert' ||
            item.status === 'back to committee' ||
            normalizedStatus === 'sent to council' ||
            normalizedStatus === 'sent_to_council' ||
            normalizedStatus === 'sent-to-council' ||
            normalizedStatus === 'committe decided'
          );
        });
        break;
      }
      case 'new':
        filtered = rows.filter((item) => item.status === 'assigned to committee');
        break;
      case 'selected':
        filtered = rows.filter((item) => item.committee_priority === 'selected');
        break;
      case 'under_council_review':
        filtered = rows.filter((item) => item.status?.toLowerCase() === 'committe decided');
        break;
      default:
        filtered = rows;
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.judge_name?.toLowerCase().includes(lower) ||
          r.court_office?.toLowerCase().includes(lower) ||
          r.file_number?.toLowerCase().includes(lower) ||
          r.status?.toLowerCase().includes(lower) ||
          r.applicant_name?.toLowerCase().includes(lower)
      );
    }

    return filtered.map((item, index) => ({
      ...item,
      id: item.case_id,
      rowNumber: page * rowsPerPage + index + 1
    }));
  }, [rows, tabValue, searchQuery, page, rowsPerPage]);

  const handleDetail = (item) => {
    if (!item.case_id) {
      console.error('Cannot view case: missing case_id', item);
      showSnackbar('Cannot open case details: missing case ID.', 'error');
      return;
    }

    console.log('Navigating to case detail:', item.case_id);
    navigate('/department_assigned_case_detail', {
      state: { case_id: item.case_id }
    });
  };

  const handleSelectMultipleCases = async () => {
    if (selectedCases.length === 0) {
      showSnackbar('Please select at least one case.', 'warning');
      return;
    }

    // Check permission again for security
    if (!canSelectCase) {
      showSnackbar("You don't have permission to select cases.", 'error');
      return;
    }

    // Find selected case objects from the table
    const selectedCaseObjects = rows.filter((r) => selectedCases.includes(r.case_id));

    // Filter out already selected ones and cases that are not in "assigned to committee" status
    const eligibleCases = selectedCaseObjects.filter((c) => c.committee_priority !== 'selected' && c.status === 'assigned to committee');

    if (eligibleCases.length === 0) {
      showSnackbar("No eligible cases found. Cases must have status 'assigned to committee' and not already selected.", 'info');
      return;
    }

    try {
      setLoading(true);
      for (const c of eligibleCases) {
        await informExpertService.selectCaseAndInformExperts(c.case_id);
      }

      showSnackbar(`${eligibleCases.length} case(s) selected and experts notified successfully.`, 'success');

      // Refresh data and clear selection
      await fetchAssignedCases();
      setSelectedCases([]);
    } catch (err) {
      console.error('Error selecting cases:', err);
      showSnackbar('Failed to select some cases. Please try again.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'selected':
        return '#27ae60';
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const columns = useMemo(() => [
    { id: 'rowNumber', label: 'No.', width: '70px' },
    {
      id: 'judge_name',
      label: 'Judge Name',
      sortable: true,
      render: (row) => <Typography sx={{ fontWeight: 600 }}>{row.judge_name}</Typography>
    },
    { id: 'court_office', label: 'Court Office', sortable: true },
    { id: 'case_number', label: 'Case Number', sortable: true },
    {
      id: 'status',
      label: 'Case Status',
      render: (row) => {
        const meta = getStatusMeta(theme, row.status);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: meta?.color || '#757575',
                mr: 1
              }}
            />
            <Typography sx={{ color: meta?.color || '#757575', fontWeight: 500, fontSize: '0.875rem' }}>
              {meta?.label || row.status}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'committee_priority',
      label: 'Priority',
      render: (row) => {
        const color = getPriorityColor(row.committee_priority);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: color,
                mr: 1
              }}
            />
            <Typography sx={{ color, fontWeight: 500, fontSize: '0.875rem', textTransform: 'capitalize' }}>
              {row.committee_priority}
            </Typography>
          </Box>
        );
      }
    },
    { id: 'updatedAt', label: 'Assigned Date', sortable: true },
    {
      id: 'action',
      label: 'Action',
      align: 'center',
      render: (row) => (
        <IconButton
          onClick={() => handleDetail(row)}
          sx={{
            color: '#2E3180',
            '&:hover': { backgroundColor: '#e0e0e0' }
          }}
        >
          <Visibility />
        </IconButton>
      )
    }
  ], [handleDetail, theme]);

  return (
    <Box sx={{ width: '100%', py: { xs: 2, md: 2 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '22px',
            color: theme.palette.primary.main,
            fontFamily: "'Montserrat', sans-serif"
          }}
        >
          My Assigned Cases
          {/* {currentUser && (
            <Typography
              component="span"
              sx={{
                ml: 1,
                fontSize: '0.8rem',
                color: canSelectCase ? 'success.main' : 'text.secondary',
                fontWeight: 500
              }}
            >
              ({canSelectCase ? 'Committee Head' : 'Committee Member'})
            </Typography>
          )} */}
        </Typography>
      </Box>

      {/* Filters and Search */}
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
              <Select
                labelId="status-filter-label"
                value={tabValue}
                label="Filter"
                onChange={(e) => {
                  setTabValue(e.target.value);
                  setPage(0);
                }}
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
              onChange={(e, newValue) => {
                setTabValue(newValue);
                setPage(0);
              }}
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
          size="small"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{
            minWidth: { xs: '100%', md: 260 },
            backgroundColor: '#f9f9f9',
            borderRadius: '15px',
            '& .MuiOutlinedInput-root': { borderRadius: '15px' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'gray' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Selection Section - Only show if user has select_case permission and selected cases have "assigned to committee" status */}
      {canSelectCase &&
        selectedCases.length > 0 &&
        (() => {
          // Check if any selected case has status "assigned to committee"
          const eligibleSelectedCases = rows.filter((r) => selectedCases.includes(r.case_id) && r.status === 'assigned to committee');

          if (eligibleSelectedCases.length === 0) {
            return null; // Don't show button if no eligible cases
          }

          return (
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500 }}>
                {eligibleSelectedCases.length} prioritize case(s) selected to notify committee members (status: assigned to committee)
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSelectMultipleCases}
                sx={{ borderRadius: '20px', textTransform: 'none' }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send to Members'}
              </Button>
            </Box>
          );
        })()}

      {/* Notice for users without select permission */}
      {!canSelectCase && selectedCases.length > 0 && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Only users with select_case permission can select cases for expert review
          </Typography>
        </Box>
      )}

      {/* Notice when selected cases don't have eligible status */}
      {canSelectCase &&
        selectedCases.length > 0 &&
        (() => {
          const eligibleSelectedCases = rows.filter((r) => selectedCases.includes(r.case_id) && r.status === 'assigned to committee');
          const ineligibleCount = selectedCases.length - eligibleSelectedCases.length;

          if (ineligibleCount > 0) {
            return (
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {ineligibleCount} selected case(s) cannot be processed. Only cases with status "assigned to committee" can be selected for
                  expert review.
                </Typography>
              </Box>
            );
          }
          return null;
        })()}

      {/* Data Table */}
      <StandardTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredRows.length}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
        checkboxSelection={canSelectCase}
        isRowSelectable={(row) => row.status === 'assigned to committee'}
        onRowSelectionModelChange={setSelectedCases}
        rowSelectionModel={selectedCases}
      />

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}