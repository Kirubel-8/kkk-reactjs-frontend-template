import { DeleteOutlined, EditOutlined, FormOutlined } from '@ant-design/icons';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  InputAdornment,
  Tooltip,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, GridToolbarFilterButton } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TeamService from 'service/team.service';
import DepartmentService from '../../../service/department.service';
import UserService from '../../../service/user.service';
import ConfirmDialog from '../Modal/deleteModal';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Avatar from 'components/@extended/Avatar';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';


const UserTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const userData = JSON.parse(localStorage.getItem('editUserData'));
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 5,
    page: 0
  });
  const [totalPages, setTotalPages] = useState(0);
  const [openUnassignModal, setOpenUnassignModal] = useState(false);
  const [unassignOptions, setUnassignOptions] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = paginationModel;
      const offset = page * pageSize;
      const fetchedUsers = await UserService.getAllUsers({ page, limit: pageSize, search: searchQuery });
      const totalPages = fetchedUsers.pagination.totalPages;
      const fetchedDepartments = await DepartmentService.getAllDepartments();
      const fetchedTeams = await TeamService.getAllTeams();
      const usersWithDepartmentAndTeamNames = fetchedUsers.users.map((user) => {
        const department = fetchedDepartments.find((dept) => dept.department_id === user.department_id);
        const team = fetchedTeams.find((team) => team.team_id === user.team_id);
        return {
          ...user,
          department_name: department ? department.name : 'N/A',
          team_name: team ? team.name : 'N/A'
        };
      });
      const sortedUsers = usersWithDepartmentAndTeamNames.map((user, index) => ({ ...user, NO: offset + index + 1 }));

      setUsers(sortedUsers);
      setTotalPages(totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await UserService.updateUserStatus(userId, !currentStatus);
      fetchUsers();
      setSnackbarMessage(`User status updated to ${!currentStatus ? 'active' : 'inactive'}.`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating user status:', error);
      setSnackbarMessage('Failed to update user status.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue);
  };

  const fetchDepartments = async () => {
    try {
      const response = await DepartmentService.getDepartmentById(selectedDepartmentId);
      setDepartments(response);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
      fetchDepartments();
    }, 400);


    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, paginationModel]);

  const fetchTeamsByDepartment = async () => {
    try {
      setLoadingTeams(true);
      const response = await TeamService.getTeamsByDepartmentId(selectedDepartmentId);
      setTeams(response);
      setLoadingTeams(false);
    } catch (error) {
      console.error('Error fetching teams by department:', error);
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchTeamsByDepartment();
    }
  }, [selectedDepartmentId]);

  const handleDepartmentAssignment = (userId) => {
    setSelectedUserId(userId);
    setOpenModal(true);
  };
  const handleDelete = (userId) => {
    setUserToDelete(userId);
    setOpenDeleteModal(true);
  };

  const handlePaginationChange = (newPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  const confirmDelete = async () => {
    try {
      await UserService.deleteUser(userToDelete);
      setOpenDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
      setSnackbarMessage('User deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbarMessage('Failed to delete user.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteModal(false);
    setUserToDelete(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUserId(null);
    setSelectedDepartmentId('');
  };

  const handleAssignDepartment = async () => {
    try {
      await UserService.assignUserToDepartment(selectedUserId, selectedDepartmentId, selectedTeamId);
      handleCloseModal();
      fetchUsers();
      setSnackbarMessage('Department and team assigned successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error assigning department and team:', error);
      setSnackbarMessage('Failed to assign department and team.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const confirmUnassign = (userId, options) => {
    setSelectedUserId(userId);
    setUnassignOptions(options);
    setOpenUnassignModal(true);
  };

  const handleConfirmUnassign = async () => {
    try {
      const response = await UserService.unassignDepartmentAndTeamFromUser(
        selectedUserId,
        unassignOptions
      );

      const message =
        response?.data?.message ||
        response?.message ||
        'User unassigned successfully!';

      setSnackbarMessage(message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      fetchUsers();

      setOpenUnassignModal(false);
      setSelectedUserId(null);
      setUnassignOptions(null);
    } catch (error) {
      console.error('Error unassigning user:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to unassign user.';

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);

      setOpenUnassignModal(false);
      setSelectedUserId(null);
      setUnassignOptions(null);
    }
  };




  const columns = [
    {
      field: 'NO',
      headerName: t('#'),
      width: 80
      // align: 'center',
      // headerAlign: 'center'
    },
    {
      field: 'full_name',
      headerName: t('user.full_name'),
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Avatar alt="profile user" src={params.row.profile_image} sx={{ width: 30, height: 30 }} />
          <Typography variant="body2" sx={{ fontSize: 14 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { field: 'email', headerName: t('user.email'), flex: 1, minWidth: 200 },
    { field: 'department_name', headerName: t('user.department'), flex: 1, minWidth: 130 },
    { field: 'team_name', headerName: t('user.Team'), flex: 1, minWidth: 130 },
    {
      field: 'roles',
      headerName: t('user.roles'),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        // Map roles array to a comma-separated string
        const roleNames = params.value.map((role) => role.name).join(', ');
        return <Typography variant="body2">{roleNames || 'N/A'}</Typography>;
      }
    },
    {
      field: 'status',
      headerName: t('user.Status'),
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Switch
          checked={params.row.account_status}
          onChange={() => handleToggleStatus(params.row.user_id, params.row.account_status)}
          color="primary"
        />
      )
    },
    {
      field: 'unassign',
      headerName: t('user.Unassign'),
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Select
          displayEmpty
          size="small"
          value=""
          sx={{ minWidth: 40 }}
          renderValue={() => <RemoveCircleOutlineIcon style={{ color: '#FF9800' }} />}
          onChange={(e) => {
            if (e.target.value === 'department') {
              confirmUnassign(params.row.user_id, { unassignDepartment: true, unassignTeam: false });
            } else if (e.target.value === 'team') {
              confirmUnassign(params.row.user_id, { unassignDepartment: false, unassignTeam: true });
            } else if (e.target.value === 'both') {
              confirmUnassign(params.row.user_id, { unassignDepartment: true, unassignTeam: true });
            }
          }}
        >
          <MenuItem value="department">{t('user.Unassign_Department')}</MenuItem>
          <MenuItem value="team">{t('user.Unassign_Team')}</MenuItem>
          <MenuItem value="both">{t('user.Unassign_Both')}</MenuItem>
        </Select>
      )
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title={t('user.Assign_Department')}>
            <IconButton color="info" onClick={() => handleDepartmentAssignment(params.row.user_id)}>
              <FormOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <IconButton sx={{ color: "#3470FF" }} onClick={() => handleEdit(params.row.user_id)}>
              <EditIcon />

            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton color="secondary" sx={{ color: '#FF8E7F' }} onClick={() => handleDelete(params.row.user_id)}>
              <DeleteIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const filteredRows = users.filter((user) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.account_status) ||
      (statusFilter === 'inactive' && !user.account_status);

    return matchesStatus;
  });

  const handleAddUser = () => {
    navigate('/add-user');
  };

  const handleEdit = async (id) => {
    try {
      const userData = await UserService.getUserById(id);

      localStorage.setItem('editUserData', JSON.stringify(userData));

      navigate('/edit-user', { state: { id } });
    } catch (error) {
      console.error('Error fetching user data for edit:', error);
      setSnackbarMessage('Failed to load user data for editing.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          marginBottom: '10px'
        }}
      >
        <Tabs
          value={statusFilter}
          onChange={handleStatusFilterChange}
          TabIndicatorProps={{ style: { display: 'none' } }}
          sx={{
            backgroundColor: '#f9f9f9',
            borderRadius: '12px',
            boxShadow: '0px 1px 5px rgba(0,0,0,0.1)',
            minHeight: 'unset',
            height: '45px',
            padding: '4px'
          }}
        >
          {['all', 'active', 'inactive'].map((status) => (
            <Tab
              key={status}
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              value={status}
              disableRipple
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                borderRadius: '10px',
                minHeight: 'unset',
                height: '35px',
                minWidth: '100px',
                marginX: '4px',
                transition: '0.3s',
                color: '#7a7a7a',
                '&.Mui-selected': {
                  backgroundColor: '#3f7dfd',
                  color: '#fff'
                },
                '&:hover': {
                  backgroundColor: statusFilter === status ? '#3f7dfd' : '#f0f0f0',
                  color: statusFilter === status ? '#fff' : '#333'
                }
              }}
            />
          ))}
        </Tabs>

        <Button
          onClick={handleAddUser}
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
          {t('user.Add_User')}
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
           
               {t('user.UserTable')}
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
                    {error ? 'An error occurred while fetching requests.' : 'No requests available.'}
                  </Box>
                )
              }}
              getRowId={(row) => row.user_id}
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

        <ConfirmDialog
          open={openDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          description="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={openUnassignModal}
          onClose={() => setOpenUnassignModal(false)}
          onConfirm={handleConfirmUnassign}
          title="Confirm Unassign"
          description="Are you sure you want to unassign this user from the selected option? This action cannot be undone."
          confirmText="Unassign"
          cancelText="Cancel"
        />


        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>Assign Department</DialogTitle>

          <DialogContent sx={{ padding: '20px 24px' }}>
            <Typography variant="body1" sx={{ marginBottom: '16px', textAlign: 'center', color: theme.palette.text.secondary }}>
              Select the department you want to assign to this user.
            </Typography>
            <FormControl fullWidth sx={{ marginBottom: '24px' }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                label="Department"
                sx={{
                  '& .MuiSelect-select': { padding: '12px' },
                  '& .MuiOutlinedInput-root': { borderRadius: 2 }
                }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedDepartmentId && (
              <FormControl fullWidth sx={{ marginBottom: '16px' }}>
                <InputLabel>Team</InputLabel>
                <Select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  label="Team"
                  sx={{
                    '& .MuiSelect-select': { padding: '12px' },
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                  disabled={loadingTeams || teams.length === 0}
                >
                  {loadingTeams ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : teams ? (
                    teams.map((team) => (
                      <MenuItem key={team.team_id} value={team.team_id}>
                        {team.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No teams available</MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', padding: '16px' }}>
            <Button onClick={handleCloseModal} color="secondary" sx={{ marginRight: '8px' }}>
              Cancel
            </Button>
            <Button onClick={handleAssignDepartment} color="primary" variant="contained">
              Assign
            </Button>
          </DialogActions>
        </Dialog>

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

export default UserTable;
