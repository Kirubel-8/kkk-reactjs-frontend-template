import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import RegionService from '../../../service/region.service';
import ZoneService from '../../../service/zone.service';

import { useLocation } from 'react-router-dom';

const EditZone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const [formErrors, setFormErrors] = useState({});
  const [regions, setRegions] = useState([]);
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    name: '',
    regionId: '',
    zoneId: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await RegionService.getAllRegion();
        setRegions(response || []);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to fetch regions.',
          severity: 'error'
        });
      }
    };

    fetchRegions();
  }, []);
  useEffect(() => {
    const fetchSingleZone = async () => {
      try {
        const singleZoneData = await ZoneService.getZoneById(id);
        setFormValues({
          name: singleZoneData.name || '',
          regionId: singleZoneData.region_id || ''
        });
      } catch (error) {
        console.error('Error fetching zone:', error);
      }
    };

    fetchSingleZone();
  }, [id]);
  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = 'Zone name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };
  const handleUpdateZone = async () => {
    try {
      const updatedZone = {
        ...formValues
      };
      await ZoneService.updateZone(id, updatedZone);
      setSnackbar({
        open: true,
        message: 'Zone / Sub City updated successfully!',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/zone');
      }, 1500);
    } catch (error) {
      console.error('Error updating Zone:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update Zone. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateZone();
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleBackClick = () => navigate('/zone');
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Edit Zone
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }} error={!!formErrors.regionId && touched.regionId}>
          <InputLabel>Region</InputLabel>
          <Select
            label="Region"
            name="regionId"
            value={formValues.regionId}
            onChange={handleInputChange}
            onFocus={() => handleFocus('regionId')}
            onBlur={() => validateField('regionId', formValues.regionId)}
          >
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.region_id} value={region.region_id}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Zone Name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? 'Zone Name is required' : ''}
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

export default EditZone;
