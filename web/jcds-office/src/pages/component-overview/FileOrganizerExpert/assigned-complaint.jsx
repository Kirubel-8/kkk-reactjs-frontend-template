import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
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
} from "@mui/material";
import { Search, Visibility } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import fileOrganizerService from "../../../service/fileOrganizer.service";
import StandardTable from "../../../components/common/StandardTable";
import { getStatusMeta } from "../../../utils/statusColors";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "New", value: "Opened" },
  { label: "Dispatched", value: "File Dispatched" },
  { label: "Assigned", value: "assigned to committee" },
];

export default function AssignedComplaints() {
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

  const fetchAssignedComplaints = async (status = "all") => {
    setLoading(true);
    try {
      const res = await fileOrganizerService.getAllAssignedComplaints({ status });
      const data = res.data.map((item, index) => {
        const comp = item.disciplinary_complaint;
        return {
          disp_Id: comp?.disciplinary_complaint_id || index,
          judge_name: comp?.judge_name || "N/A",
          court_office: comp?.court_office || "N/A",
          file_number: comp?.file_number || item.case_number || "N/A",
          status: item.status || "Opened",
          case_id: item.case_id,
          createdAt: new Date(item.createdAt).toISOString().split("T")[0],
      
          applicant_name: comp?.applicant?.full_name || "N/A",
          issues_count: comp?.issues?.length || 0,
          evidences_count: comp?.evidences?.length || 0,
        };
      
      });
      
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
      setSnackbar({
        open: true,
        message: "No assigned complaints found or failed to fetch.",
        severity: "warning",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    const activeFilter = FILTERS[tabValue] || FILTERS[0];
    fetchAssignedComplaints(activeFilter.value);
  }, [tabValue]);

  const handleDetail = (item) => {
    console.log('Navigating to complaint detail with dispId:', item.disp_Id);
    navigate('/file-organizer-detail', {
      state: {
        disp_id: item.disp_Id,
        caseId: item.case_id,
      }
    });
  };

  const tableRows = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = rows.filter(
        (r) =>
        !lower ||
          r.judge_name?.toLowerCase().includes(lower) ||
          r.court_office?.toLowerCase().includes(lower) ||
          r.file_number?.toLowerCase().includes(lower) ||
          r.status?.toLowerCase().includes(lower) ||
          r.applicant_name?.toLowerCase().includes(lower)
    );

    return filtered.map((item, index) => ({
      ...item,
      id: item.disp_Id,
      rowNumber: page * rowsPerPage + index + 1,
    }));
  }, [rows, searchQuery, page, rowsPerPage]);

  const columns = useMemo(() => [
    { id: "rowNumber", label: "No.", width: "70px" },
    { id: "file_number", label: "File Number", sortable: true },
    {
      id: "judge_name",
      label: "Judge Name",
      sortable: true,
      render: (row) => <Typography sx={{ fontWeight: 600 }}>{row.judge_name}</Typography>,
    },
    { id: "court_office", label: "Court Office", sortable: true },
    {
      id: "status",
      label: "Status",
      render: (row) => {
        const meta = getStatusMeta(theme, row.status);
        return (
            <Box
              sx={{
              display: "inline-block",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              color: meta?.color || "#777",
              fontWeight: "bold",
              fontSize: 12,
            }}
          >
            {meta?.label || row.status || "Pending"}
          </Box>
        );
      },
    },
    { id: "createdAt", label: "Assigned Date", sortable: true },
    {
      id: "action",
      label: "Action",
      align: "center",
      render: (row) => (
        <IconButton
          onClick={() => handleDetail(row)}
          sx={{
            color: '#2E3180',
            '&:hover': { backgroundColor: '#e0e0e0' },
          }}
        >
          <Visibility />
        </IconButton>
      ),
    },
  ], [handleDetail, theme]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '22px',
            color: theme.palette.primary.main,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Disciplinary Record Table
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
            placeholder="Search complaints..."
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