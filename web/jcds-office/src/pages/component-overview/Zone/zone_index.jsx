import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionService from '../../../service/region.service';
import ZoneService from '../../../service/zone.service';
import ConfirmDialog from '../Modal/deleteModal';

const ZoneTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [rows, setRows] = useState([]);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedZones, fetchedRegions] = await Promise.all([ZoneService.getAllZone(), RegionService.getAllRegion()]);
      setZones(fetchedZones);
      setRegions(fetchedRegions);

      const transformedRows = fetchedZones.map((zone, index) => ({
        id: zone.zone_id,
        NO: index + 1,
        name: zone.name,
        regionName: getRegionName(fetchedRegions, zone.region_id)
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
  const getRegionName = (regions, regionId) => {
    const region = regions.find((r) => r.region_id === regionId);
    return region ? region.name : 'Unknown Region';
  };

  const handleAddZone = () => {
    navigate('/zone-add');
  };

  const handleEdit = (id) => {
    navigate('/edit-zone', { state: { id } });
  };

  const handleDelete = (id) => {
    setZoneToDelete(id);
    setOpenDeleteModal(true);
  };
  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setZoneToDelete(null);
  };
  const confirmDelete = async () => {
    try {
      await ZoneService.deleteZone(zoneToDelete);
      setOpenDeleteModal(false);
      setZoneToDelete(null);
      setSnackbar({
        open: true,
        message: 'Zone/Sub City deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting zone:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete zone. Please try again.',
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
    { field: 'name', headerName: 'Zone', flex: 1, minWidth: 120 },
    {
      field: 'regionName',
      headerName: 'Region',
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
    (row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()) || row.regionName.toLowerCase().includes(searchQuery.toLowerCase())
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
        description="Are you sure you want to delete this zone? This action cannot be undone."
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
          <Button onClick={handleAddZone} variant="contained" color="primary">
            Add Zone
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

export default ZoneTable;
