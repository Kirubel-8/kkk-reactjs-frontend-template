// material-ui
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import logo from 'assets/images/auth/jcdms-logo2.png';
const Logo = () => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 1 }}>
      <img
        src={logo}
        alt="FJACS Logo"
        height="40"
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
};

export default Logo;
