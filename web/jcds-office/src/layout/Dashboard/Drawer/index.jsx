import PropTypes from 'prop-types';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';

// project import
import DrawerContent from './DrawerContent';
import DrawerHeader from './DrawerHeader';
import MiniDrawerStyled from './MiniDrawerStyled';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { drawerWidth } from 'config';
import { useTheme } from '@mui/material/styles';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

export default function MainDrawer({ window }) {
  const theme = useTheme();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const matchDownMD = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  
  const topSpacing = theme.layout?.topSpacing || 20;

  // responsive drawer container
  const container = window !== undefined ? () => window().document.body : undefined;

  // header content
  const drawerContent = useMemo(() => <DrawerContent />, []);
  // const drawerHeader = useMemo(() => <DrawerHeader open={!!drawerOpen} />, [drawerOpen]);

  // Define width for mobile/tablet
  const mobileDrawerWidth = 200; // smaller width
  const desktopDrawerWidth = drawerWidth; //default drawer width

  const isMini = matchDownMD; // consider mobile/tablet as "mini"

  return (
    <Box component="nav" sx={{ flexShrink: { md: 0 }, zIndex: 1200 }} aria-label="mailbox folders">
      {!matchDownMD ? (
        <MiniDrawerStyled
          variant="permanent"
          open={drawerOpen}
          sx={{
            mt: `${topSpacing}px`, // align with header top position
            borderRadius: '10px',
            ml: '20px', // gap from left edge
            height: `calc(100vh - ${topSpacing}px)`, // full height minus top margin
            position: 'sticky',
            top: `${topSpacing}px`, // align with header
            overflow: 'hidden',
            boxShadow: '0px 2px 6px 0px rgba(144, 146, 148, 0.2)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            sx={{
              overflowY: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              '-ms-overflow-style': 'none',
              'scrollbar-width': 'none',
            }}
          >
            {/* {drawerContent} */}
            <DrawerContent mini={!drawerOpen} />
          </Box>
        </MiniDrawerStyled>
     
        ) : (
        <Drawer
          container={container}
          variant="temporary"
          open={drawerOpen}
          onClose={() => handlerDrawerOpen(!drawerOpen)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopDrawerWidth,
              borderRight: '1px solid',
              borderRightColor: 'divider',
              
              boxShadow: '0px 2px 6px 0px rgba(144, 146, 148, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',

              ml: '16px', // gap from left edge
              height: `calc(100vh - ${topSpacing}px)`, // full height minus top margin
              position: 'sticky',
              top: `${topSpacing}px`, // align with header
              borderRadius: '10px',

              overflowY: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
              '-ms-overflow-style': 'none',
              'scrollbar-width': 'none',
            }
          }}
        >
          
          <Box
            sx={{
              paddingX: "10px", // Match the header padding
            }}
          >
            {/* {drawerContent} */}
            <DrawerContent mini={isMini} />
          </Box>
        </Drawer>
      )}
    </Box>
  );
}

MainDrawer.propTypes = { window: PropTypes.func };