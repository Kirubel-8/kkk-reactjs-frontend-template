import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RoleService from '../../../service/role.service';
import UserService from '../../../service/user.service';
import { useTranslation } from 'react-i18next';
import { UploadOutlined } from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';

const EditUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state || {};
  const { t } = useTranslation();

  const [formValues, setFormValues] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    gender: '',
    role_ids: []
  });

  const [roles, setRoles] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [titerFile, setTiterFile] = useState(null);
  const [titerPreview, setTiterPreview] = useState(null);

  const [paginationModel] = useState({ pageSize: 50, page: 0 });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await UserService.getUserById(id);

        const [first_name, middle_name, last_name] = user.full_name.split(' ');

        setFormValues({
          first_name: first_name || '',
          middle_name: middle_name || '',
          last_name: last_name || '',
          email: user.email,
          gender: user.gender,
          role_ids: user.roles.map((role) => role.role_id)
        });

        const baseURL = import.meta.env.VITE_BACKEND_URL;

        if (user.signature) {
          setSignaturePreview(`${baseURL}/${user.signature.replace(/\\/g, '/')}`);
        }

        if (user.titer) {
          setTiterPreview(`${baseURL}/${user.titer.replace(/\\/g, '/')}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchRoles = async () => {
      try {
        const { page, pageSize } = paginationModel;
        const rolesData = await RoleService.getAllRoles({ page, limit: pageSize });
        setRoles(rolesData.roles);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchUser();
    fetchRoles();
  }, [id]);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'first_name' && !value) message = 'First name is required';
    if (name === 'middle_name' && !value) message = 'Middle name is required';
    if (name === 'last_name' && !value) message = 'Last name is required';
    if (name === 'email') {
      if (!value) message = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(value)) message = 'Invalid email format';
    }
    if (name === 'gender' && !value) message = 'Gender is required';

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

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleTiterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTiterFile(file);
      setTiterPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updatedUser = {
        ...formValues,
        role_ids: formValues.role_ids
      };

      // Only include files if they are actual File objects
      if (signatureFile instanceof File) {
        updatedUser.signature = signatureFile;
      }

      if (titerFile instanceof File) {
        updatedUser.titer = titerFile;
      }


      await UserService.updateUser(id, updatedUser);

      setSnackbar({
        open: true,
        message: 'User updated successfully!',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/user');
      }, 1500);
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleUpdateUser();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/user');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '99%', ml: 1, p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('user.EditUser')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {['first_name', 'middle_name', 'last_name'].map((field) => (
          <TextField
            key={field}
            label={t(`user.${field}`)}
            name={field}
            value={formValues[field]}
            onChange={handleInputChange}
            onFocus={() => handleFocus(field)}
            onBlur={() => validateField(field, formValues[field])}
            error={!!formErrors[field] && touched[field]}
            helperText={
              formErrors[field] && touched[field] ? (
                <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                  <CloseCircleOutlined style={{ marginRight: '4px' }} />
                  {formErrors[field]}
                </span>
              ) : (
                formValues[field] && (
                  <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlined style={{ marginRight: '4px' }} />
                    {t('common.looksGood')}
                  </span>
                )
              )
            }
            sx={{ flex: 1 }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t('user.email')}
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleInputChange}
          onFocus={() => handleFocus('email')}
          onBlur={() => validateField('email', formValues.email)}
          error={!!formErrors.email && touched.email}
          helperText={
            formErrors.email && touched.email ? (
              <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.email}
              </span>
            ) : (
              formValues.email && (
                <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  {t('common.looksGood')}
                </span>
              )
            )
          }
          sx={{ flex: 1 }}
        />

        <FormControl sx={{ flex: 1 }} error={!!formErrors.gender && touched.gender}>
          <InputLabel>{t('user.gender')}</InputLabel>
          <Select
            label={t('user.gender')}
            name="gender"
            value={formValues.gender}
            onChange={handleInputChange}
            onFocus={() => handleFocus('gender')}
            onBlur={() => validateField('gender', formValues.gender)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ flex: 1 }}>
          <Autocomplete
            multiple
            options={roles}
            getOptionLabel={(option) => option.name}
            value={roles.filter((role) => formValues.role_ids.includes(role.role_id))}
            onChange={(event, value) => {
              const selectedRoleIds = value.map((role) => role.role_id);
              setFormValues({ ...formValues, role_ids: selectedRoleIds });
            }}
            renderInput={(params) => <TextField {...params} label={t('user.role')} />}
          />
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        {['signature', 'titer'].map((type) => {
          const file = type === 'signature' ? signatureFile : titerFile;
          const filePath = type === 'signature' ? signaturePreview : titerPreview;

          const onDrop = (acceptedFiles) => {
            const uploadedFile = acceptedFiles[0];
            if (!uploadedFile) return;

            const maxSize = 5 * 1024 * 1024;
            if (uploadedFile.size > maxSize) {
              setSnackbar({
                open: true,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} file must be less than 5MB.`,
                severity: 'error'
              });
              return;
            }

            if (type === 'signature') {
              setSignatureFile(uploadedFile);
              setSignaturePreview(URL.createObjectURL(uploadedFile));
            } else {
              setTiterFile(uploadedFile);
              setTiterPreview(URL.createObjectURL(uploadedFile));
            }
          };

          const { getRootProps, getInputProps } = useDropzone({
            accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.pdf'] },
            multiple: false,
            onDrop
          });

          return (
            <Box
              key={type}
              {...getRootProps()}
              sx={{
                width: '250px',
                height: '150px',
                border: '2px dashed #1890ff',
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                color: 'text.secondary'
              }}
            >
              <input {...getInputProps()} />
              <UploadOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: '8px' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1">
                  {file?.name ? (
                    file.name
                  ) : filePath ? (
                    <a href={filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
                      {`${type}.${filePath.split('.').pop().split('?')[0]}`}
                    </a>
                  ) : (
                    t(`user.upload_${type}`)
                  )}
                </Typography>

                {(file || filePath) && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (type === 'signature') {
                        setSignatureFile(null);
                        setSignaturePreview(null);
                      } else {
                        setTiterFile(null);
                        setTiterPreview(null);
                      }
                    }}
                    sx={{ mt: 1 }}
                  >
                    {t('common.remove')}
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/user')}>
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

export default EditUser;
