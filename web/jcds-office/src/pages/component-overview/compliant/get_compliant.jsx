import { Alert, Box, IconButton, Snackbar, Typography, useTheme } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CircleStackIcon, ArrowDownOnSquareStackIcon  } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import compliantRequestService from '../../../service/compliantRequest.service';
import { Loading } from '../PageLoading/PageLoading';
import GetHeroLayout from '../../../components/common/GetHeroLayout';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';

// Formats ISO dates to YYYY-MM-DD or returns a dash when missing.
const formatDate = value => {
  if (!value) return '—';
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch (error) {
    return '—';
  }
};

// This will be a hook-based function inside the component

/**
 * Displays the Get Complaint page with hero layout, expiring cases, and the standard table.
 */
export const GetComplaint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [allRows, setAllRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetches complaints to populate the table.
  const fetchComplaints = async () => {
    setTableLoading(true);
    try {
      const LIMIT = 500;
      const [underRes, expiringRes] = await Promise.all([
        compliantRequestService.getAllRequestCompliantRequest('under_investigation', 1, LIMIT),
        compliantRequestService.getExpiringComplaint(),
      ]);

      const underRows = (underRes?.data || []).map(item => ({
        complaintId: item.complaint_id,
        fileNumber: item.case_file_number || item.file_number || '—',
        judgeName: item.judge_name || '—',
        requestedAtRaw: item.created_at,
        requestedAt: formatDate(item.created_at),
        status: item.status || 'Under Investigation',
      }));

      const expiringRows = (expiringRes?.data || []).map(item => ({
        complaintId: item.complaint_id,
        fileNumber: item.case_file_number || item.file_number || '—',
        judgeName: item.judge_name || '—',
        requestedAtRaw: item.created_at,
        requestedAt: formatDate(item.created_at),
        status: 'Expiring',
      }));

      const mergedMap = new Map();
      underRows.forEach(row => {
        if (row.complaintId) mergedMap.set(row.complaintId, row);
      });
      expiringRows.forEach(row => {
        if (row.complaintId && !mergedMap.has(row.complaintId)) {
          mergedMap.set(row.complaintId, row);
        }
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        const aDate = new Date(a.requestedAtRaw || 0).getTime();
        const bDate = new Date(b.requestedAtRaw || 0).getTime();
        return bDate - aDate;
      }).map((row, index) => ({
        ...row,
        id: row.complaintId || index,
        no: index + 1,
      }));

      setAllRows(merged);
      setTotalCount(merged.length);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Unable to load complaints. Please refresh and try again.',
        severity: 'info',
      });
      setAllRows([]);
      setTotalCount(0);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    setTotalCount(allRows.length);
  }, [allRows]);

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // Requests a new complaint and navigates to its detail page.
  const handleGetRequest = async () => {
    const MIN_LOADING_TIME = 1000;
    const startTime = Date.now();
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
      setLoading(true);
      const data = await compliantRequestService.getCompliantRequest();
      const elapsed = Date.now() - startTime;
      await delay(Math.max(0, MIN_LOADING_TIME - elapsed));

      if (data.success && data.unassignedComplaintRequest) {
        navigate('/detail_compliant', { state: { complaint_id: data.unassignedComplaintRequest.complaint_id } });
        setSnackbar({ open: true, message: 'Complaint assigned successfully.', severity: 'success' });
        fetchComplaints();
      } else {
        setSnackbar({ open: true, message: data.message || 'No new request found.', severity: 'info' });
      }
    } catch (error) {
      let errorMessage = 'Unable to retrieve complaint. Please try again.';
      if (error.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('network') || msg.includes('timeout')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (msg.includes('404') || msg.includes('not found')) {
          errorMessage = 'No new complaints available at this time.';
        } else if (msg.length < 100) {
          errorMessage = error.message;
        }
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = complaintId => {
    if (!complaintId) return;
    navigate('/detail_compliant', { state: { complaint_id: complaintId } });
  };

  // Maps raw status to a display label and color using theme
  const getProgressStatus = (status) => {
    return getStatusMeta(theme, status);
  };

  const columns = useMemo(() => ([
    { id: 'no', label: 'No.', width: '70px', sortable: true },
    { id: 'fileNumber', label: 'Fille Number', sortable: true },
    { id: 'judgeName', label: 'Judge Name', sortable: true },
    { id: 'requestedAt', label: 'Requested At', sortable: true },
    {
      id: 'status',
      label: 'Status',
      render: row => {
        const progress = getProgressStatus(row.status);
        return (
          <Box
            sx={{
              display: 'inline-block',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: 12,
              color: progress.color,
            }}
          >
            {progress.label}
          </Box>
        );
      },
    },
    {
      id: 'action',
      label: 'Action',
      align: 'center',
      render: row => (
        <IconButton
          aria-label="view"
          onClick={() => handleViewComplaint(row.complaintId)}
          disabled={!row.complaintId}
          sx={{ color: '#1E516A' }}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ]), [handleViewComplaint, theme]);

  return (
    <>
      {loading && <Loading open={loading} />}
      <GetHeroLayout
        title={t('request.getRequestFoundCompliant')}
        subtitle={t('request.getRequestFoundDetail')}
        actionLabel={t('request.getRequest')}
        actionIcon={<ArrowDownOnSquareStackIcon style={{ width: 18, height: 18, marginRight: 6}} />}
        onAction={handleGetRequest}
        loading={loading}
      >
        <Box sx={{ width: '100%' }}>
          <StandardTable
            columns={columns}
            rows={allRows}
            loading={tableLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event, value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            initialSort={{ id: 'requestedAt', direction: 'desc' }}
          />
        </Box>
      </GetHeroLayout>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default GetComplaint;
