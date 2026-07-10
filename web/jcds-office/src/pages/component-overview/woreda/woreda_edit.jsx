import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from '@mui/material';
import RegionService from "../../../service/region.service";
import ZoneService from "../../../service/zone.service";
import WoredaService from '../../../service/woreda.service';

const UpdateWoreda = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};

  const [formValues, setFormValues] = useState({
    regionId: '',
    zoneId: '',
    name: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [regions, setRegions] = useState([]);
  const [zones, setZones] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await RegionService.getAllRegion();
        setRegions(response || []);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to fetch regions.',
          severity: 'error',
        });
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchWoreda = async () => {
      try {
        const woreda = await WoredaService.getWoredaById(id);
        const zone = await ZoneService.getZoneById(woreda.zone_id);
        setFormValues({
          regionId: zone.region_id,
          zoneId: woreda.zone_id,
          name: woreda.name,
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load woreda or zone data.',
          severity: 'error',
        });
      }
    };

    fetchWoreda();
  }, [id]);

  useEffect(() => {
    const fetchZones = async () => {
      if (formValues.regionId) {
        try {
          const response = await ZoneService.getZonesByRegionId(formValues.regionId);

          setZones(response || []);
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Failed to fetch zones for the selected region.',
            severity: 'error',
          });
        }
      }
    };

    fetchZones();
  }, [formValues.regionId]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'regionId' && !value) message = 'Region is required';
    if (name === 'zoneId' && !value) message = 'Zone is required';
    if (name === 'name' && !value) message = 'Woreda name is required';
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    validateField(name, value);
    if (name === 'regionId') setZones([]);
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));

    if (Object.values(formErrors).every((error) => !error)) {
      try {
        const updatedWoreda = {
          name: formValues.name,
          zone_id: formValues.zoneId,
        };
        await WoredaService.updateWoreda(id, updatedWoreda);

        setSnackbar({
          open: true,
          message: 'Woreda updated successfully!',
          severity: 'success',
        });

        setTimeout(() => navigate('/woreda'), 1500);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to update woreda. Please try again.',
          severity: 'error',
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Update Woreda
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

        <FormControl sx={{ flex: 1 }} error={!!formErrors.zoneId && touched.zoneId}>
          <InputLabel>Zone</InputLabel>
          <Select
                label="Zone"
                name="zoneId"
                value={
                  zones.some((zone) => zone.zone_id === formValues.zoneId)
                    ? formValues.zoneId
                    : ''
                }
                onChange={handleInputChange}
                onFocus={() => handleFocus('zoneId')}
                onBlur={() => validateField('zoneId', formValues.zoneId)}
                disabled={!formValues.regionId || zones.length === 0}
              >
                <MenuItem value="">
                  <em>None selected</em>
                </MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.zone_id} value={zone.zone_id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>

        </FormControl>

        <TextField
          label="Woreda Name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/woreda')}>
          Back
        </Button>
        <Button type="submit" variant="contained" color="primary">
          Update
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

export default UpdateWoreda;
