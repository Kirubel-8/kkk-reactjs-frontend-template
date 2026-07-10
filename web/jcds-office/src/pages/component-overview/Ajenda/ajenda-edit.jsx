import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AjendaService from '../../../service/ajenda.service';
import { useTranslation } from 'react-i18next';

const EditAjenda = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchSingleAjenda = async () => {
      try {
        const singleAjendaData = await AjendaService.getAgendaById(id);
        setFormValues({
          name: singleAjendaData.name || '',
          description: singleAjendaData.description || ''
        });
      } catch (error) {
        console.error('Error fetching ajenda:', error);
      }
    };

    fetchSingleAjenda();
  }, [id]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = t('ajenda.nameRequired');
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleUpdateAjenda = async () => {
    try {
      const updatedAjenda = { ...formValues };
      await AjendaService.updateAgenda(id, updatedAjenda);
      setSnackbar({
        open: true,
        message: t('ajenda.updateSuccess'),
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/ajenda');
      }, 1500);
    } catch (error) {
      console.error('Error updating agenda:', error);
      setSnackbar({
        open: true,
        message: t('ajenda.updateError'),
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateAjenda();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleBackClick = () => navigate('/ajenda');

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, border: '1px solid', borderColor: 'grey.400', borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('ajenda.editTitle')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('ajenda.name')}
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? t('ajenda.nameRequired') : ''}
          sx={{ flex: 1 }}
        />
        <TextField
          label={t('ajenda.description')}
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          sx={{ flex: 1 }}
          multiline
          rows={3}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
          {t('ajenda.back')}
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {t('ajenda.submit')}
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

export default EditAjenda;
