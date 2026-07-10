// material-ui
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';

// project import
import { drawerWidth } from 'config';

// ==============================|| DRAWER - MINI STYLED ||============================== //

const openedMixin = (theme) => ({
  width: drawerWidth,
  backgroundColor: '#ffffff',
  borderRight: '1px solid #E9EEF5',
  borderRadius: '0 20px 20px 0',
  boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  width: 0,
  overflowX: 'hidden',
  border: 'none',
  boxShadow: 'none',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
});

const MiniDrawerStyled = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  // width: drawerWidth,
  width: open ? drawerWidth : 80, 
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme)
  })
}));

export default MiniDrawerStyled;
