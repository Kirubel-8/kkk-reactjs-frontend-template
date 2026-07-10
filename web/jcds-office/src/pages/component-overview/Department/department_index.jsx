import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {InputAdornment, Alert, Box, Button, CircularProgress, IconButton, Snackbar, TextField, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DepartmentService from '../../../service/department.service';
import ConfirmDialog from '../Modal/deleteModal';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; 
const DepartmentTable = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const fetchedDepartments = await DepartmentService.getAllDepartments();
      const sortedDepartments = fetchedDepartments
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((department, index) => ({ ...department, NO: index + 1 }));

      setDepartments(sortedDepartments);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = (departmentId) => {
    setDepartmentToDelete(departmentId);
    setOpenDeleteModal(true);
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setDepartmentToDelete(null);
  };

  const confirmDelete = async () => {
    try {
      await DepartmentService.deleteDepartment(departmentToDelete);
      setOpenDeleteModal(false);
      setDepartmentToDelete(null);
      fetchDepartments();
      setSnackbarMessage(t('user.DeleteSuccess'));
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(t('user.DeleteFailure'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const columns = [
    {
      field: 'NO',
      headerName: t('#'),
      width: 160,
      // align: 'center',
      // headerAlign: 'center'
    },
    { field: 'name', headerName: t('user.DepartmentName'), flex: 2, minWidth: 120 },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 190,
      flex: 6,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton sx={{color:"#767676"}} onClick={() => handleEdit(params.row.department_id)}>
              <EditIcon  />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
             <IconButton 
                       color="secondary" 
                       sx={{ color: "#FF8E7F" }} 
                       onClick={() => handleDelete(params.row.department_id)}>
                       <DeleteIcon sx={{ fontSize: "19px" }} />
                     </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = departments.filter((department) => department.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddDepartment = () => {
    navigate('/add-department');
  };

  const handleEdit = (id) => {
    navigate('/edit-department', { state: { id } });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div>
       <Box sx={{display:"flex",justifyContent:"flex-end",marginBottom:"10px"}}>
              <Button 
          onClick={handleAddDepartment} 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon  />}
          sx={{
            width: "190px",
            borderRadius: "8px",
            "& .MuiButton-startIcon": { 
              "& svg": {
                fontSize: "19px",
              }
            }
          }}
        >
           {t('user.AddDepartment')}
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
            
         <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
  <Typography sx={{ fontWeight: "bold", color: "#2E3180", fontFamily: "'Montserrat', sans-serif" }} variant="h5">
    Department | Table
  </Typography>
  
  <TextField
    size="small"
    placeholder="Search"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    sx={{
      width: '25%',
      minWidth: 200,
      backgroundColor: "#f5f5f5",
      borderRadius: "15px",
      
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        paddingLeft: "8px",
      },
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ color: "gray" }} />
        </InputAdornment>
      ),
      sx: {
        backgroundColor: "#f5f5f5",
        '&:hover': {
          backgroundColor: "#e0e0e0",
        },
        '&.Mui-focused': {
          backgroundColor: "#f5f5f5",
        },
      },
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
            getRowId={(row) => row.department_id}
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
                backgroundColor: 'white',
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: theme.palette.grey[200],
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
          title={t('user.ConfirmDeletion')}
          description={t('user.ConfirmDeletionDescription')}
          confirmText={t('common.DeleteButton')}
          cancelText={t('common.CancelButton')}
        />

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
};

export default DepartmentTable;
