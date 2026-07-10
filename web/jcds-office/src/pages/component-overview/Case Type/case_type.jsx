import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, Snackbar, TextField, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CaseType from '../../../service/case.type';
import ConfirmDialog from '../Modal/deleteModal';
import FormModal from '../Modal/FormModal';
import AddCaseType from '../Case Type/case_type_add';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

const CaseTypeTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [types, setTypes] = useState([]);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchType = async () => {
    setLoading(true);
    try {
      const fetchedType = await CaseType.getAllCaseTypes();
      const sortedType = fetchedType
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((type, index) => ({ ...type, NO: index + 1 }));
      setTypes(sortedType);
    } catch (error) {
      setError(t('case.fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchType();
  }, []);

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setTypeToDelete(null);
  };

  const handleDelete = (id) => {
    setTypeToDelete(id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await CaseType.deleteCaseType(typeToDelete);
      setOpenDeleteModal(false);
      setTypeToDelete(null);
      fetchType();
      setSnackbar({
        open: true,
        message: t('case.delete_success'),
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting case type:', error);
      setSnackbar({
        open: true,
        message: t('case.delete_failed'),
        severity: 'error'
      });
    }
  };

  const handleEdit = (id) => {
    navigate('/case_type_update', { state: { id } });
  };

  const handleAddType = () => {
    setOpenAddModal(true);
  };

  const filteredRows = types.filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const columns = [
    {
      field: 'NO',
      headerName: t('case.no'),
      width: 70,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'name',
      headerName: t('case.case_type'),
      flex: 1,
      minWidth: 120
    },
    {
      field: 'actions',
      headerName: t('case.actions'),
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('case.edit')}>
            <IconButton color="primary" onClick={() => handleEdit(params.row.case_type_id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('case.delete')}>
            <IconButton sx={{ color: '#FF8E7F' }} onClick={() => handleDelete(params.row.case_type_id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <Button
          onClick={handleAddType}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{
            width: '190px',
            borderRadius: '8px',
            '& .MuiButton-startIcon': {
              '& svg': {
                fontSize: '19px'
              }
            }
          }}
        >
          {t('case.add_case_type')}
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
            {t('case.table_title')}
          </Typography>

          <TextField
            size="small"
            placeholder={t('case.search')}
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
            getRowId={(row) => row.case_type_id}
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
              },
              '& .MuiDataGrid-selectedRowCount': {
                color: theme.palette.text.secondary
              }
            }}
          />
        )}

        <ConfirmDialog
          open={openDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title={t('case.confirm_delete_title')}
          description={t('case.confirm_delete_desc')}
          confirmText={t('case.confirm')}
          cancelText={t('case.cancel')}
        />

        <FormModal
          open={openAddModal}
          onClose={() => {
            setOpenAddModal(false);
            fetchType();
          }}
          title={t('case.add_case_type')}
        >
          <AddCaseType
            onClose={() => {
              setOpenAddModal(false);
              fetchType();
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

export default CaseTypeTable;
