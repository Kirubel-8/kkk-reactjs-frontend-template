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
import { Search, CloudUploadOutlined, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import courtOfficeService from 'service/courtOffice.service';
import StandardTable from '../../../components/common/StandardTable';

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Delivered", value: "fulfilled" },
  { label: "Returned", value: "returned_empty" },
];

export default function DocumentRequests() {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchRequests = async (status = "all") => {
    setLoading(true);
    try {
      const response = await courtOfficeService.getDocumentRequests({
        page: 1,
        limit: 100,
        status: status === 'all' ? 'all' : status,
        search: searchQuery
      });
      
      const data = response.data.requests.map((c) => {
        const complaint = c.disciplinary_complaint || {};
        const courtReq = c.courtOfficeRequest || {};
  
        return {
          id: c.case_id,
          file_number: complaint.file_number,
          judge_name: complaint.judge_name,
          requested_at: courtReq.court_office_requested_at,
          status: courtReq.court_office_document_request_status,
          reason: courtReq.court_office_request_reason || "",
        };
      });

      setRows(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRows([]);
      setSnackbar({
        open: true,
        message: "Failed to fetch document requests.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    const activeFilter = FILTERS[tabValue] || FILTERS[0];
    fetchRequests(activeFilter.value);
  }, [tabValue]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'fulfilled':
        return '#4CAF50';
      case 'returned_empty':
        return '#D32F2F';
      default:
        return '#757575';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'fulfilled':
        return 'Delivered';
      case 'returned_empty':
        return 'Returned Empty';
      default:
        return status;
    }
  };

  const tableRows = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = rows
      .filter((r) =>
        !lower ||
        r.file_number?.toLowerCase().includes(lower) ||
        r.judge_name?.toLowerCase().includes(lower)
      );

    return filtered.map((item, index) => ({
      ...item,
      rowNumber: page * rowsPerPage + index + 1,
    }));
  }, [rows, searchQuery, page, rowsPerPage]);

  const columns = useMemo(() => [
    { id: "rowNumber", label: "No.", width: "70px" },
    { 
      id: "file_number", 
      label: "File Number", 
      sortable: true,
      render: (row) => <Typography>{row.file_number}</Typography>
    },
    { id: "judge_name", label: "Judge Name", sortable: true },
    { 
      id: "requested_at", 
      label: "Requested At", 
      sortable: true,
      render: (row) => (
        <Typography variant="body2">
          {row.requested_at ? new Date(row.requested_at).toLocaleDateString() : '-'}
        </Typography>
      )
    },
    {
      id: "status",
      label: "Status",
      render: (row) => {
        const color = getStatusColor(row.status);
        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: color,
                mr: 1,
              }}
            />
            <Typography sx={{ color, fontWeight: 500 }}>
              {getStatusLabel(row.status)}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "action",
      label: "Action",
      align: "center",
      render: (row) => {
        if (row.status === 'pending') {
          return (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUploadOutlined />}
              onClick={() => navigate('/court-office/upload', { state: { id: row.id } })}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 500,
                borderColor: "#2E3180",
                color: "#2E3180",
                "&:hover": { borderColor: "#1A1C60", color: "#1A1C60" },
              }}
            >
              Upload
            </Button>
          );
        }
        return (
          <IconButton
            onClick={() => navigate('/court-office/upload', {
              state: {
                id: row.id,
                caseId: row.case_id
              }
            })}
            sx={{
              color: '#2E3180',
              '&:hover': { backgroundColor: '#e0e0e0' },
            }}
            title="View Details"
          >
            <Visibility />
          </IconButton>
        );
      },
    },
  ], [navigate]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1.3rem",
            color: theme.palette.primary.main,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Document Requests
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
          size="small"
          placeholder="Search keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: { xs: '100%', md: 260 },
            backgroundColor: "#f9f9f9",
            borderRadius: "15px",
            "& .MuiOutlinedInput-root": { borderRadius: "15px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "gray" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <StandardTable
        columns={columns}
        rows={tableRows}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={tableRows.length}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
