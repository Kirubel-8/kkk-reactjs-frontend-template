import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionService from '../../../service/region.service';
import ZoneService from '../../../service/zone.service';

const AddZone = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    region_id: '',
    name: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleCreateZone = async () => {
    try {
      const { name } = formValues;
      const { region_id } = formValues;
      const newZone = {
        name,
        region_id
      };
      const response = await ZoneService.createzone(newZone);
      setSnackbar({
        open: true,
        message: 'Zone registered successfully!',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/zone');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to register zone. Please try again.',
        severity: 'error'
      });
    }
  };
  const validateField = (name, value) => {
    let message = '';

    if (name === 'region_id' && !value) message = 'Region is required';
    if (name === 'name' && !value) message = 'zone Name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleCreateZone();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/zone');
    }
  };
  const handleBackClick = () => {
    navigate('/zone');
  };

  const fetchRegion = async () => {
    setLoading(true);
    try {
      const fetchedRegion = await RegionService.getAllRegion();
      const sortedRegion = fetchedRegion
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
        .map((region, index) => ({ ...region, NO: index + 1 }));
      setRegions(sortedRegion);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRegion();
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
        Zone Registration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }}>
          <InputLabel>Region</InputLabel>
          <Select label="Region" name="region_id" value={formValues.region_id} onChange={handleInputChange}>
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.NO} value={region.region_id}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Zone" name="name" value={formValues.name} onChange={handleInputChange} sx={{ flex: 1 }} />
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

export default AddZone;
