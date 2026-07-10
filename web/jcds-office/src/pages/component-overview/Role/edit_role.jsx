import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Alert, Snackbar, Box, TextField, Button, Typography, Checkbox, FormControlLabel, Grid, Divider } from '@mui/material';
import RoleService from '../../../service/role.service';
import PermissionService from '../../../service/permission.service';
import { useTranslation } from 'react-i18next';

const EditRole = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    permissions: {}
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
          acc[resource].push({ permission_id, action });
          return acc;
        }, {});
        setPermissionsOptions(groupedPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
  }, []);

  useEffect(() => {
    const fetchSingleRole = async () => {
      try {
        const singleRoleData = await RoleService.getRoleById(id);
        setFormValues({
          name: singleRoleData.name || '',
          description: singleRoleData.description || '',
          permissions: singleRoleData.permissions.reduce((acc, perm) => {
            const resource = perm.resource;
            if (resource && perm.permission_id) {
              acc[resource] = [...(acc[resource] || []), perm.permission_id];
            }
            return acc;
          }, {})
        });
      } catch (error) {
        console.error('Error fetching role:', error);
      }
    };
    fetchSingleRole();
  }, [id]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'name' && !value) message = t('user.roleNameRequired');
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

  const handleCheckboxChange = (category, permission_id) => {
    setFormValues((prevState) => {
      const categoryPermissions = prevState.permissions[category] || [];
      const updatedPermissions = categoryPermissions.includes(permission_id)
        ? categoryPermissions.filter((perm) => perm !== permission_id)
        : [...categoryPermissions, permission_id];
      return {
        ...prevState,
        permissions: { ...prevState.permissions, [category]: updatedPermissions }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      const flattenedPermissions = Object.values(formValues.permissions).flat();
      const updatedFormValues = { ...formValues, permissions: flattenedPermissions };
      try {
        const updateRole = await RoleService.updateRole(id, updatedFormValues);
        if (updateRole.status === 200) {
          setSnackbar({ open: true, message: t('user.roleUpdatedSuccess'), severity: 'success' });
          setTimeout(() => navigate('/role'), 1500);
        }
      } catch (err) {
        setSnackbar({ open: true, message: t('user.roleUpdateFailed'), severity: 'error' });
      }
    }
  };

  const handleSelectAllPermissions = () => {
    const allSelectedPermissions = Object.keys(permissionsOptions).reduce((acc, category) => {
      acc[category] = permissionsOptions[category].map((perm) => perm.permission_id);
      return acc;
    }, {});
    setFormValues((prevState) => ({
      ...prevState,
      permissions: allSelectedPermissions
    }));
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

  const handleDeselectAllPermissions = () => {
    setFormValues({ permissions: {} });
  };

  const handleBackClick = () => navigate('/role');

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '99%', ml: 1, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('user.editRole')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('user.name')}
          name="name"
          value={formValues.name}
          onChange={handleInputChange}
          onFocus={() => handleFocus('name')}
          onBlur={() => validateField('name', formValues.name)}
          error={!!formErrors.name && touched.name}
          helperText={formErrors.name && touched.name ? t('user.roleNameRequired') : ''}
          sx={{ flex: 1 }}
        />
        <TextField
          label={t('user.description')}
          name="description"
          value={formValues.description}
          onChange={handleInputChange}
          onFocus={() => handleFocus('description')}
          onBlur={() => validateField('description', formValues.description)}
          error={!!formErrors.description && touched.description}
          helperText={formErrors.description && touched.description ? t('user.descriptionRequired') : ''}
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('user.permissions')}
        </Typography>
        <Button onClick={handleSelectAllPermissions} variant="outlined" sx={{ mr: 2 }}>
          {t('user.selectAllPermissions')}
        </Button>
        <Button onClick={handleDeselectAllPermissions} variant="outlined">
          {t('user.deselectAllPermissions')}
        </Button>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          {Object.keys(permissionsOptions).map((category) => (
            <Grid item xs={12} sm={6} md={3} key={category}>
              <Box
                sx={{
                  mb: 3,
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
                    width: '100%',
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditRole;
