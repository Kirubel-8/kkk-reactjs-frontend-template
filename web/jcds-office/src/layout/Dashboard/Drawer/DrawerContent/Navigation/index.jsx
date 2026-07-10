import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Project imports
import useMenuItems from 'menu-items'; // Import the useMenuItems function
import NavGroup from './NavGroup';

// ============================== DRAWER CONTENT - NAVIGATION ============================== //

export default function Navigation() {
  const { items } = useMenuItems();
  const navGroups = items.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
