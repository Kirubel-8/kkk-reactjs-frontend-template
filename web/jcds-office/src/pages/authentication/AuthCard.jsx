import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import logo from '../cci logo1.png';
// project import
import MainCard from 'components/MainCard';

// ==============================|| AUTHENTICATION - CARD WRAPPER ||============================== //

export default function AuthCard({ children, ...other }) {
  return (
    <MainCard
      sx={{
        maxWidth: { xs: 400, lg: 700 }, 
        margin: { xs: 2.5, md: 3 },
        '& > *': { flexGrow: 1, flexBasis: '50%' },
      }}
      content={false}
      {...other}
      border={false}
      boxShadow
      shadow={(theme) => theme.customShadows.z1}
    >
      <Box sx={{ p: { xs: 2, sm: 3, md: 4, xl: 5 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} variant="h6">
           <img src={logo} alt="CCI_logo" style={{ maxWidth: '100%', height: '350px' }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            {children}
          </Grid>
        </Grid>
      </Box>
    </MainCard>
  );
}

AuthCard.propTypes = {
  children: PropTypes.node,
  other: PropTypes.any,
};
