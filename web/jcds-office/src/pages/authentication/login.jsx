// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project import
import AuthWrapper from './AuthWrapper';
import AuthLogin from './auth-forms/AuthLogin';

// ================================|| LOGIN ||================================ //

export default function Login() {
  return (
   <AuthWrapper>
  <Grid
    container
    spacing={3}
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Grid item xs={12} sm={8} md={5}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: { xs: -0.5, sm: 0.5 } }}
      >
      </Stack>
      <AuthLogin />
    </Grid>
  </Grid>
</AuthWrapper>

  );
}