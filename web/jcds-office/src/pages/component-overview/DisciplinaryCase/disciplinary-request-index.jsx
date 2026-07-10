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
  Tooltip,
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
import disciplineCaseService from "../../../service/disciplinary.service";
import StandardTable from "../../../components/common/StandardTable";
import { getStatusMeta } from "../../../utils/statusColors";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Under Investigation", value: "under_investigation" },
  { label: "Accepted", value: "accepted" },
  { label: "Returned", value: "returned" },
  { label: "Rejected", value: "rejected" },
];

export default function DisciplinaryCaseReports() {
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

  // Fetches disciplinary cases for the active filter.
  const fetchCases = async (status = "all") => {
    setLoading(true);
    try {
      const res = await disciplineCaseService.getAssignedDisciplinaryRequests(status);
      const data = res.data.map((item, index) => ({
        disp_Id: item.disciplinary_complaint_id || index,
        judge_name: item.judge_name,
        court_office: item.court_office,
        file_number: item.file_number,
        status: item.status,
        case_status: item.case?.status || item.status || null,
        createdAt: new Date(item.createdAt).toISOString().split("T")[0],
      }));
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
      setSnackbar({
        open: true,
        message: "No cases found or failed to fetch.",
        severity: "warning",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    const activeFilter = FILTERS[tabValue] || FILTERS[0];
    fetchCases(activeFilter.value);
  }, [tabValue]);

  const handleDetail = (item) => {
    console.log('Navigating to complaint detail with dispId:', item.disp_Id);
    navigate('/disciplinary_detail', {
      state: {
        disp_id: item.disp_Id,
      }
    });
  };

  const tableRows = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    const filtered = rows
      .filter((r) =>
        !lower ||
          r.judge_name?.toLowerCase().includes(lower) ||
          r.court_office?.toLowerCase().includes(lower) ||
          r.file_number?.toLowerCase().includes(lower) ||
        r.status?.toLowerCase().includes(lower) ||
        r.case_status?.toLowerCase().includes(lower)
      );

    return filtered.map((item, index) => ({
      ...item,
      id: item.disp_Id,
      rowNumber: page * rowsPerPage + index + 1,
    }));
  }, [rows, searchQuery, page, rowsPerPage]);

  const columns = useMemo(() => [
    { id: "rowNumber", label: "No.", width: "70px" },
    { id: "judge_name", label: "Judge Name", sortable: true, render: (row) => <Typography sx={{ fontWeight: 600 }}>{row.judge_name}</Typography> },
    { id: "court_office", label: "Court Office", sortable: true },
    { id: "file_number", label: "File Number", sortable: true },
    {
      id: "case_status",
      label: "Case Status",
      render: (row) => {
        const statusValue = row.case_status || row.status;
        const meta = getStatusMeta(theme, statusValue);
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
            {meta?.label || statusValue || "Pending"}
          </Box>
        );
      },
    },
    { id: "createdAt", label: "Created Date", sortable: true },
      {
      id: "action",
      label: "Action",
      align: "center",
      render: (row) => {
        const isPending = row.case_status === "pending";
          return (
          <IconButton
            onClick={() => !isPending && handleDetail(row)}
                  disabled={isPending}
                  sx={{
              color: '#2E3180',
              '&:hover': { backgroundColor: '#e0e0e0' },
              opacity: isPending ? 0.5 : 1,
            }}
            title={isPending ? "Get Complaint First" : "View Details"}
                >
            <Visibility />
          </IconButton>
          );
        },
    },
  ], [handleDetail, theme]);

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
          Disciplinary Complaints
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