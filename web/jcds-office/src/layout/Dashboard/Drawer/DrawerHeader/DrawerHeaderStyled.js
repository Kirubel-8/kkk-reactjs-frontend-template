// material-ui
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

const DrawerHeaderStyled = styled(Box, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '78px',
  minHeight: '78px',
  backgroundColor: '#ffffff',
  // borderBottom: '1px solid #E9EEF5',
}));

export default DrawerHeaderStyled;
