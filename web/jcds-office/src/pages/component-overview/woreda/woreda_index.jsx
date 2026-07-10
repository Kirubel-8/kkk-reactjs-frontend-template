import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cityService from 'service/city.service';
import subCityService from 'service/subCity.service';
import RegionService from '../../../service/region.service';
import WoredaService from '../../../service/woreda.service';
import ZoneService from '../../../service/zone.service';
import ConfirmDialog from '../Modal/deleteModal';

const WoredaTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [woredaToDelete, setWoredaToDelete] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedWoredas, fetchedZones, fetchedRegions, fetchedCity, fetchedSubCity] = await Promise.all([
          WoredaService.getAllWoredas(),
          ZoneService.getAllZone(),
          RegionService.getAllRegion(),
          cityService.getAllCities(),
          subCityService.getAllSubcities()
        ]);
        const transformedRows = fetchedWoredas.map((woreda, index) => {
          console.log(fetchedSubCity);
          const zone = fetchedZones.find((z) => z.zone_id === woreda.zone_id);
          const subcity = fetchedSubCity.subcities.find((s) => s.subcity_id === woreda.subcity_id);
          const region = fetchedRegions.find((r) => r.region_id === zone?.region_id);
          const city = fetchedCity.cities.find((c) => c.city_id === subcity?.city?.city_id);

          const regionName = region?.name || city?.name || 'Unknown';
          const zoneName = zone?.name || subcity?.name || 'Unknown';
          return {
            id: woreda.woreda_id,
            number: index + 1,
            regionName,
            zoneName,
            woredaName: woreda.name
          };
        });
        setRows(transformedRows);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRows = rows.filter(
    (row) =>
      row.regionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.woredaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWoreda = () => {
    navigate('/woreda-add');
  };

  const handleEdit = (id) => {
    navigate('/edit-woreda', { state: { id } });
  };

  const handleDeleteDialogOpen = (id) => {
    setWoredaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setWoredaToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    try {
      await WoredaService.deleteWoreda(woredaToDelete);
      setRows((prevRows) => prevRows.filter((row) => row.id !== woredaToDelete));
      setSnackbarMessage('Woreda deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Error deleting woreda:', error);
      setSnackbarMessage('Failed to delete woreda. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'number', headerName: 'No', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'regionName', headerName: 'Region', flex: 1, minWidth: 120 },
    { field: 'zoneName', headerName: 'Zone', flex: 1, minWidth: 120 },
    { field: 'woredaName', headerName: 'Woreda', flex: 1, minWidth: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(params.row.id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={() => handleDeleteDialogOpen(params.row.id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

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
          <Button onClick={handleAddWoreda} variant="contained" color="primary">
            Add Woreda
          </Button>
        )}
      </Box>
      {error ? (
        <div>Error: {error}</div>
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
            },
            '& .MuiDataGrid-main': {
              overflowX: 'auto'
            }
          }}
          columnBuffer={isSmallScreen ? 2 : 6}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDelete}
        title="Delete Woreda"
        description="Are you sure you want to delete this woreda? This action cannot be undone."
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
  );
};

export default WoredaTable;
