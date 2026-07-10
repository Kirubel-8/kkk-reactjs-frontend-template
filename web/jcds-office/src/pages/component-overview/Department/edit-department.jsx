import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DepartmentService from '../../../service/department.service';
import { useTranslation } from 'react-i18next'; 

const EditDepartment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); 
  const location = useLocation();
  const { id } = location.state || {};
  const [formValues, setFormValues] = useState({
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const department = await DepartmentService.getDepartmentById(id);
        setFormValues({ name: department.name });
      } catch (error) {
        setSnackbar({
          open: true,
          message: t('user.FailedToLoadDepartmentDetails'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, [id]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = t('user.DepartmentNameRequired');
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    validateField(name, value);
  };

  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleUpdateDepartment = async () => {
    try {
      const { name } = formValues;
      const updatedDepartment = { name };
      const response = await DepartmentService.updateDepartment(id, updatedDepartment);
      setSnackbar({
        open: true,
        message: t('user.DepartmentUpdatedSuccessfully'),
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/department');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('user.FailedToUpdateDepartment'),
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateDepartment();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/department');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

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
        {t('user.EditDepartment')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('user.DepartmentName')}
          name="name"
          type="text"
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
            ) : (
              formValues.name && (
                <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  {t('common.looksGood')}
                  </span>
              )
            )
          }
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/department')}>
        {t('user.back')}
        </Button>
        <Button type="submit" variant="contained" color="primary">
        {t('user.submit')}
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

export default EditDepartment;
