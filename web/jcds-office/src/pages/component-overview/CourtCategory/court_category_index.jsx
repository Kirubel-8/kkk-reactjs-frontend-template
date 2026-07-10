import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Box, Button, IconButton, Snackbar, TextField, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourtCategoryService from '../../../service/courtCategory.service';
import ConfirmDialog from '../Modal/deleteModal';

const CourtCategoryTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [categories, setCategories] = useState([]);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await CourtCategoryService.getCourtCategories();
      const fetched = response.categories || [];
      const sorted = fetched.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1))
                            .map((cat, index) => ({ ...cat, NO: index + 1 }));
      setCategories(sorted);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch categories', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAddCategory = () => navigate('/add-court-category');
  const handleEdit = (id) => navigate('/edit-court-category', { state: { id } });
  const handleDelete = (id) => { setCategoryToDelete(id); setOpenDeleteModal(true); };
  const cancelDelete = () => { setOpenDeleteModal(false); setCategoryToDelete(null); };
  const confirmDelete = async () => {
    try {
      await CourtCategoryService.deleteCourtCategory(categoryToDelete);
      setOpenDeleteModal(false);
      setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'success' });
      fetchCategories();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete category.', severity: 'error' });
    }
  };

  const columns = [
    { field: 'NO', headerName: 'No', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'name', headerName: 'Court Category', flex: 1, minWidth: 150 },
    { field: 'actions', headerName: 'Actions', width: 150, align: 'center', headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleEdit(params.row.court_category_id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={() => handleDelete(params.row.court_category_id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = categories.filter(row => row.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Box sx={{ width: '100%', borderRadius: 1, boxShadow: 3, bgcolor: 'background.paper', p: 2 }}>
      <ConfirmDialog
        open={openDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Search"
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '20%', minWidth: 200 }}
        />
        {!isSmallScreen && (
          <Button variant="contained" color="primary" onClick={handleAddCategory}>
            Add Court Category
          </Button>
        )}
      </Box>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5,10,25,100]}
        pagination
        autoHeight
        getRowId={(row) => row.court_category_id}
        disableColumnMenu
        components={{ Toolbar: GridToolbarFilterButton }}
        loading={loading}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': { backgroundColor: theme.palette.grey[100], fontWeight: 'bold' },
          '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.grey[300]}` },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CourtCategoryTable;
