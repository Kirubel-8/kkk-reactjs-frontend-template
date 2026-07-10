// project import
import NavCard from './NavCard';
import Navigation from './Navigation';
import SimpleBar from 'components/third-party/SimpleBar';
import Box from '@mui/material/Box';
import DrawerHeader from '../DrawerHeader';
import { useGetMenuMaster } from 'api/menu';

// ==============================|| DRAWER CONTENT ||============================== //

export default function DrawerContent({ mini }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  return (
    <>
      {/* <SimpleBar
        sx={{
          '& .simplebar-content': {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderRight: '1px solid #E4E9F1',
            borderRadius: '0 20px 20px 0',
            minHeight: '100vh',
            paddingTop: 1,
            boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
            padding: '8px 12px',
            // hide scrollbar completely
            overflowY: 'hidden !important',
          },
        }}
        >
        <Navigation />
        <NavCard />
      </SimpleBar> */}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#fff',
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: '#fff',
            padding: '0px 16px',
          }}
        >
          <DrawerHeader open={drawerOpen} />
        </Box>
        <Box
          sx={{
            padding: '8px 12px',
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
          }}
        >
          <Navigation />
          <NavCard />
        </Box>
      </Box>

    </>
  );
}
