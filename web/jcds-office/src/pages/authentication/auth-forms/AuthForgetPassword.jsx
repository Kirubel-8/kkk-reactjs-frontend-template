import PropTypes from 'prop-types';
import React from 'react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import {useStateContext } from '../../../routes/contextProvider';
import {Alert, Snackbar,Box, TextField } from '@mui/material';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import FirebaseSocial from './FirebaseSocial';
import { values } from 'lodash';
import authService from 'service/auth.service';

export default function AuthForgetPassword({ isDemo = false }) {
  const navigate = useNavigate();
    
  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [token, setToken] = useState('');
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromURL = queryParams.get('token');
    setToken(tokenFromURL);
  }, [location.search]);


   const handleForgetPassword = async (values, setSubmitting) => {
    try {
      console.log(values);
      const reset = await authService.resetpassword(
        values.newPassword,
        values.confirmPassword,
        token
      );
      if (reset.status === 200) {
        setSnackbar({
          open: true,
          message: 'Password successfully reset',
          severity: 'success',
        });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      if (error.status === 400) {
        setSnackbar({
          open: true,
          message: 'Invalid or expired token',
          severity: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    if (snackbar.severity === 'success') {
      navigate('/login');
    }
  };
  const handleBackClick = () => {
    navigate('/login');
  };
    return (
        <>
   
          <Formik
            initialValues={{
              newPassword: '',
              confirmPassword:'',
              submit: null
            }}
            validationSchema={Yup.object().shape({
              newPassword: Yup.string().max(255).required('Password is required'),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                .required('Confirm Password is required'),
            })}
            onSubmit={ (values, { setSubmitting }) => {
              handleForgetPassword(values,setSubmitting)
            }}
          >
            
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
              <form noValidate onSubmit={handleSubmit} >
                <Grid container spacing={3}>
                <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="password-login">New Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.newPassword}
                    name="newPassword"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                  />
                </Stack>
                {touched.newPassword && errors.newPassword && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.newPassword}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="password-login">Confirm Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.confirmPassword}
                    name="confirmPassword"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                  />
                </Stack>
                {touched.confirmPassword && errors.confirmPassword && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.confirmPassword}
                  </FormHelperText>
                )}
              </Grid>
                  {errors.submit && (
                    <Grid item xs={12}>
                      <FormHelperText error>{errors.submit}</FormHelperText>
                    </Grid>
                  )}
                  <Grid item xs={12}sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <AnimateButton>
                      <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                        Reset Password
                      </Button>
                    </AnimateButton>
                    <AnimateButton>
                <Button variant="outlined" color="primary" onClick={handleBackClick}>
                      Back to Login
                  </Button>
                  </AnimateButton>

                  </Grid>             
                </Grid>
              </form>
            )}
          </Formik>
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
        </>
      );
}