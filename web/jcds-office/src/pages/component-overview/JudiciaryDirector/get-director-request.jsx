import { Alert, Box, IconButton, Snackbar } from '@mui/material';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import judiciaryDirectorService from '../../../service/judiciaryDirector.service';
import { Loading } from '../PageLoading/PageLoading';
import authService from '../../../service/auth.service';
import GetHeroLayout from '../../../components/common/GetHeroLayout';
import StandardTable from '../../../components/common/StandardTable';
import Visibility from '@mui/icons-material/Visibility';

export const GetDirectorRequest = () => {
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

  const hasPermission = (resource, action) =>
    permissions.some((p) => p.resource === resource && p.action === action);

  const canGetComplaint = hasPermission('JudiciaryDirectorate', 'reviewDisciplinaryComplaint');

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchAssignedCases = async () => {
    setTableLoading(true);
    try {
      const res = await judiciaryDirectorService.getAllAssignedCases({ case_status: "pending_director_approval" });
      const data = res.data.map((item, index) => {
        return {
          id: item.disciplinary_complaint_id || index,
          disp_Id: item.disciplinary_complaint_id || index,
          no: index + 1,
          judge_name: item.judge_name,
          court_office: item.court_office,
          file_number: item.file_number,
          // status: item.status || "N/A",
          case_status: item.case?.status || "N/A",
          createdAt: new Date(item.createdAt).toISOString().split("T")[0],
          applicant_name: item.applicant?.full_name || 'N/A',
        };
      });
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
      // setSnackbar({
      //   open: true,
      //   message: "No assigned cases found or failed to fetch.",
      //   severity: "warning",
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

        const stored = localStorage.getItem('permissions');
        if (stored) {
          setPermissions(JSON.parse(stored));
          setPermissionsLoading(false);
        }

        try {
          const response = await authService.getPermissionsByUserId(userId);
          const freshPermissions = response.data.permissions || [];
          setPermissions(freshPermissions);
          localStorage.setItem('permissions', JSON.stringify(freshPermissions));
        } catch (error) {
          console.error('Error fetching permissions:', error);
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
    fetchAssignedCases();
  }, []);

  useEffect(() => {
    setTotalCount(rows.length);
  }, [rows]);

  const handleDetail = (item) => {
    if (!item) return;
    navigate('/director-case-detail', {
      state: {
        disp_id: item.disp_Id || item.id,
        caseId: item.case_id
      }
    });
  };

  const handleGetCase = async () => {
    const MIN_LOADING_TIME = 1000;
    const MAX_WAIT_TIME = 30000;
    const startTime = Date.now();
    const controller = new AbortController();

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      setLoading(true);
      const timeoutId = setTimeout(() => controller.abort(), MAX_WAIT_TIME);

      const data = await judiciaryDirectorService.getDirectorRequest({
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      await delay(remainingTime);

      if (data.complaint) {
        const complaintData = data.complaint;
        const { disciplinary_complaint_id } = complaintData;

        navigate('/director-case-detail', { state: { disp_id: disciplinary_complaint_id, successMessage: data.message || 'Case assigned for review!' } });
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'No cases pending director review.',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Get Case Error:', error);
      
      if (error.response?.status === 404 && error.response?.data?.message) {
        setSnackbar({
          open: true,
          message: error.response.data.message,
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || error.message || 'Something went wrong.',
          severity: 'error'
        });
      }
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
      { id: 'createdAt', label: 'Assigned Date', sortable: true },
      { id: 'case_status', label: 'Status', sortable: true },
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
        title="Get Pending Records"
        subtitle="Click below to get the next record pending your review as Judiciary Director."
        actionLabel="Get Disciplinary Record"
        actionIcon={<PlusIcon style={{ width: 18, height: 18, marginRight: 6 }} />}
        onAction={
          canGetComplaint
            ? handleGetCase
            : () =>
                setSnackbar({
                  open: true,
                  message: t('common.noPermission') || 'You do not have permission to get a case.',
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

export default GetDirectorRequest;