import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Autocomplete,
  Backdrop
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import UserService from '../../../service/user.service';
import RoleService from '../../../service/role.service';
import { useTranslation } from 'react-i18next';

const AddUser = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    gender: '',
    role_id: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [titerFile, setTiterFile] = useState(null);

  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { page, pageSize } = paginationModel;
        const response = await RoleService.getAllRoles({ page, limit: pageSize });
        setRoles(response.roles);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
    fetchRoles();
  }, []);

  const handleFileDrop = (type) => (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSnackbar({
        open: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} file must be less than 5MB.`,
        severity: 'error'
      });
      return;
    }

    if (type === 'signature') setSignatureFile(file);
    if (type === 'titer') setTiterFile(file);
  };

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

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const { first_name, middle_name, last_name, email, gender, role_id } = formValues;

      const newUser = {
        first_name,
        middle_name,
        last_name,
        email,
        gender,
        role_id,
        signature: signatureFile,
        titer: titerFile
      };

      await UserService.createUser(newUser);

      setSnackbar({
        open: true,
        message: 'User registered successfully!',
        severity: 'success'
      });

      setTimeout(() => navigate('/user'), 1500);
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to register user.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Object.keys(formValues).forEach((field) => validateField(field, formValues[field]));
    if (Object.values(formErrors).every((error) => !error)) {
      handleCreateUser();
    }
  };
  const onDrop = (acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);

    if (uploadedFile && uploadedFile.type.startsWith('image/')) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setPreview(fileReader.result);
      };
      fileReader.readAsDataURL(uploadedFile);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.pdf'],
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setPreview(URL.createObjectURL(acceptedFiles[0]));
    }
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/user');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '99%', ml: 1, p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        {t('user.UserRegistration')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        {['first_name', 'middle_name', 'last_name'].map((field, index) => (
          <Box key={index} sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t(`user.${field}`)}
            </Typography>
            <TextField
              name={field}
              value={formValues[field]}
              onChange={handleInputChange}
              onFocus={() => handleFocus(field)}
              onBlur={() => validateField(field, formValues[field])}
              error={!!formErrors[field] && touched[field]}
              placeholder={t(`user.enter_${field}`)}
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
              sx={{ width: '100%' }}
            />
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t('user.email')}
          </Typography>
          <TextField
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleInputChange}
            onFocus={() => handleFocus('email')}
            onBlur={() => validateField('email', formValues.email)}
            error={!!formErrors.email && touched.email}
            placeholder={t('user.enter_email')}
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
            sx={{ width: '100%' }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t('user.gender')}
          </Typography>
          <FormControl sx={{ width: '100%' }} error={!!formErrors.gender && touched.gender}>
            <Select
              name="gender"
              value={formValues.gender}
              onChange={handleInputChange}
              onFocus={() => handleFocus('gender')}
              onBlur={() => validateField('gender', formValues.gender)}
              displayEmpty
            >
              <MenuItem value="">{t('user.selectGender')}</MenuItem>
              <MenuItem value="male">{t('user.male')}</MenuItem>
              <MenuItem value="female">{t('user.female')}</MenuItem>
            </Select>
            {formErrors.gender && touched.gender ? (
              <Typography variant="caption" color="error">
                <CloseCircleOutlined style={{ marginRight: '4px' }} />
                {formErrors.gender}
              </Typography>
            ) : (
              formValues.gender && (
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ marginRight: '4px' }} />
                  {t('common.looksGood')}
                </Typography>
              )
            )}
          </FormControl>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t('user.role')}
          </Typography>
          <FormControl sx={{ width: '100%' }} error={!!formErrors.role_id && touched.role_id}>
            <Autocomplete
              multiple
              options={roles}
              getOptionLabel={(option) => option.name}
              value={roles.filter((role) => formValues.role_id.includes(role.role_id))}
              onChange={(event, newValue) => {
                setFormValues({
                  ...formValues,
                  role_id: newValue.map((role) => role.role_id)
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('user.selectRole')}
                  error={!!formErrors.role_id && touched.role_id}
                  helperText={
                    formErrors.role_id && touched.role_id ? (
                      <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                        <CloseCircleOutlined style={{ marginRight: '4px' }} />
                        {formErrors.role_id}
                      </span>
                    ) : (
                      formValues.role_id.length > 0 && (
                        <span style={{ color: 'green', display: 'flex', alignItems: 'center' }}>
                          <CheckCircleOutlined style={{ marginRight: '4px' }} />
                          {t('common.looksGood')}
                        </span>
                      )
                    )
                  }
                />
              )}
            />
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
        {['signature', 'titer'].map((type) => {
          const dropzone = useDropzone({
            accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.pdf'] },
            multiple: false,
            onDrop: handleFileDrop(type)
          });

          const file = type === 'signature' ? signatureFile : titerFile;
          const setFileState = type === 'signature' ? setSignatureFile : setTiterFile;

          return (
            <Box
              key={type}
              {...dropzone.getRootProps()}
              sx={{
                width: '250px',
                height: '170px',
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
              <input {...dropzone.getInputProps()} />
              <UploadOutlined style={{ fontSize: 40, color: '#1890ff', marginBottom: '8px' }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                {file ? file.name : t(`user.upload_${type}`)}
              </Typography>

              {file && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileState(null);
                  }}
                >
                  {t('common.remove')}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate('/user')}>
          {t('user.back')}
        </Button>
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          {t('user.submit')}
        </Button>
      </Box>

      <Backdrop open={loading} sx={{ color: '#63a4ff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

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

export default AddUser;
