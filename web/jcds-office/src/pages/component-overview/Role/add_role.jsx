import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, Grid, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PermissionService from '../../../service/permission.service';
import RoleService from '../../../service/role.service';
import { useTranslation } from 'react-i18next';

const AddRole = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [permissionsOptions, setPermissionsOptions] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permissionsData = await PermissionService.getAllPermissions();
        const groupedPermissions = permissionsData.reduce((acc, permission) => {
          const { resource, action, permission_id } = permission;
          if (!acc[resource]) acc[resource] = [];

          acc[resource].push({
            permission_id,
            action
          });

          return acc;
        }, {});

        setPermissionsOptions(groupedPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = t('user.roleRequired');
    if (name === 'description' && !value) message = t('user.descriptionRequired');
    setFormErrors((prevErrors) => ({ ...prevErrors, [name]: message }));
  };
  const handleFocus = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formValues[field]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };
  const handleDeselectAllPermissions = () => {
    setFormValues({ permissions: {} });
  };
  const handleCheckboxChange = (category, permission_id) => {
    setFormValues((prevState) => {
      const categoryPermissions = prevState.permissions[category] || [];

      const updatedPermissions = categoryPermissions.includes(permission_id)
        ? categoryPermissions.filter((perm) => perm !== permission_id)
        : [...categoryPermissions, permission_id];

      return {
        ...prevState,
        permissions: {
          ...prevState.permissions,
          [category]: updatedPermissions
        }
      };
    });
  };

  const handleCategorySelectAll = (category) => {
    setFormValues((prevState) => {
      const allSelected = prevState.permissions[category]?.length === permissionsOptions[category].length;

      const updatedPermissions = allSelected ? [] : permissionsOptions[category].map((permission) => permission.permission_id);

      return {
        ...prevState,
        permissions: {
          ...prevState.permissions,
          [category]: updatedPermissions
        }
      };
    });
  };

  const handleSelectAllPermissions = () => {
    const allSelected = Object.keys(permissionsOptions).every(
      (category) => formValues.permissions[category]?.length === permissionsOptions[category].length
    );

    const updatedPermissions = allSelected
      ? {}
      : Object.keys(permissionsOptions).reduce((acc, category) => {
          acc[category] = permissionsOptions[category].map((permission) => permission.permission_id);
          return acc;
        }, {});

    setFormValues({
      ...formValues,
      permissions: updatedPermissions
    });
  };
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/role');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      const flattenedPermissions = Object.values(formValues.permissions).flat();
      const updatedFormValues = { ...formValues, permissions: flattenedPermissions };
      try {
        const createRole = await RoleService.createRole(updatedFormValues);
        if (createRole.status === 201) {
          setSnackbar({
            open: true,
            message: t('user.RoleRegisteredSuccessfully'),
            severity: 'success'
          });
          setTimeout(() => {
            navigate('/role');
          }, 1500);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: t('user.FailedToRegisterRole'),
          severity: 'error'
        });
      }
    }
  };
  const handleBackClick = () => {
    navigate('/role');
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
        {t('user.Add_Role')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('user.role')}
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
                {t('user.LooksGood')}
              </span>
            ) : null
          }
          sx={{ flex: 1 }}
        />
        <TextField
          label={t('user.DepartmentName')}
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          onFocus={() => handleFocus('description')}
          onBlur={() => validateField('description', formValues.description)}
          error={!!formErrors.description && touched.description}
          helperText={
            formErrors.description && touched.description ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.description}
              </span>
            ) : touched.description && formValues.description && !formErrors.description ? (
              <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ marginRight: '4px' }} />
                {t('user.LooksGood')}
              </span>
            ) : null
          }
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('user.permissions')}
        </Typography>
        <Button onClick={handleSelectAllPermissions} variant="outlined" sx={{ mr: 2 }}>
          {t('user.selectAll')}
        </Button>
        <Button onClick={handleDeselectAllPermissions} variant="outlined">
          {t('user.deselectAll')}
        </Button>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {Object.keys(permissionsOptions).map((category) => (
            <Grid item xs={12} sm={6} md={3} key={category}>
              <Box
                sx={{
                  backgroundColor: '#FFF6F6',
                  borderRadius: 2,
                  p: 2
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      color: '#1B254B'
                    }}
                  >
                    {category}
                  </Typography>
                  <Checkbox
                    checked={formValues.permissions[category]?.length === permissionsOptions[category].length}
                    onChange={() => handleCategorySelectAll(category)}
                    sx={{
                      color: '#4318FF',
                      '&.Mui-checked': {
                        color: '#4318FF'
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ backgroundColor: '#C7C7C7', height: '2px', mb: 1 }} />

                <Grid container direction="column" spacing={1}>
                  {permissionsOptions[category].map((permission) => (
                    <Grid item key={permission.permission_id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formValues.permissions[category]?.includes(permission.permission_id) || false}
                            onChange={() => handleCheckboxChange(category, permission.permission_id)}
                            sx={{
                              color: '#4318FF',
                              '&.Mui-checked': {
                                color: '#4318FF'
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ color: '#1B254B', fontSize: 14 }}>{permission.action}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={handleBackClick}>
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

export default AddRole;
