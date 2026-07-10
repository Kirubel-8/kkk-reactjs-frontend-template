import PropTypes from 'prop-types';

// material-ui
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';

// project import
import { drawerWidth } from 'config';

// ==============================|| HEADER - APP BAR STYLED ||============================== //

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  position: 'fixed',
  left: open ? 'calc(309px + 32px)' : 0,
  right: 0,
  top: theme.layout?.topSpacing || 20,
  height: '78px',
  width: open ? 'calc(100% - 309px - 64px)' : 'calc(100% - 32px)',
  margin: '0 auto',
  backgroundColor: theme.palette.background.paper,
  borderBottom: '1px solid #E9EEF5',
  borderRadius: '10px',
  boxShadow: '0px 2px 6px 0px rgba(144, 146, 148, 0.2)',
  transition: theme.transitions.create(['left', 'width', 'background-color', 'box-shadow'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.shorter,
  }),
}));


AppBarStyled.propTypes = {
  open: PropTypes.bool
};

export default AppBarStyled;
