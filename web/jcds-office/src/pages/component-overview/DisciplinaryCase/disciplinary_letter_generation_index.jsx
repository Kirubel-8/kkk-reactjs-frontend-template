import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Chip,
  Snackbar,
  TablePagination,
  CircularProgress
} from '@mui/material';
import disciplinaryService from '../../../service/disciplinary.service';
import VisibilityIcon from '@mui/icons-material/Visibility';

const DisciplinaryLetterGenerationIndex = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch disciplinary cases that have a CaseDecision
      const response = await disciplinaryService.getDecidedDisciplinaryRequests(
        page + 1,
        rowsPerPage
      );
      
      // Response structure: { success, data: [Case objects], pagination }
      // Each Case has: disciplinaryComplaint, decision (with status.decision_type)
      const cases = response.data || [];
      setData(cases);
      setTotalCount(response.pagination?.totalCount || cases.length);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({
        open: true,
        message: 'Unable to load disciplinary cases. Please refresh the page.',
        severity: 'error'
      });
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (caseItem) => {
    // caseItem is a Case object, disciplinary_complaint_id is on the Case
    navigate('/disciplinary_letter_generation_detail', { 
      state: { 
        caseId: caseItem.disciplinary_complaint_id,
        decisionId: caseItem.decision?.decision_id,
      } 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed': return '#0d6f4e';
      case 'decided': return '#0d6f4e';
      default: return '#777';
    }
  };

  const TABLE_HEADERS = ['No', 'File Number', 'Applicant', 'Judge', 'Decision Type', 'Action'];

  return (
    <Box sx={{ p: 3, width: '100%', bgcolor: 'background.paper', borderRadius: '16px', boxShadow: '0 0 12px rgba(0,0,0,0.05)', border: '1px solid #E0E0E0' }}>
      <Typography variant="h3" color="#2E3180" sx={{ fontWeight: 700 }} mb={1}>
        Disciplinary Letter Generation
      </Typography>
      <Typography variant="h6" color="#2E3180" mb={3}>
        Generate official letters for decided disciplinary cases
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}
      >
        <Table
          sx={{
            borderCollapse: 'separate',
            borderSpacing: '0 8px',
            minWidth: 650
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgb(4, 52, 75)' }}>
              {TABLE_HEADERS.map((header, idx, arr) => (
                <TableCell
                  key={header}
                  sx={{
                    color: 'rgb(235, 228, 228)',
                    fontWeight: 'bold',
                    border: 'none',
                    borderBottom: '4px solid #e0e0e0',
                    borderTopLeftRadius: idx === 0 ? 10 : 0,
                    borderTopRightRadius: idx === arr.length - 1 ? 10 : 0
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No decided disciplinary cases found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((caseItem, index) => {
                // Extract data from nested structure
                const complaint = caseItem.disciplinaryComplaint;
                const decision = caseItem.decision;
                const applicant = complaint?.applicant;
                const decisionType = decision?.status?.decision_type || 'N/A';
                
                return (
                  <TableRow
                    key={caseItem.case_id || index}
                    hover
                    sx={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      '& td:first-of-type': { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
                      '& td:last-of-type': { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                    onClick={() => handleView(caseItem)}
                  >
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {complaint?.file_number || caseItem.case_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {applicant?.full_name || 'Anonymous'}
                    </TableCell>
                    <TableCell>{complaint?.judge_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={decisionType}
                        size="small"
                        sx={{
                          backgroundColor: decisionType === 'complaint closed' ? '#0d6f4e' : '#1E516A',
                          color: '#fff',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(caseItem);
                        }}
                        sx={{ 
                          textTransform: 'none',
                          backgroundColor: '#1E516A',
                          '&:hover': { backgroundColor: '#153d52' }
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        />
      </TableContainer>

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

export default DisciplinaryLetterGenerationIndex;
