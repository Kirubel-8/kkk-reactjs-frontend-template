import {
  Box,
  Button,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CourtCategoryService from "../../../service/courtCategory.service";

const CourtOfficeEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.state?.id;

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", court_category_id: "" });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    CourtCategoryService.getCourtCategories().then((res) =>
      setCategories(res.categories)
    );

    if (id) {
      CourtCategoryService.getOfficeById(id).then((res) => {
        setForm({
          name: res.office.name,
          court_category_id: res.office.court_category_id,
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await CourtCategoryService.updateOffice(id, form);
      navigate("/court-office");
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Update failed",
        severity: "error",
      });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 4, boxShadow: 3, bgcolor: "#fff", borderRadius: 2 }}
    >
      <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
        Edit Court Office
      </Typography>

      <TextField
        label="Office Name"
        fullWidth
        sx={{ mb: 2 }}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <TextField
        label="Court Category"
        select
        fullWidth
        sx={{ mb: 3 }}
        value={form.court_category_id}
        onChange={(e) => setForm({ ...form, court_category_id: e.target.value })}
      >
        {categories.map((c) => (
          <MenuItem key={c.court_category_id} value={c.court_category_id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={() => navigate("/court-office")}>
          Back
        </Button>

        <Button variant="contained" type="submit">
          Update
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CourtOfficeEdit;
