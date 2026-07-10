import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

// project import
import Logo from 'components/logo';
import DrawerHeaderStyled from './DrawerHeaderStyled';

// ==============================|| DRAWER HEADER ||============================== //

export default function DrawerHeader({ open }) {
  const theme = useTheme();

  return (
    <>
      <DrawerHeaderStyled theme={theme} open={!!open}>
        <Logo isIcon={!open} sx={{ width: open ? 'auto' : 35, height: 40 }} />
      </DrawerHeaderStyled>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Divider sx={{ width: '75%', borderColor: '#E9E9E9' }} />
      </Box>
    </>
  );
}

DrawerHeader.propTypes = { open: PropTypes.bool };
