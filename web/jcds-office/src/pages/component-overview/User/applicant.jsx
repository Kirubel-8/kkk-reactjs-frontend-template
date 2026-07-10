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
  Typography,
  Switch,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Avatar from 'components/@extended/Avatar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CustomerService from '../../../service/customer.service';
import ConfirmDialog from '../Modal/deleteModal';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

const CustomerTable = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const fetchedsCustomer = await CustomerService.getAllCustomers();
      const sortedCustomers = fetchedsCustomer
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .map((customer, index) => ({ ...customer, NO: index + 1 }));
      setCustomers(sortedCustomers);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (customer) => {
    try {
      const newStatus = !customer.account_status;
      await CustomerService.updateCustomerStatus(customer.customer_id, newStatus);
      setSnackbarMessage(`Customer status updated to ${newStatus ? 'Active' : 'Inactive'}`);
      setSnackbarSeverity('success');

      // Update locally
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer_id === customer.customer_id ? { ...c, account_status: newStatus } : c
        )
      );
    } catch (err) {
      setSnackbarMessage(err.message || 'Failed to update customer status');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await CustomerService.deleteCustomer(customerToDelete);

      // Update locally
      setCustomers((prev) => prev.filter((c) => c.customer_id !== customerToDelete));

      setOpenDeleteModal(false);
      setCustomerToDelete(null);

      setSnackbarMessage('Customer deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Optionally re-fetch to stay in sync
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setSnackbarMessage('Failed to delete customer.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setCustomerToDelete(null);
  };

  const columns = [
    {
      field: 'NO',
      headerName: t('#'),
      width: 80,
    },
    {
      field: 'full_name',
      headerName: t('user.Full Name'),
      flex: 1,
      minWidth: 240,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Avatar alt="profile user" src={params.row.profile_image} sx={{ width: 30, height: 30 }} />
          <Typography variant="body2" sx={{ fontSize: 14 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { field: 'gender', headerName: t('user.Gender'), flex: 2, maxWidth: 120, },
    { field: 'email', headerName: t('user.Email'), flex: 2, minWidth: 160, },
    { field: 'phone_number', headerName: t('user.Phone Number'), flex: 2, minWidth: 180 },
    {
      field: 'account_status',
      headerName: t('user.Status'),
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Tooltip title={params.row.account_status ? 'Click to deactivate' : 'Click to activate'}>
          <Switch
            checked={params.row.account_status}
            color="primary"
            onChange={() => handleToggleStatus(params.row)}
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('common.delete')}>
            <IconButton
              color="secondary"
              sx={{ color: '#FF8E7F' }}
              onClick={() => handleDelete(params.row.customer_id)}
            >
              <DeleteIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredRows = customers.filter((customer) =>
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div>
      <Box
        sx={{
          width: '100%',
          borderRadius: 7,
          boxShadow: 'none',
          bgcolor: 'background.paper',
          padding: 2,
          border: '1px solid',
          borderColor: 'grey.300',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 'bold', color: '#2E3180', fontFamily: "'Montserrat', sans-serif" }} variant="h5">
          
              {t('user.ApplicantTable')}
          </Typography>

          <TextField
            size="small"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: '25%',
              minWidth: 200,
              backgroundColor: '#f5f5f5',
              borderRadius: '15px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                paddingLeft: '8px',
              },
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
                  backgroundColor: '#e0e0e0',
                },
                '&.Mui-focused': {
                  backgroundColor: '#f5f5f5',
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
            getRowId={(row) => row.customer_id}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.grey[100],
                color: theme.palette.text.primary,
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: "'Montserrat', sans-serif",
              },
              '& .MuiDataGrid-cell': {
                color: theme.palette.text.primary,
                fontSize: '0.9rem',
                fontFamily: 'Arial, sans-serif',
                borderBottom: `1px solid ${theme.palette.grey[300]}`,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                backgroundColor: 'white',
              },
              '& .MuiDataGrid-row:nth-of-type(odd)': {
                backgroundColor: theme.palette.grey[200],
              },
              '& .MuiDataGrid-footerContainer': {
                backgroundColor: theme.palette.grey[100],
                padding: '4px 8px',
              },
              '& .MuiDataGrid-selectedRowCount': {
                color: theme.palette.text.secondary,
              },
            }}
          />
        )}
        <ConfirmDialog
          open={openDeleteModal}
          onConfirm={confirmDelete}
          onClose={cancelDelete}
          title="Delete Customer"
          description="Are you sure you want to delete this customer?"
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

export default CustomerTable;
