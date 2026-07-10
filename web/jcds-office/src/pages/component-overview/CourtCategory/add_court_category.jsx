import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CourtCategoryService from '../../../service/courtCategory.service';

const CourtCategoryForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryId = location.state?.id;
  const [formValues, setFormValues] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (isEdit && categoryId) {
      const fetchCategory = async () => {
        try {
          const response = await CourtCategoryService.getCategoryById(categoryId);
          setFormValues({ name: response.category.name || '' });
        } catch (error) { console.error(error); }
      };
      fetchCategory();
    }
  }, [isEdit, categoryId]);

  const handleInputChange = (e) => setFormValues({ ...formValues, [e.target.name]: e.target.value });

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = 'Court Category is required';
    setFormErrors(prev => ({ ...prev, [name]: message }));
  };

  const handleFocus = (field) => { setTouched(prev => ({ ...prev, [field]: true })); validateField(field, formValues[field]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach(field => validateField(field, formValues[field]));
    if (Object.values(formErrors).every(error => !error)) {
      try {
        if (isEdit) await CourtCategoryService.updateCategory(categoryId, formValues);
        else await CourtCategoryService.createCategory(formValues);
        setSnackbar({ open: true, message: isEdit ? 'Category updated!' : 'Category created!', severity: 'success' });
        setTimeout(() => navigate('/court-category'), 1500);
      } catch (error) {
        setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width:'99%', ml:1, p:4, boxShadow:3, borderRadius:2, bgcolor:'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight:'bold' }}>
        {isEdit ? 'Edit Court Category' : 'Add Court Category'}
      </Typography>
      <TextField
        label="Court Category Name"
        name="name"
        value={formValues.name}
        onChange={handleInputChange}
        onFocus={() => handleFocus('name')}
        onBlur={() => validateField('name', formValues.name)}
        error={!!formErrors.name && touched.name}
        helperText={formErrors.name && touched.name ? 'Category name is required' : ''}
        fullWidth
        sx={{ mt:2 }}
      />
      <Box sx={{ display:'flex', justifyContent:'space-between', mt:3 }}>
        <Button variant="outlined" onClick={() => navigate('/court-category')}>Back</Button>
        <Button type="submit" variant="contained" color="primary">Submit</Button>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open:false }))} anchorOrigin={{ vertical:'top', horizontal:'center' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CourtCategoryForm;
