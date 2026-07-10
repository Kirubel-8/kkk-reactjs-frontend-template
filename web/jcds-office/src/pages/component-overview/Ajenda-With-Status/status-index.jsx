import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  InputAdornment,
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgendaService from '../../../service/ajenda.service';
import StatusWithAgendaService from '../../../service/status.service';
import ConfirmDialog from '../Modal/deleteModal';
import FormModal from '../Modal/FormModal';
import AddAgendaStatus from '../Ajenda-With-Status/status-add';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const StatusWithAgendaTable = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [statuses, setStatuses] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [rows, setRows] = useState([]);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedStatuses, fetchedAgendas] = await Promise.all([
        StatusWithAgendaService.getAllStatusesWithAgendas(),
        AgendaService.getAllAgendas()
      ]);
      setStatuses(fetchedStatuses);
      setAgendas(fetchedAgendas);

      const transformedRows = fetchedStatuses.map((status, index) => ({
        id: status.status_id,
        NO: index + 1,
        name: status.name,
        description: status.description,
        type: status.type,
        decision_type: status.decision_type,
        agendaName: getAgendaName(fetchedAgendas, status.agenda_id)
      }));
      setRows(transformedRows);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getAgendaName = (agendas, agendaId) => {
    const agenda = agendas.find((a) => a.agenda_id === agendaId);
    return agenda ? agenda.name : t('ajenda.unknown_agenda');
  };

  const handleAddStatusWithAgenda = () => {
    setOpenAddModal(true);
  };

  const handleEdit = (id) => {
    navigate('/edit-ajenda-status', { state: { id } });
  };

  const handleDelete = (id) => {
    setStatusToDelete(id);
    setOpenDeleteModal(true);
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setStatusToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await StatusWithAgendaService.deleteStatusWithAgenda(statusToDelete);
      setOpenDeleteModal(false);
      setStatusToDelete(null);
      setSnackbar({
        open: true,
        message: t('ajenda.status_deleted_success'),
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('ajenda.status_deleted_fail'),
        severity: 'error'
      });
    } finally {
      fetchData();
    }
  };

  const columns = [
    { field: 'NO', headerName: t('ajenda.no'), width: 80 },
    { field: 'agendaName', headerName: t('ajenda.Agenda_name'), flex: 1, minWidth: 150 },
    { field: 'name', headerName: t('ajenda.agenda_status_name'), flex: 1, minWidth: 120 },
    { field: 'type', headerName: t('ajenda.status_type'), flex: 1, minWidth: 150 },
    { field: 'decision_type', headerName: t('ajenda.decision_type'), flex: 1, minWidth: 150 },
    { field: 'description', headerName: t('ajenda.agenda_description'), flex: 1, minWidth: 180 },
    {
      field: 'actions',
      headerName: t('ajenda.actions'),
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('ajenda.edit')}>
            <IconButton color="primary" onClick={() => handleEdit(params.row.id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('ajenda.delete')}>
            <IconButton color="secondary" sx={{ color: '#FF8E7F' }} onClick={() => handleDelete(params.row.id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = rows.filter(
    (row) =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.agendaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <Button
          onClick={handleAddStatusWithAgenda}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{
            width: '230px',
            borderRadius: '8px',
            '& .MuiButton-startIcon': {
              '& svg': {
                fontSize: '19px'
              }
            }
          }}
        >
          {t('ajenda.add_status_with_agenda')}
        </Button>
      </Box>

      <Box
        sx={{
          width: '100%',
          borderRadius: 7,
          boxShadow: 'none',
          bgcolor: 'background.paper',
          padding: 2,
          border: '1px solid',
          borderColor: 'grey.300'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 'bold', color: '#2E3180', fontFamily: "'Montserrat', sans-serif" }} variant="h5">
            {t('ajenda.agenda_status_table_title')}
          </Typography>

          <TextField
            size="small"
            placeholder={t('ajenda.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '25%',
              minWidth: 200,
              backgroundColor: '#f5f5f5',
              borderRadius: '15px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                paddingLeft: '8px'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'gray' }} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#e0e0e0'
                },
                '&.Mui-focused': {
                  backgroundColor: '#f5f5f5'
                }
              }
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box color="error.main" textAlign="center">
            {error}
          </Box>
        ) : (
          <DataGrid
            columns={columns}
            rows={filteredRows}
            pageSize={pageSize}
            onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
            rowsPerPageOptions={[5, 10, 25, 100]}
            pagination
            autoHeight
            disableColumnMenu
            components={{ Toolbar: GridToolbarFilterButton }}
            columnBuffer={isSmallScreen ? 2 : 6}
            getRowId={(row) => row.id}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.primary,
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: "'Montserrat', sans-serif"
              },
              '& .MuiDataGrid-cell': {
                color: theme.palette.text.primary,
                fontSize: '0.9rem',
                fontFamily: 'Arial, sans-serif',
                borderBottom: `1px solid ${theme.palette.grey[300]}`
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: 'white'
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: theme.palette.grey[200]
              },
              '& .MuiDataGrid-footerContainer': {
                backgroundColor: theme.palette.grey[100],
                padding: '4px 8px'
              }
            }}
          />
        )}

        <ConfirmDialog
          open={openDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={t('ajenda.confirm_delete_title')}
          description={t('ajenda.confirm_delete_description')}
          confirmText={t('ajenda.confirm_delete_button')}
          cancelText={t('ajenda.cancel_button')}
        />

        <FormModal
          open={openAddModal}
          onClose={() => {
            setOpenAddModal(false);
            fetchData();
          }}
          title={t('ajenda.add_status_with_agenda')}
        >
          <AddAgendaStatus
            onClose={() => {
              setOpenAddModal(false);
              fetchData();
            }}
          />
        </FormModal>

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
    </div>
  );
};

export default StatusWithAgendaTable;
