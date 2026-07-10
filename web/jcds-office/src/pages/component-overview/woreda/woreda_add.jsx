import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegionService from '../../../service/region.service';
import WoredaService from '../../../service/woreda.service';
import ZoneService from '../../../service/zone.service';

const AddWoreda = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    regionId: '',
    zoneId: '',
    subcityId: '',
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [regions, setRegions] = useState([]);
  const [regionsType, setRegionsType] = useState('');
  const [zones, setZones] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await RegionService.getAllAddresses();
        setRegions(response.locations || []);
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
    const fetchZones = async () => {
      if (formValues.regionId) {
        try {
          const response = await ZoneService.getZonesByRegionId(formValues.regionId);
          setZones(response || []);
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Failed to fetch zones for the selected region.',
            severity: 'error'
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
    console.log(name);
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
    console.log(formValues);
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      try {
        const newWoreda = {
          name: formValues.name,
          zone_id: formValues.zoneId,
          subcity_id: formValues.subcityId
        };
        await WoredaService.createWoreda(newWoreda);
        setSnackbar({
          open: true,
          message: 'Woreda registered successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate('/woreda'), 1500);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to register woreda. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleBackClick = () => {
    navigate('/woreda');
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
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Woreda Registration
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ flex: 1 }} error={!!formErrors.regionId && touched.regionId}>
          <InputLabel>Region/City Administration</InputLabel>
          <Select
            label="Region/City Administration"
            name="regionId"
            value={formValues.regionId}
            onChange={(e) => {
              const selectedRegion = regions.find((region) => region.id === e.target.value);
              handleInputChange(e);

              if (selectedRegion && selectedRegion.type === 'city') {
                setRegionsType('city');
              } else {
                setRegionsType('region');
              }
            }}
            onFocus={() => handleFocus('regionId')}
            onBlur={() => validateField('regionId', formValues.regionId)}
          >
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
          {formErrors.regionId && touched.regionId ? (
            <Typography color="error">
              <CloseCircleOutlined style={{ marginRight: 4 }} />
              {formErrors.regionId}
            </Typography>
          ) : (
            formValues.regionId && (
              <Typography color="green">
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Looks good!
              </Typography>
            )
          )}
        </FormControl>

        <FormControl sx={{ flex: 1 }} error={!!formErrors.zoneId && touched.zoneId}>
          <InputLabel>Zone/SubCity</InputLabel>
          <Select
            label="Zone/SubCity"
            name={regionsType === 'city' ? 'subcityId' : 'zoneId'}
            value={regionsType === 'city' ? formValues.subcityId : formValues.zoneId}
            onChange={(e) => {
              if (regionsType === 'city') {
                handleInputChange(e, 'subcityId');
              } else {
                handleInputChange(e, 'zoneId');
              }
            }}
            onFocus={() => handleFocus(regionsType === 'city' ? 'subcityId' : 'zoneId')}
            onBlur={() => {
              const field = regionsType === 'city' ? 'subcityId' : 'zoneId';
              validateField(field, regionsType === 'city' ? formValues.subcityId : formValues.zoneId);
            }}
            disabled={!formValues.regionId}
          >
            <MenuItem value="">
              <em>None selected</em>
            </MenuItem>
            {zones.map((zone) => (
              <MenuItem key={zone.zone_id || zone.subcity_id} value={zone.zone_id || zone.subcity_id}>
                {zone.name}
              </MenuItem>
            ))}
          </Select>
          {formErrors.zoneId && touched.zoneId ? (
            <Typography color="error">
              <CloseCircleOutlined style={{ marginRight: 4 }} />
              {formErrors.zoneId}
            </Typography>
          ) : (
            (formValues.zoneId || formValues.subcityId) && (
              <Typography color="green">
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Looks good!
              </Typography>
            )
          )}
        </FormControl>

        <TextField
          label="Woreda Name"
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={
            formErrors.name && touched.name ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: 4 }} />
                {formErrors.name}
              </span>
            ) : (
              formValues.name && (
                <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  Looks good!
                </span>
              )
            )
          }
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/woreda')}>
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

export default AddWoreda;
