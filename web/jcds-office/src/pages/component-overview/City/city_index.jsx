import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CityService from '../../../service/city.service';
import ConfirmDialog from '../Modal/deleteModal';

const CityTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [cityToDelete, setCityToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [cities, setCities] = useState([]);
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

  const fetchCity = async () => {
    setLoading(true);
    try {
      const response = await CityService.getAllCities();
      const fetchedCity = response.cities;
  
      if (Array.isArray(fetchedCity)) {
        const sortedCity = fetchedCity
          .sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1))
          .map((city, index) => ({ ...city, NO: index + 1 }));
        setCities(sortedCity);
      } else {
        throw new Error('Fetched data is not in the expected format.');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to fetch cities',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCity();
  }, []);

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setCityToDelete(null);
  };

  const handleDelete = (id) => {
    setCityToDelete(id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await CityService.deleteCity(cityToDelete);
      setOpenDeleteModal(false);
      setCityToDelete(null);
      fetchCity();
      setSnackbar({
        open: true,
        message: 'City deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting city:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete city. Please try again.',
        severity: 'error'
      });
    }
  };

  const columns = [
    {
      field: 'NO',
      headerName: 'No',
      width: 70,
      align: 'center',
      headerAlign: 'center'
    },
    { field: 'name', headerName: 'City Administration', flex: 1, minWidth: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(params.row.city_id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={() => handleDelete(params.row.city_id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = cities.filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddCityAdmin = () => {
    navigate('/add-city-administration');
  };

  const handleEdit = (id) => {
    navigate('/edit-city-administration', { state: { id } });
  };

  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 1,
        boxShadow: 3,
        bgcolor: 'background.paper',
        padding: 2
      }}
    >
      <ConfirmDialog
        open={openDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this city? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '20%', minWidth: 200 }}
          InputLabelProps={{
            sx: { top: '4px' }
          }}
        />
        {!isSmallScreen && (
          <Button onClick={handleAddCityAdmin} variant="contained" color="primary">
            Add City Administration
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        columns={columns}
        rows={filteredRows}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5, 10, 25, 100]}
        pagination
        autoHeight
        getRowId={(row) => row.city_id}
        disableColumnMenu
        loading={loading}
        components={{ Toolbar: GridToolbarFilterButton }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.grey[100],
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 'bold'
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

export default CityTable;
