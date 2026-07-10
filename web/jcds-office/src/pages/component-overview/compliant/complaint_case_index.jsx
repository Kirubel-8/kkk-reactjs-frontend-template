import React, { useEffect, useMemo, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Button, 
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from "@mui/material";
import caseReviewService from "../../../service/caseReview.service";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import StandardTable from "../../../components/common/StandardTable";
import { getStatusMeta } from "../../../utils/statusColors";

const FILTERS = [
  { label: "All", status: "all" }, // just all 4 of them
  { label: "Returned", status: "returned" }, // returned by director / returned to office
  { label: "Approved", status: "accepted" },
  { label: "Under Review", status: "under_council_review" }, // under investigation cases
  { label: "Decided", status: "decided" }, // final decided cases
];
const CompliantIndex = () => {
  const [compliantRequest, setCompliantRequest] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [totalCount, setTotalCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    setPage(0); // Reset to first page on tab change
  }, [tabValue]);

  useEffect(() => {
    getAllCompliantRequest();
  }, [tabValue, page, rowsPerPage]);

  // Force refresh when component becomes visible (e.g., after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getAllCompliantRequest();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tabValue, page, rowsPerPage]);

  const getAllCompliantRequest = async () => {
    setTableLoading(true);
    try {
      const activeFilter = FILTERS[tabValue] || FILTERS[0];
      const status = activeFilter.status || "all";

      const data = await caseReviewService.listCasesOverview(
        status,
        page + 1,
        rowsPerPage
      );
      const cases = data?.cases || [];
      setCompliantRequest(cases);
      setTotalCount(data?.pagination?.totalCount || 0);
    } catch (error) {
      console.error("Error fetching complaints:", error.message);
      setSnackbar({
        open: true,
        message: 'Unable to load complaints. Please refresh the page.',
        severity: 'info'
      });
      setCompliantRequest([]);
      setTotalCount(0);
    } finally {
      setTableLoading(false);
    }
  };

  const handleView = (complaint_id) => {
    navigate('/detail_compliant', { state: { complaint_id } });
  };

  const handleViewDecision = (complaint) => {
    if (complaint?.case?.decision) {
      setSelectedDecision(complaint.case.decision);
      setDecisionDialogOpen(true);
    }
  };

  const getProgressStatus = (complaint) => {
    return getStatusMeta(theme, complaint?.status);
  };

  const tableRows = useMemo(
    () =>
      compliantRequest.map((item, index) => {
        const complaint = item.complaint || {};
        const applicant = complaint.applicant || {};
        return {
          ...item,
          id: complaint.complaint_id || item.case_id || index,
          rowNumber: page * rowsPerPage + index + 1,
          reporterName: applicant.full_name || "Anonymous",
          caseTypeDisplay: item.case_type || complaint.case_type || "N/A",
          judgeNameDisplay: item.judge_name || complaint.judge_name || "N/A",
          caseFileNumberDisplay: item.case_number || item.case_file_number || "N/A",
          status: complaint.status || item.status,
        };
      }),
    [compliantRequest, page, rowsPerPage]
  );

  const tableColumns = useMemo(() => {
    const showStatusColumn = (FILTERS[tabValue]?.status || "all") === "all";

    return [
      { id: "rowNumber", label: "No.", width: "70px", sortable: true },
      { id: "caseFileNumberDisplay", label: "Case File Number", sortable: true },
      { id: "judgeNameDisplay", label: "Judge Name", sortable: true },
      { id: "caseTypeDisplay", label: "Case Type", sortable: true },
      { id: "reporterName", label: "Reporter", sortable: true },
      ...(showStatusColumn
        ? [
            {
              id: "status",
              label: "Status",
              render: (row) => {
                const prog = getProgressStatus(row);
                return (
                  <Box
                    sx={{
                      display: "inline-block",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      color: prog?.color || "#777",
                      fontWeight: "bold",
                      fontSize: 12,
                      // backgroundColor: prog?.color || "#777",
                    }}
                  >
                    {prog?.label || "Pending"}
                  </Box>
                );
              },
            },
          ]
        : []),
      {
        id: "action",
        label: "Action",
        align: "center",
        render: (row) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <IconButton
              onClick={() => handleView(row.complaint_id)}
              sx={{
                color: theme.palette.primary.main,
                "&:hover": { backgroundColor: "#e0e0e0" },
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Box>
        ),
      },
    ];
  }, [getProgressStatus, handleView, handleViewDecision, tabValue]);

 

  return (
    <Box sx={{ width: "100%", p: { xs: 2, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" color={theme.palette.primary.main} sx={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", fontSize: '22px' }} mb={0.5}>
          Case Management
        </Typography>
        {/* <Typography variant="h6" color={theme.palette.primary.main}>
          Below is the list of disciplinary case reports requiring your action
        </Typography> */}
      </Box>
      
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mb: 2,
          width: "100%"
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: 1,
            flexWrap: "wrap"
          }}
        >
          {isMobile ? (
            <FormControl
              fullWidth
              sx={{ minWidth: 200 }}
            >
              <InputLabel id="status-filter-label">Case Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={tabValue}
                label="Case Status"
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
                    textTransform: "none",
                    minHeight: 36,
                    minWidth: "auto",
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
          sx={{ minWidth: { xs: "100%", md: 260 } }}
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
        columns={tableColumns}
        rows={tableRows}
        loading={tableLoading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
        initialSort={{ id: "rowNumber", direction: "asc" }}
      />

      {/* Decision View Dialog */}
      <Dialog
        open={decisionDialogOpen}
        onClose={() => setDecisionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700} color="#1E516A">
            Case Decision Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedDecision && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Decision Status
                </Typography>
                <Chip
                  label={selectedDecision?.status?.name || "N/A"}
                  sx={{
                    backgroundColor: "#0d6f4e",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px"
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Letter Reference Number
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {selectedDecision?.letterRef?.reference_number || "N/A"}
                </Typography>
              </Box>

              {selectedDecision?.external_decision && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    External Decision
                  </Typography>
                  <Typography variant="body2" sx={{ p: 1.5, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
                    {selectedDecision.external_decision}
                  </Typography>
                </Box>
              )}

              {selectedDecision?.decision_document && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Decision Document
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                     onClick={() =>
                      window.open(
                        `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${selectedDecision.decision_document}`,
                        '_blank'
                      )
                    }
                    sx={{ textTransform: "none" }}
                  >
                    View Decision Document
                  </Button>
                </Box>
              )}

              {selectedDecision?.external_decision_document && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    External Decision Document
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() =>
                      window.open(
                        `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000/'}${selectedDecision.external_decision_document}`,
                        '_blank'
                      )
                    }
                    sx={{ textTransform: "none" }}
                  >
                    View External Document
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
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

export default CompliantIndex;
