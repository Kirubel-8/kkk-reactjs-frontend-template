import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ errorCode = 404, errorMessage = "Page Not Found" }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        bgcolor: '#f9f9f9',
        px: 3,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 'bold',
          fontSize: '6rem',
          color: '#3c3e96',
          mb: 2,
        }}
      >
        {errorCode}
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          mb: 1,
        }}
      >
        {errorMessage}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 3,
          color: 'gray',
          maxWidth: '500px',
        }}
      >
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/')}
        sx={{
          bgcolor: '#3c3e96',
          color: '#fff',
          '&:hover': {
            bgcolor: '#43a047',
          },
        }}
      >
        Home Page
      </Button>
    </Box>
  );
};

export default ErrorPage;
