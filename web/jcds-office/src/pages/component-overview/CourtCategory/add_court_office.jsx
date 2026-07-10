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
import { useNavigate } from "react-router-dom";
import CourtCategoryService from "../../../service/courtCategory.service";

const CourtOfficeAdd = () => {
const navigate = useNavigate();
const [form, setForm] = useState({ name: "", court_category_id: "" });
const [categories, setCategories] = useState([]);

const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
});

const fetchCategories = async () => {
    try {
    const res = await CourtCategoryService.getCourtCategories();
    setCategories(res.categories);
    } catch (e) {
    console.error(e);
    }
};

useEffect(() => {
    fetchCategories();
}, []);

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.court_category_id) {
    setSnackbar({
        open: true,
        message: "All fields are required",
        severity: "error",
    });
    return;
    }

    try {
    await CourtCategoryService.createOffice(form);
    navigate("/court-office");
    } catch (error) {
    setSnackbar({
        open: true,
        message: "Failed to create office",
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
        Add Court Office
    </Typography>

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

    <TextField
        label="Office Name"
        fullWidth
        sx={{ mb: 2 }}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
    />

    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button variant="outlined" onClick={() => navigate("/court-office")}>
        Back
        </Button>

        <Button variant="contained" type="submit">
        Create
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

export default CourtOfficeAdd;
