import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CaseType from '../../../service/case.type';
import { useTranslation } from 'react-i18next';

const EditCaseType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const { t } = useTranslation();

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
    const fetchSingleType = async () => {
      try {
        const singleTypeData = await CaseType.getCaseTypeById(id);
        setFormValues({
          name: singleTypeData.name || ''
        });
      } catch (error) {
        console.error('Error fetching case type:', error);
      }
    };

    fetchSingleType();
  }, [id]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = t('case.validation.name_required');
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleUpdateType = async () => {
    try {
      const updatedType = { ...formValues };
      await CaseType.updateCaseType(id, updatedType);
      setSnackbar({
        open: true,
        message: t('case.success.update'),
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/case_type');
      }, 1500);
    } catch (error) {
      console.error('Error updating case type:', error);
      setSnackbar({
        open: true,
        message: t('case.error.update'),
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateType();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleBackClick = () => navigate('/case_type');

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('case.edit_modal_title')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('case.field.name')}
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? t('case.validation.name_required') : ''}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
          {t('common.back')}
        </Button>
        <Button type="submit" variant="contained" color="primary">
          {t('common.submit')}
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

export default EditCaseType;
