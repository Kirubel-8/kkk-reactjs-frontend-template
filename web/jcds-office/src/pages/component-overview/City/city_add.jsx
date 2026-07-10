import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CityService from '../../../service/city.service';
const AddCity = () => {
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formValues, setFormValues] = useState({
    name: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = 'City Name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleCreateCity();
    }
  };
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/city');
    }
  };
  const handleCreateCity = async () => {
    try {
      const { name } = formValues;
      const newCity = {
        name
      };
      const response = await CityService.createCity(newCity);
      setSnackbar({
        open: true,
        message: 'City registered successfully!',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/city');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to register city. Please try again.',
        severity: 'error'
      });
    }
  };
  const handleBackClick = () => {
    navigate('/city');
  };

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
        City Administration Registration
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
          helperText={
            formErrors.name && touched.name ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.name}
              </span>
            ) : touched.name && formValues.name && !formErrors.name ? (
              <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                Looks good!
              </span>
            ) : null
          }
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

export default AddCity;
