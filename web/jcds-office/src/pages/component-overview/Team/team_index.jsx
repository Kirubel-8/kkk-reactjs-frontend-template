import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { InputAdornment,Alert, Box, Button, CircularProgress, IconButton, Snackbar, TextField, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeamService from '../../../service/team.service';
import ConfirmDialog from '../Modal/deleteModal';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; 
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

const TeamTable = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const data = await TeamService.getAllTeams();
        const numberedTeams = data
          .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
          .map((team, index) => ({
            ...team,
            number: index + 1,
            department: team.department?.name || 'N/A'
          }));
        setTeams(numberedTeams);
      } catch (error) {
        console.error('Failed to fetch teams:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleAddTeam = () => {
    navigate('/add-team');
  };

  const handleEdit = (id) => {
    navigate('/edit-team', { state: { id } });
  };

  const openConfirmDialog = (id) => {
    setTeamToDelete(id);
    setConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setTeamToDelete(null);
  };

  const handleDelete = async () => {
    setLoading(true);
    setConfirmDialogOpen(false);
    try {
      await TeamService.deleteTeam(teamToDelete);
      setTeams((prevTeams) => prevTeams.filter((team) => team.team_id !== teamToDelete));
      setSnackbarMessage('Team successfully deleted.');
      setSnackbarSeverity('success');
    } catch (error) {
      setSnackbarMessage(`Failed to delete team: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
      setTeamToDelete(null);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const filteredRows = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) || team.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { field: 'number', headerName: '#', width: 130 },
    { field: 'name', headerName: 'Team Name', flex: 3, minWidth: 200 },
    { field: 'department', headerName: 'Department', flex: 2, minWidth: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      flex:3,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton   sx={{ color: "#767676" }}  onClick={() => handleEdit(params.row.team_id)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton   sx={{ color: "#FF8E7F" }} color="secondary" onClick={() => openConfirmDialog(params.row.team_id)}>
              <DeleteIcon sx={{ fontSize: "19px" }}/>
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <div>
       <Box sx={{display:"flex",justifyContent:"flex-end",marginBottom:"10px"}}>
       <Button 
          onClick={handleAddTeam} 
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
        >   {t('user.AddTeam')}</Button></Box>
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
    Team | Table
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
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
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
            getRowId={(row) => row.team_id}
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
        )}
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
        <ConfirmDialog
          open={confirmDialogOpen}
          onClose={closeConfirmDialog}
          onConfirm={handleDelete}
          title="Delete Team"
          description="Are you sure you want to delete this team? This action cannot be undone."
        />
      </Box>
    </div>
  );
};

export default TeamTable;
