import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CityService from '../../../service/city.service';
const EditCity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  useEffect(() => {
    const fetchSingleCity = async () => {
      try {
        const response = await CityService.getCityById(id);
        const singleCityData = response.city;
        
        setFormValues({
          name: singleCityData.name || '',
        });
      } catch (error) {
        console.error('Error fetching city:', error);
      }
    };
  
    if (id) {
      fetchSingleCity();
    }
  }, [id]);
  
  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = 'City name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };
  const handleUpdateCity = async () => {
    try {
      const updatedCity = {
        ...formValues
      };
      await CityService.updateCity(id, updatedCity);
      setSnackbar({
        open: true,
        message: 'City updated successfully!',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/city');
      }, 1500);
    } catch (error) {
      console.error('Error updating City:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update City. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateCity();
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleBackClick = () => navigate('/city');
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Edit City Administration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label="City Administration Name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? 'City Administration Name is required' : ''}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
          Back
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditCity;
