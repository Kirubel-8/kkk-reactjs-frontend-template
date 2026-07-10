import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridToolbarFilterButton } from "@mui/x-data-grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourtCategoryService from "../../../service/courtCategory.service";
import ConfirmDialog from "../Modal/deleteModal";

const CourtOffice = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [offices, setOffices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await CourtCategoryService.getAllOffices();
      const sorted = res.offices
        .map((o, index) => ({ ...o, NO: index + 1 }))
        .reverse(); // newest first

      setOffices(sorted);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to fetch office list",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await CourtCategoryService.deleteOffice(deleteId);
      setOpenDeleteModal(false);
      setSnackbar({
        open: true,
        message: "Office deleted successfully",
        severity: "success",
      });
      fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Delete failed",
        severity: "error",
      });
    }
  };

  const cancelDelete = () => setOpenDeleteModal(false);

  const handleEdit = (id) => navigate("/edit-court-office", { state: { id } });

  const filtered = offices.filter((row) =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { field: "NO", headerName: "No", width: 70 },
    { field: "name", headerName: "Office Name", flex: 1 },
    {
      field: "category",
      headerName: "Court Category",
      flex: 1,
      renderCell: (params) => params.row.category?.name || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      align: "center",
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row.court_office_id)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={() => handleDelete(params.row.court_office_id)}
            >
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", p: 2, boxShadow: 3, bgcolor: "#fff", borderRadius: 2 }}>
      <ConfirmDialog
        open={openDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Office"
        description="Are you sure you want to delete this office?"
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          label="Search"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 220 }}
        />

        {!isSmallScreen && (
          <Button
            variant="contained"
            onClick={() => navigate("/add-court-office")}
          >
            Add Court Office
          </Button>
        )}
      </Box>

      <DataGrid
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.court_office_id}
        loading={loading}
        pageSize={pageSize}
        onPageSizeChange={(size) => setPageSize(size)}
        rowsPerPageOptions={[5, 10, 20]}
        pagination
        autoHeight
        disableColumnMenu
        components={{ Toolbar: GridToolbarFilterButton }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CourtOffice;
