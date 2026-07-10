import { useMemo, useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

// project import
import AppBarStyled from './AppBarStyled';
import HeaderContent from './HeaderContent';
import Search from './HeaderContent/Search';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets
import MenuFoldOutlined from '@ant-design/icons/MenuFoldOutlined';
import MenuUnfoldOutlined from '@ant-design/icons/MenuUnfoldOutlined';

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export default function Header() {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // header content
  const headerContent = useMemo(() => <HeaderContent />, []);

  // add a shadow to the header when scroll
  const [elevate, setElevate] = useState(false);
  useEffect(() => {
    const handleScroll = () => setElevate(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  //

  const iconBackColor = 'grey.100';
  const iconBackColorOpen = 'grey.200';

  // common header
  const mainHeader = (
    <Toolbar
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '78px',
        minHeight: '78px',
      }}
    >
     {/* Left section: Drawer button + Search */}
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <IconButton
          disableRipple
          aria-label="open drawer"
          onClick={() => handlerDrawerOpen(!drawerOpen)}
          edge="start"
          color="secondary"
          sx={{
            color: 'text.primary',
            bgcolor: 'transparent',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)', transform: 'scale(1.05)' },
          }}
        >
          {!drawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </IconButton>
        {/* <Search /> */}
      </Box>

     {/* Right section: profile, notifications, etc */}
     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <HeaderContent />
      </Box>
  </Toolbar>
  );

  // app-bar params - responsive to drawer state
  const appBar = {
    position: 'fixed',
    color: 'inherit',
    elevation: 0,
    sx: {
      zIndex: theme.zIndex.drawer + 1,
      position: 'fixed',
      left: drawerOpen ? 'calc(309px + 32px)' : 0,
      right: 0,
      top: theme.layout?.topSpacing || 20,
      width: drawerOpen ? 'calc(100% - 309px - 64px)' : 'calc(100% - 32px)',
      margin: '0 auto',
      backgroundColor: theme.palette.background.paper,
      borderBottom: '1px solid #E9EEF5',
      borderRadius: '15px',
      boxShadow: '0px 2px 6px 0px rgba(144, 146, 148, 0.2)',
      transition: theme.transitions.create(['left', 'width', 'background-color', 'box-shadow'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      })
    },
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled position="fixed" color="inherit" elevation={elevate ? 4 : 0} open={drawerOpen}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
}
