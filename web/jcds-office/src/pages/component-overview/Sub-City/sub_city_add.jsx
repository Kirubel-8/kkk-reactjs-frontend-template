import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubCityService from '../../../service/subCity.service';
import CityService from '../../../service/city.service';

const AddSubCity = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    city_id: '',
    name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleCreateSubCity = async () => {
    try {
      const { name } = formValues;
      const { city_id } = formValues;
      const newSubCity = {
        name,
        city_id
      };
      const response = await SubCityService.createSubcity(newSubCity);
      setSnackbar({
        open: true,
        message: 'Sub City registered successfully!',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/sub-city');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to register sub city. Please try again.',
        severity: 'error'
      });
    }
  };
  const validateField = (name, value) => {
    let message = '';

    if (name === 'city_id' && !value) message = 'city is required';
    if (name === 'name' && !value) message = 'Sub City Name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleCreateSubCity();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/sub-city');
    }
  };
  const handleBackClick = () => {
    navigate('/sub-city');
  };

  const fetchCity = async () => {
    setLoading(true);
    try {
      const response = await CityService.getAllCities();
      const fetchedCity = response?.cities || []; // Adjust based on API response structure
      const sortedCity = fetchedCity
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((city, index) => ({ ...city, NO: index + 1 }));
      setCities(sortedCity);
    } catch (error) {
      console.error("Error fetching cities:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCity();
  }, []);
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '99%',
        ml: 1,
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Sub City Registration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>City</InputLabel>
          <Select label="City" name="city_id" value={formValues.city_id} onChange={handleInputChange}>
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.NO} value={city.city_id}>
                {city.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Sub City" name="name" value={formValues.name} onChange={handleInputChange} sx={{ flex: 1 }} />
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
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddSubCity;
