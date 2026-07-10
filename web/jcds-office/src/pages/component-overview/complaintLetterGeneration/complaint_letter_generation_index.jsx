import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Snackbar, useTheme, IconButton } from '@mui/material';
import caseReviewService from '../../../service/caseReview.service';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

const LetterGenerationIndex = () => {
  const theme = useTheme();
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
      // Fetch closed/decided cases only
      const response = await caseReviewService.listComplaintsAndCases('closed', null, page + 1, rowsPerPage);
      // Combine complaints and cases data
      const cases = response.cases || [];
      setData(cases);
      setTotalCount(response.pagination?.totalCount || cases.length);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setSnackbar({
        open: true,
        message: 'Unable to load decided cases. Please refresh the page.',
        severity: 'error'
      });
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getProgressStatus = (status) => getStatusMeta(theme, status);

  const handleView = (caseItem) => {
    const raw = caseItem?.raw || caseItem;
    const caseId = raw?.case_id;
    const decisionId = raw?.decision?.decision_id;
    navigate('/letter_generation_detail', {
      state: {
        caseId,
        decisionId
      }
    });
  };

  const columns = useMemo(
    () => [
      { id: 'rowNumber', label: 'No.', width: '70px' },
      { id: 'caseNumber', label: 'Case Number', sortable: true },
      { id: 'applicant', label: 'Applicant', sortable: true },
      { id: 'caseType', label: 'Case Type' },
      {
        id: 'decision',
        label: 'Decision',
        render: (row) => (
          <Chip
            label={row.decision || 'Decided'}
            size="small"
            sx={{
              color: '#1E516A',
              fontWeight: 600
            }}
          />
        )
      },
      // {
      //   id: 'decisionDate',
      //   label: 'Decided On',
      //   sortable: true
      // },
      {
        id: 'status',
        label: 'Status',
        render: (row) => {
          const prog = getProgressStatus(row.status);
          return (
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                color: prog?.color || '#777',
                fontWeight: 'bold',
                fontSize: 12
              }}
            >
              {prog?.label || 'Pending'}
            </Box>
          );
        }
      },
      {
        id: 'action',
        label: 'Action',
        align: 'center',
        render: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleView(row);
              }}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': { backgroundColor: '#e0e0e0' }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    ],
    [getProgressStatus, handleView, theme.palette.primary.main]
  );

  const rows = useMemo(
    () =>
      data.map((item, index) => ({
        id: item.case_id || index,
        rowNumber: page * rowsPerPage + index + 1,
        caseNumber: item.case_number || 'N/A',
        applicant:
          item.complaint?.applicant?.full_name ||
          `${item.complaint?.applicant?.first_name || ''} ${item.complaint?.applicant?.last_name || ''}`.trim() ||
          'Anonymous',
        caseType: item.case_type || 'N/A',
        decision: item.decision?.status?.name || 'Decided',
        status: item.status,
        // decisionDate: item.decision?.decision_date ? new Date(item.decision?.decision_date).toLocaleDateString() : 'N/A',
        raw: item
      })),
    [data, page, rowsPerPage]
  );

  return (
    <Box
      sx={{
        p: 3,
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: '16px',
        boxShadow: '0 0 12px rgba(0,0,0,0.05)',
        border: '1px solid #E0E0E0'
      }}
    >
      <Typography variant="h3" color="#215167" sx={{ fontWeight: 700, fontSize: '22px' }} mb={1}>
        Letter Generation
      </Typography>
      {/* <Typography variant="h6" color="#2E3180" mb={3}>
        Generate official letters for decided cases
      </Typography> */}

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

export default LetterGenerationIndex;
