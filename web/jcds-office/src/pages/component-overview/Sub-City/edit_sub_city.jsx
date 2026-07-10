import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import SubCityService from '../../../service/subCity.service';
import CityService from '../../../service/city.service';
import { useLocation } from 'react-router-dom';

const EditSubCity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const [formErrors, setFormErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    cityId: '',
    name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await CityService.getAllCities();
        setCities(response.cities || []);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to fetch cities.',
          severity: 'error',
        });
      }
    };
    
    fetchCities();
  }, []);
  useEffect(() => {
    const fetchSingleSubCity = async () => {
      try {
        const singleSubCityData = await SubCityService.getSubcityById(id);
        setFormValues({
          name: singleSubCityData.subcity.name || '',
          cityId: singleSubCityData.subcity.city.city_id || ''
        });
      } catch (error) {
        console.error('Error fetching sub city:', error);
      }
    };

    fetchSingleSubCity();
  }, [id]);
  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = 'sub city name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };
  const handleUpdateSubCity = async () => {
    try {
      const updatedSubCity = {
        name: formValues.name,
        city_id: formValues.cityId,
      };
      await SubCityService.updateSubcity(id, updatedSubCity);
      setSnackbar({
        open: true,
        message: 'Sub City updated successfully!',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/sub-city');
      }, 1500);
    } catch (error) {
      console.error('Error updating sub city:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update sub city. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateSubCity();
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleBackClick = () => navigate('/sub-city');
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Edit Sub City
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }} error={!!formErrors.cityId && touched.cityId}>
          <InputLabel>City</InputLabel>
          <Select
            label="City"
            name="cityId"
            value={formValues.cityId}
            onChange={handleInputChange}
            onFocus={() => handleFocus('cityId')}
            onBlur={() => validateField('cityId', formValues.cityId)}
          >
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.city_id} value={city.city_id}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Sub City Name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? 'Sub City Name is required' : ''}
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

export default EditSubCity;
