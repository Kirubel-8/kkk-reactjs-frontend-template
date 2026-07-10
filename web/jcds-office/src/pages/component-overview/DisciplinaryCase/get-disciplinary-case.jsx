import { Alert, Box, Snackbar, Typography, IconButton, useTheme, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import disciplineCaseService from '../../../service/disciplinary.service';
import { Loading } from '../PageLoading/PageLoading';
import GetHeroLayout from '../../../components/common/GetHeroLayout';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';
import Visibility from '@mui/icons-material/Visibility';

export const GetDisciplineRequest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [hasExpiring, setHasExpiring] = useState(false);
  const [rows, setRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [expiringRows, setExpiringRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tableLoading, setTableLoading] = useState(false);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  const theme = useTheme();

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleGetRequest = async () => {
    const MIN_LOADING_TIME = 1000;
    const MAX_WAIT_TIME = 30000;
    const startTime = Date.now();
    const controller = new AbortController();
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      setLoading(true);
      const timeoutId = setTimeout(() => controller.abort(), MAX_WAIT_TIME);

      const data = await disciplineCaseService.getDisciplinaryRequest({ signal: controller.signal });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await delay(remainingTime);

      if (data.complaint?.disciplinary_complaint_id) {
        navigate('/disciplinary_detail', { state: { disp_id: data.complaint.disciplinary_complaint_id } });
        return;
      }

      if (data.dispComplaint?.disciplinary_complaint_id) {
        setSnackbar({ open: true, message: data.message || 'New request assigned.', severity: 'success' });
        navigate('/disciplinary_detail', { state: { disp_id: data.dispComplaint.disciplinary_complaint_id } });
        return;
      }

      setSnackbar({ open: true, message: data.message || 'No new request found.', severity: 'info' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Something went wrong.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedCases = async () => {
    setTableLoading(true);
    try {
      const res = await disciplineCaseService.getAssignedDisciplinaryRequests('under_investigation');
      const data = res.data.map((item, index) => ({
        id: item.disciplinary_complaint_id || index,
        disp_Id: item.disciplinary_complaint_id || index,
        judge_name: item.judge_name,
        court_office: item.court_office,
        file_number: item.file_number,
        status: item.status,
        case_status: item.case?.status || item.status || null,
        createdAt: new Date(item.createdAt).toISOString().split('T')[0]
      }));
      setBaseRows(data);
    } catch (error) {
      console.error(error);
      setBaseRows([]);
      // setSnackbar({ open: true, message: error.response?.data?.message || error.message || 'Something went wrong.', severity: 'error' });
    } finally {
      setTableLoading(false);
    }
  };

  const fetchExpiringCases = async () => {
    setExpiringLoading(true);
    try {
      const res = await disciplineCaseService.getExpiringDisciplinary();
      const data = res.data.map((item, index) => ({
        id: item.disciplinary_complaint_id || index,
        disp_Id: item.disciplinary_complaint_id || index,
        judge_name: item.judge_name,
        file_number: item.file_number,
        createdAt: new Date(item.createdAt).toISOString().split('T')[0],
        status: 'Expiring',
        case_status: 'Expiring'
      }));
      setExpiringRows(data);
      setHasExpiring(data.length > 0);
      if (data.length > 0) {
        const timer = setTimeout(() => setShowExpiringModal(true), 2000);
        return () => clearTimeout(timer);
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching expiring cases:', error);
      setExpiringRows([]);
      setHasExpiring(false);
      return undefined;
    } finally {
      setExpiringLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchAssignedCases();
    fetchExpiringCases();
  }, []);

  useEffect(() => {
    const merged = new Map();
    baseRows.forEach((item) => {
      const key = item.disp_Id || item.id || item.file_number;
      merged.set(key, item);
    });
    expiringRows.forEach((item) => {
      const key = item.disp_Id || item.id || item.file_number;
      if (!merged.has(key)) {
        merged.set(key, item);
      }
    });
    const mergedArray = Array.from(merged.values()).map((item, index) => ({
      ...item,
      rowNumber: index + 1
    }));
    setRows(mergedArray);
  }, [baseRows, expiringRows]);

  useEffect(() => {
    if (!hasExpiring || expiringRows.length === 0) return;
    const timer = setTimeout(() => setShowExpiringModal(true), 2000);
    return () => clearTimeout(timer);
  }, [hasExpiring, expiringRows]);

  const handleDetail = (row) => {
    if (!row?.disp_Id) return;
    navigate('/disciplinary_detail', { state: { disp_id: row.disp_Id } });
  };

  const handleCloseExpiringModal = () => setShowExpiringModal(false);

  // setup the table structure
  const columns = useMemo(
    () => [
      { id: 'rowNumber', label: 'No.', width: '70px' },
      {
        id: 'judge_name',
        label: 'Judge Name',
        sortable: true,
        render: (row) => <Typography sx={{ fontWeight: 600 }}>{row.judge_name}</Typography>
      },
      { id: 'court_office', label: 'Court Office', sortable: true },
      { id: 'file_number', label: 'File Number', sortable: true },
      {
        id: 'case_status',
        label: 'Case Status',
        render: (row) => {
          const statusValue = row.case_status || row.status;
          const meta = getStatusMeta(theme, statusValue);
          return (
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                color: meta?.color || '#777',
                fontWeight: 'bold',
                fontSize: 12
              }}
            >
              {meta?.label || statusValue || 'Pending'}
            </Box>
          );
        }
      },
      { id: 'createdAt', label: 'Created Date', sortable: true },
      {
        id: 'action',
        label: 'Action',
        align: 'center',
        render: (row) => {
          const isPending = row.case_status === 'pending';
          return (
            <IconButton
              onClick={() => !isPending && handleDetail(row)}
              disabled={isPending}
              sx={{
                color: '#2E3180',
                '&:hover': { backgroundColor: '#e0e0e0' },
                opacity: isPending ? 0.5 : 1
              }}
              title={isPending ? 'Get Complaint First' : 'View Details'}
            >
              <Visibility />
            </IconButton>
          );
        }
      }
    ],
    [handleDetail, theme]
  );

  const expiringColumns = useMemo(
    () => [
      { id: 'rowNumber', label: 'No.', width: '70px' },
      { id: 'judge_name', label: 'Judge Name', sortable: true },
      { id: 'file_number', label: 'File Number', sortable: true },
      { id: 'createdAt', label: 'Requested At', sortable: true }
    ],
    []
  );

  return (
    <Box sx={{ width: '100%' }}>
      {loading && <Loading open={loading} />}
      <GetHeroLayout
        title={t('request.getRequestFound')}
        subtitle={t('request.getRequestFoundDetail')}
        actionLabel={t('request.getRequest')}
        actionIcon={<PlusIcon style={{ width: 18, height: 18, marginRight: 6 }} />}
        onAction={handleGetRequest}
        loading={loading}
      >
        <Box sx={{ width: '100%' }}>
          <StandardTable
            columns={columns}
            rows={rows}
            loading={tableLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={rows.length}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event, value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            initialSort={{ id: 'createdAt', direction: 'desc' }}
          />
        </Box>
      </GetHeroLayout>

      {hasExpiring && (
        <Dialog open={showExpiringModal} onClose={handleCloseExpiringModal} maxWidth="md" fullWidth>
          <DialogTitle>Expiring Disciplinary Cases</DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%', mt: 1 }}>
              <StandardTable
                columns={expiringColumns}
                rows={expiringRows.map((item, index) => ({ ...item, rowNumber: index + 1 }))}
                loading={expiringLoading}
                page={0}
                rowsPerPage={expiringRows.length || 5}
                totalCount={expiringRows.length}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
                initialSort={{ id: 'createdAt', direction: 'desc' }}
                hidePagination={expiringRows.length <= 5}
              />
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GetDisciplineRequest;
