import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AjendaService from '../../../service/ajenda.service';
import { useTranslation } from 'react-i18next';

const AddAjenda = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) {
      message = t('ajenda.nameRequired'); // 🟡 add this key in translation file
    }
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validateField('name', formValues.name);

    if (!formErrors.name) {
      handleCreateAjenda();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      onClose ? onClose() : navigate('/ajenda');
    }
  };

  const handleCreateAjenda = async () => {
    try {
      const { name, description } = formValues;
      const newAjenda = { name, description: description || '' };
      await AjendaService.createAgenda(newAjenda);
      setSnackbar({
        open: true,
        message: t('ajenda.successMessage'),
        severity: 'success'
      });
      setTimeout(() => {
        onClose ? onClose() : navigate('/ajenda');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('ajenda.errorMessage'),
        severity: 'error'
      });
    }
  };

  const handleBackClick = () => {
    onClose ? onClose() : navigate('/ajenda');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '99%',
        ml: 1,
        p: 4,
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('ajenda.registrationTitle')}
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
          helperText={
            formErrors.name && touched.name ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.name}
              </span>
            ) : touched.name && formValues.name && !formErrors.name ? (
              <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                {t('ajenda.valid')}
              </span>
            ) : null
          }
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

export default AddAjenda;
