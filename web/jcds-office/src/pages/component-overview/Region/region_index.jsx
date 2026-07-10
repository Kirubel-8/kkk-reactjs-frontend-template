import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionService from '../../../service/region.service';
import ConfirmDialog from '../Modal/deleteModal';

const RegionTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [regionToDelete, setRegionToDelete] = useState(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  const fetchRegion = async () => {
    setLoading(true);
    try {
      const fetchedRegion = await RegionService.getAllRegion();
      const sortedRegion = fetchedRegion
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((region, index) => ({ ...region, NO: index + 1 }));
      setRegions(sortedRegion);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegion();
  }, []);
  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setRegionToDelete(null);
  };
  const handleDelete = (id) => {
    setRegionToDelete(id);
    setOpenDeleteModal(true);
  };
  const confirmDelete = async () => {
    try {
      await RegionService.deleteRegion(regionToDelete);
      setOpenDeleteModal(false);
      setRegionToDelete(null);
      fetchRegion();
      setSnackbar({
        open: true,
        message: 'Region deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting region:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete region. Please try again.',
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
    { field: 'name', headerName: 'Region', flex: 1, minWidth: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(params.row.region_id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={() => handleDelete(params.row.region_id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = regions.filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddRegion = () => {
    navigate('/add-region');
  };

  const handleEdit = (id) => {
    navigate('/edit-region', { state: { id } });
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
        description="Are you sure you want to delete this region? This action cannot be undone."
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
          <Button onClick={handleAddRegion} variant="contained" color="primary">
            Add Region
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
        getRowId={(row) => row.region_id}
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

export default RegionTable;
