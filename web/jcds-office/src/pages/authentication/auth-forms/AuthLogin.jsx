import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from 'assets/images/auth/jcdms-logo.png';
import {
  Alert,
  Snackbar,
  Box,
  Grid,
  Stack,
  Typography,
  Button,
  FormHelperText,
  InputAdornment,
  IconButton,
  InputLabel,
  OutlinedInput,
  Card,
  CardContent,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AnimateButton from 'components/@extended/AnimateButton';
import { useStateContext } from '../../../routes/contextProvider';
import authService from 'service/auth.service';

// MUI Icons
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function AuthLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { setToken, setUser } = useStateContext();
  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleLogin = async (values, setSubmitting) => {
    try {
      const login = await authService.login(values.email.trim(), values.password, setToken, setUser);
      if (login.status === 200) navigate('/');
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        setSnackbar({ open: true, message: 'Invalid credentials', severity: 'error' });
      } else if (status === 403) {
        setSnackbar({ open: true, message: 'Account is deactivated', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Something went wrong', severity: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  return (
    <>
      <Card
        sx={{
          width: { xs: '90%', sm: 400, md: 500 },
          borderRadius: 3,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#F6F7F8',
          mx: 'auto',
          mt: { xs: 5, sm: 8, md: 12 },
        }}
      >
        <CardContent sx={{ px: 4, py: 5 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src={logo} alt="Federal Courts Logo" sx={{ height: 60, mb: 1 }} />
          </Box>

          {/* Formik Form */}
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={Yup.object().shape({
              email: Yup.string().trim().max(255).required('Username is required'),
              password: Yup.string().min(6, 'Password must be at least 6 characters').max(255).required('Password is required'),
            })}
            onSubmit={(values, { setSubmitting }) => handleLogin(values, setSubmitting)}
          >
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
              <form noValidate onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Username */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="email">Email or Phone number</InputLabel>
                      <OutlinedInput
                        id="email"
                        name="email"
                        type="text"
                        value={values.email}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Enter email or phone number"
                        fullWidth
                        error={Boolean(touched.email && errors.email)}
                      />
                      {touched.email && errors.email && (
                        <FormHelperText error>{errors.email}</FormHelperText>
                      )}
                    </Stack>
                  </Grid>

                  {/* Password */}
                  <Grid item xs={12}>
                    <Stack spacing={1}>
                      <InputLabel htmlFor="password">Password</InputLabel>
                      <OutlinedInput
                        fullWidth
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={values.password}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        placeholder="Enter password"
                        error={Boolean(touched.password && errors.password)}
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              color="secondary"
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                      {touched.password && errors.password && (
                        <FormHelperText error>{errors.password}</FormHelperText>
                      )}
                    </Stack>
                  </Grid>

                  {/* Login Button */}
                  <Grid item xs={12}>
                    <AnimateButton>
                      <Button
                        disableElevation
                        disabled={isSubmitting}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        sx={{
                          backgroundColor: '#5E748C',
                          borderRadius: 2,
                          py: 1.2,
                          textTransform: 'none',
                          fontWeight: 500,
                          '&:hover': { backgroundColor: '#4e6275' },
                        }}
                      >
                        Login
                      </Button>
                    </AnimateButton>
                  </Grid>
                </Grid>
              </form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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

AuthLogin.propTypes = { isDemo: PropTypes.bool };