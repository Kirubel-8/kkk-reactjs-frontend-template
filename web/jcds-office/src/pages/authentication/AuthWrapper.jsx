import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import AuthFooter from 'components/cards/AuthFooter';
import loginBg from 'assets/images/auth/Login_background.png';

export default function AuthWrapper({ children }) {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f5f8fb',
        backgroundImage: `url(${loginBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover', 
        backgroundPosition: 'center'
      }}
    >
      {children}

      <Box sx={{ position: 'absolute', bottom: 16, width: '100%' }}>
        <AuthFooter />
      </Box>
    </Box>
  );
}

AuthWrapper.propTypes = { children: PropTypes.node };