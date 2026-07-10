import { Alert, Box, IconButton, Snackbar } from '@mui/material';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { default as fileOrganizerService } from '../../../service/fileOrganizer.service';
import { Loading } from '../PageLoading/PageLoading';
import authService from '../../../service/auth.service';
import GetHeroLayout from '../../../components/common/GetHeroLayout';
import StandardTable from '../../../components/common/StandardTable';
import Visibility from '@mui/icons-material/Visibility';

/**
 * Fetches assigned disciplinary complaints for file organizers and displays them with actions.
 */
export const GetFileOrganizerFiles = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const hasPermission = (resource, action) => permissions.some((p) => p.resource === resource && p.action === action);

  const canGetComplaint = hasPermission('JudiciaryInvestigationDirectorate', 'getDisciplinaryComplaint');

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchAssignedComplaints = async () => {
    setTableLoading(true);
    try {
      const res = await fileOrganizerService.getAllAssignedComplaints({ status: 'Opened' });
      const data = res.data.map((item, index) => {
        const comp = item.disciplinary_complaint;
        return {
          id: comp?.disciplinary_complaint_id || item.case_id || index,
          disp_Id: comp?.disciplinary_complaint_id || item.case_id || index,
          no: index + 1,
          judge_name: comp?.judge_name || 'N/A',
          court_office: comp?.court_office || 'N/A',
          file_number: comp?.file_number || item.case_number || 'N/A',
          status: item.status || 'Opened',
          case_id: item.case_id,
          createdAt: new Date(item.createdAt).toISOString().split('T')[0],

          applicant_name: comp?.applicant?.full_name || 'N/A',
          issues_count: comp?.issues?.length || 0,
          evidences_count: comp?.evidences?.length || 0
        };
      });

      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
      // setSnackbar({
      //   open: true,
      //   message: 'No assigned complaints found or failed to fetch.',
      //   severity: 'warning'
      // });
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (!token) {
          setPermissions([]);
          setPermissionsLoading(false);
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;

        // Try to get from localStorage first
        const stored = localStorage.getItem('permissions');
        if (stored) {
          setPermissions(JSON.parse(stored));
          setPermissionsLoading(false);
        }

        // Always fetch fresh from API to ensure we have latest permissions
        try {
          const response = await authService.getPermissionsByUserId(userId);
          const freshPermissions = response.data.permissions || [];
          setPermissions(freshPermissions);
          localStorage.setItem('permissions', JSON.stringify(freshPermissions));
        } catch (error) {
          console.error('Error fetching permissions:', error);
          // If API fails but we have stored permissions, use those
          if (stored) {
            setPermissions(JSON.parse(stored));
          }
        } finally {
          setPermissionsLoading(false);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
        setPermissionsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  useEffect(() => {
    setTotalCount(rows.length);
  }, [rows]);

  const handleDetail = (item) => {
    if (!item) return;
    navigate('/file-organizer-detail', {
      state: {
        disp_id: item.disp_Id || item.id,
        caseId: item.case_id
      }
    });
  };

  const handleGetFiles = async () => {
    const MIN_LOADING_TIME = 1000;
    const MAX_WAIT_TIME = 30000;
    const startTime = Date.now();
    const controller = new AbortController();

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      setLoading(true);
      const timeoutId = setTimeout(() => controller.abort(), MAX_WAIT_TIME);

      const data = await fileOrganizerService.getFileOrganizerFiles({
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await delay(remainingTime);

      if (data.case_id && data.case_number) {
        setSnackbar({
          open: true,
          message: data.message || 'You already have an active case.',
          severity: 'warning'
        });
        return;
      }
      if (data.case) {
        const disciplinaryCase = data.case;

        console.log('File organizer get navigation debug', {
          case_id: disciplinaryCase.case_id,
          case_number: disciplinaryCase.case_number,
          issues: data.issues,
          evidences: data.evidences,
          applicant: data.applicant,
          successMessage: data.message || 'New case assigned successfully!'
        });

        navigate('/file-organizer-detail', {
          state: {
            case_id: disciplinaryCase.case_id,
            caseId: disciplinaryCase.case_id,
            case_number: disciplinaryCase.case_number,
            issues: data.issues,
            evidences: data.evidences,
            applicant: data.applicant,
            successMessage: data.message || 'New case assigned successfully!'
          }
        });

        return;
      }
      setSnackbar({
        open: true,
        message: data.message || 'No open cases available.',
        severity: 'info'
      });
    } catch (error) {
      console.error('Get Files Error:', error);

      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.response?.data?.error || 'Something went wrong.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      { id: 'no', label: 'No.', width: '70px', sortable: true },
      { id: 'file_number', label: 'File Number', sortable: true },
      { id: 'judge_name', label: 'Judge Name', sortable: true },
      { id: 'court_office', label: 'Court Office', sortable: true },
      { id: 'applicant_name', label: 'Applicant', sortable: true },
      { id: 'createdAt', label: 'Assigned Date', sortable: true },
      { id: 'status', label: 'Status', sortable: true },
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
    ],
    [handleDetail]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {loading && <Loading open={loading} />}

      <GetHeroLayout
        title={t('fileOrganizer.getFilesFound')}
        subtitle={t('fileOrganizer.getFilesFoundDetail')}
        actionLabel={t('fileOrganizer.getComplaint')}
        actionIcon={<PlusIcon style={{ width: 18, height: 18, marginRight: 6 }} />}
        onAction={
          canGetComplaint
            ? handleGetFiles
            : () =>
                setSnackbar({
                  open: true,
                  message: t('common.noPermission') || 'You do not have permission to get a complaint.',
                  severity: 'warning'
                })
        }
        loading={loading}
      >
        <Box sx={{ width: '100%' }}>
          <StandardTable
            columns={columns}
            rows={rows}
            loading={tableLoading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event, value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            initialSort={{ id: 'createdAt', direction: 'desc' }}
          />
        </Box>
      </GetHeroLayout>

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

export default GetFileOrganizerFiles;
