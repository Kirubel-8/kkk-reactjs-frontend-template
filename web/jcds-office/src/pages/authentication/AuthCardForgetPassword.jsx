import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import logo from '../cci logo1.png';
// project import
import MainCard from 'components/MainCard';

// ==============================|| AUTHENTICATION - CARD WRAPPER ||============================== //

export default function AuthCardForgetPassword({ children, ...other }) {
  return (
    <MainCard
      sx={{
        width: { xs: '90%', sm: '85%', lg: '50%' },  
        margin: { xs: 2.5, md: 3 },
        display: 'flex',
        justifyContent: 'center',  
        alignItems: 'center',  
        minHeight: '350px', 
      }}
      content={false}
      {...other}
      border={false}
      boxShadow
      shadow={(theme) => theme.customShadows.z1}
    >
      <Box sx={{ p: { xs: 2, sm: 3, md: 4, xl: 5 } }}>
        <Grid container spacing={3} direction="column">
          <Grid
            item
            xs={12}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '120px',  
            }}
          >
          </Grid>

          <Grid item xs={12}>
            {children}
          </Grid>
        </Grid>
      </Box>
    </MainCard>
  );
}

AuthCardForgetPassword.propTypes = {
  children: PropTypes.node,
  other: PropTypes.any,
};
