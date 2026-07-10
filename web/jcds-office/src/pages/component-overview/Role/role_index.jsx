import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import {
  InputAdornment, Alert, Box, Button, IconButton, Snackbar, TextField,
  Tooltip, Typography, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import RoleService from '../../../service/role.service';
import ConfirmDialog from '../Modal/deleteModal';
import RoleDetailModal from '../Modal/RoleDetailModal';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const RoleTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [paginationModel, setPaginationModel] = useState({ pageSize: 5, page: 0 });
  const [totalPages, setTotalPages] = useState(0);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const { t } = useTranslation();

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchRole = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = paginationModel;
      const offset = page * pageSize;
      const fetchedRoles = await RoleService.getAllRoles({ page, limit: pageSize });
      const totalPages = fetchedRoles.pagination.totalPages;
      const sortedRoles = fetchedRoles.roles
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((role, index) => ({ ...role, NO: offset + index + 1 }));
      setRoles(sortedRoles);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [paginationModel]);

  const handlePaginationChange = (newPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const columns = [
    {
      field: 'NO',
      headerName: '#',
      width: 160
    },
    { field: 'name', headerName: t('user.RoleName'), flex: 1, minWidth: 120 },
    { field: 'description', headerName: t('user.Description'), flex: 1, minWidth: 120 },
    {
      field: 'actions',
      headerName: t('user.Actions'),
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('user.Edit')}>
            <IconButton color="primary" onClick={() => handleShow(params.row.role_id)}>
              <EyeOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('user.Edit')}>
            <IconButton sx={{ color: "#3470FF" }} onClick={() => handleEdit(params.row.role_id)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('user.Delete')}>
            <IconButton sx={{ color: '#FF8E7F' }} onClick={() => handleDelete(params.row.role_id)}>
              <DeleteIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setRoleToDelete(null);
  };

  const filteredRows = roles.filter(
    (row) =>
      row.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRole = () => {
    navigate('/add-role');
  };

  const handleShow = async (roleId) => {
    try {
      const singleRoleData = await RoleService.getRoleById(roleId);
      setFormValues({
        name: singleRoleData.name || '',
        description: singleRoleData.description || '',
        permissions: singleRoleData.permissions.reduce((acc, perm) => {
          const resource = perm.resource;
          const permissionName = perm.action;
          if (resource && permissionName) {
            acc[resource] = [...(acc[resource] || []), permissionName];
          }
          return acc;
        }, {})
      });

      setOpenModal(true);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const handleEdit = (id) => {
    navigate('/edit-role', { state: { id } });
  };

  const handleDelete = (roleId) => {
    setRoleToDelete(roleId);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await RoleService.deleteRole(roleToDelete);
      setOpenDeleteModal(false);
      setRoleToDelete(null);
      fetchRole();
      setSnackbar({
        open: true,
        message: t('user.DeleteSuccess'),
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      setSnackbar({
        open: true,
        message: t('user.DeleteFailure'),
        severity: 'error'
      });
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <Button
          onClick={handleAddRole}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{
            width: '160px',
            borderRadius: '8px',
            '& .MuiButton-startIcon': {
              '& svg': {
                fontSize: '19px'
              }
            }
          }}
        >
          {t('user.Add_Role')}
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
        <ConfirmDialog
          open={openDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={t('user.ConfirmDeletion')}
          description={t('user.ConfirmDeletionDescription')}
          confirmText={t('user.Delete')}
          cancelText={t('user.Cancel')}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 'bold', color: '#2E3180', fontFamily: "'Montserrat', sans-serif" }} variant="h5">
            {t('user.RoleTable')}
          </Typography>

          <TextField
            size="small"
            placeholder={t('user.Search')}
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
        ) : (
          <div>
            <DataGrid
              columns={columns}
              rows={filteredRows}
              page={paginationModel.page}
              pageSize={paginationModel.pageSize}
              rowsPerPageOptions={[5, 10, 25, 100]}
              paginationModel={paginationModel}
              pageSizeOptions={[5, 10, 25, 100]}
              onPaginationModelChange={handlePaginationChange}
              pagination
              autoHeight
              disableColumnMenu
              loading={loading}
              rowCount={totalPages * paginationModel.pageSize}
              paginationMode="server"
              components={{
                Toolbar: GridToolbarFilterButton,
                NoRowsOverlay: () => (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      color: theme.palette.text.secondary
                    }}
                  >
                    {error ? t('user.ErrorFetchingRequests') : t('user.NoRequests')}
                  </Box>
                )
              }}
              getRowId={(row) => row.role_id}
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
                '& .MuiDataGrid-footerContainer': {
                  backgroundColor: theme.palette.grey[100],
                  padding: '4px 8px'
                },
                '& .MuiDataGrid-selectedRowCount': {
                  color: theme.palette.text.secondary
                }
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </div>
        )}

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

        <RoleDetailModal open={openModal} onClose={handleCloseModal} formValues={formValues} />
      </Box>
    </div>
  );
};

export default RoleTable;
