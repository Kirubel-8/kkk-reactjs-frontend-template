import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubCityService from '../../../service/subCity.service';
import CityService from '../../../service/city.service';
import ConfirmDialog from '../Modal/deleteModal';

const SubCityTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [subCities, setSubCities] = useState([]);
  const [cities, setCities] = useState([]);
  const [rows, setRows] = useState([]);
  const [subCityToDelete, setSubCityToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subCityResponse, cityResponse] = await Promise.all([
        SubCityService.getAllSubcities(),
        CityService.getAllCities(),
      ]);
  
      const fetchedSubCities = subCityResponse.subcities;
      const fetchedCities = cityResponse.cities;
  
      setSubCities(fetchedSubCities);
      setCities(fetchedCities);
  
      const transformedRows = fetchedSubCities.map((subcity, index) => ({
        id: subcity.subcity_id,
        NO: index + 1,
        name: subcity.name,
        cityName: getCityName(fetchedCities, subcity.city.city_id),
      }));
  
      setRows(transformedRows);
    } catch (error) {
      setError(error.message);
      console.error("Error in fetchData:", error);
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
  const getCityName = (cities, cityId) => {
    if (!Array.isArray(cities)) {
      console.error("Expected an array for cities, got:", cities);
      return "Unknown City";
    }
  
    const city = cities.find((r) => r.city_id === cityId);
    return city ? city.name : "Unknown City";
  };
  

  const handleAddSubCity = () => {
    navigate('/sub-city-add');
  };

  const handleEdit = (id) => {
    navigate('/edit-sub-city', { state: { id } });
  };

  const handleDelete = (id) => {
    setSubCityToDelete(id);
    setOpenDeleteModal(true);
  };
  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setSubCityToDelete(null);
  };
  const confirmDelete = async () => {
    try {
      await SubCityService.deleteSubcity(subCityToDelete);
      setOpenDeleteModal(false);
      setSubCityToDelete(null);
      setSnackbar({
        open: true,
        message: 'Sub City deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting sub city:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete sub city. Please try again.',
        severity: 'error'
      });
    } finally {
      fetchData();
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
    { field: 'name', headerName: 'Sub City', flex: 1, minWidth: 120 },
    {
      field: 'cityName',
      headerName: 'City',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row.id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row.id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </>
      )
    }
  ];

  const filteredRows = rows.filter(
    (row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()) || row.cityName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        description="Are you sure you want to delete this sub city? This action cannot be undone."
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
          <Button onClick={handleAddSubCity} variant="contained" color="primary">
            Add Sub City
          </Button>
        )}
      </Box>

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
          }
        }}
        columnBuffer={isSmallScreen ? 2 : 6}
        loading={loading}
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

export default SubCityTable;
