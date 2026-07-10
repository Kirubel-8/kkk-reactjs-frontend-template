import PropTypes from 'prop-types'; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Stack, InputLabel, OutlinedInput, FormHelperText, Button, Snackbar, Alert } from '@mui/material';
import * as Yup from 'yup';
import { Formik } from 'formik';
import authService from 'service/auth.service';
import AnimateButton from 'components/@extended/AnimateButton';

export default function AuthForgetPassword({ isDemo = false }) {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleForgetPasswordRequest = async (values, setSubmitting) => {
    try {
      const reset = await authService.resetpasswordrequest(values.email);
      console.log(reset.status);
      if (reset.status === 200) {
        setSnackbar({
          open: true,
          message: 'Password reset link sent to your email',
          severity: 'success',
        });

      }
    } catch (error) {
      if (error.status === 404) {
        setSnackbar({
          open: true,
          message: "User not found",
          severity: 'error',
        });
      }
    } finally {
      setSubmitting(false);  
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  const handleBackClick = () => {
    navigate('/login');
  };
  return (
    <>
      <Formik
        initialValues={{
          email: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
        })}
        onSubmit={(values, { setSubmitting }) => {
          handleForgetPasswordRequest(values, setSubmitting);
        }}
      >   
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="email-login">Email</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="string"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter Email"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="standard-weight-helper-text-email-login">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>
              {errors.submit && (
                <Grid item xs={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>

                <AnimateButton>
                  <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                    Reset Password
                  </Button>
                 
                </AnimateButton>
                <AnimateButton>
                <Button variant="outlined" color="primary" onClick={handleBackClick}>
            Back
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
