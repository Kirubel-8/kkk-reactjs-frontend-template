import PropTypes from 'prop-types';
// material-ui
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ant-design icons
import { DownOutlined, UpOutlined } from '@ant-design/icons';

// project import
import { useGetMenuMaster } from 'api/menu';
import { useState } from 'react';
import NavItem from './NavItem';

export default function NavGroup({ item }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const theme = useTheme();
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded((prevState) => ({ ...prevState, [id]: !prevState[id] }));
  };

  const navCollapse = item.children?.map((menuItem) => {
    switch (menuItem.type) {
      case 'collapse':
        return (
          <div key={menuItem.id}>
            <ListItemButton
              onClick={() => toggleExpand(menuItem.id)}
              sx={{
                pl: drawerOpen ? 3 : 1.5,
                py: 1.1,
                mx: 1,
                mb: 0.5,
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#EEF4FA',
                  color: theme.palette.primary.main,
                },
                '&.Mui-selected': {
                  bgcolor: '#E7F1FA',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                },
              }}
            >
              {menuItem.icon && (
                <ListItemIcon
                  sx={{
                    color: expanded[menuItem.id] ? 'primary.main' : 'text.primary'
                  }}
                >
                  <menuItem.icon />
                </ListItemIcon>
              )}
              <ListItemText
                primary={
                  <Typography
                    variant="h6"
                    sx={{
                      color: expanded[menuItem.id] ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {menuItem.title}
                  </Typography>
                }
              />
              {expanded[menuItem.id] ? <UpOutlined /> : <DownOutlined />}
            </ListItemButton>
            <Collapse in={expanded[menuItem.id]} timeout="auto" unmountOnExit>
              <List sx={{ pl: 3 }}>
                {menuItem.children?.map((nestedItem) => (
                  <NavItem
                    key={nestedItem.id}
                    item={nestedItem}
                    level={0.5}
                    sx={{ pl: 2 }} // Preserved as requested
                  />
                ))}
              </List>
            </Collapse>
          </div>
        );
      case 'item':
        return <NavItem key={menuItem.id} item={menuItem} level={1} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  });

  return (
    <List
      subheader={
        item.title &&
        drawerOpen && (
          <Box sx={{ pl: 3, mb: 1.5, mt: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              {item.title}
            </Typography>
          </Box>
        )
      }
      sx={{
        mb: drawerOpen ? 1.5 : 0,
        py: 0,
        zIndex: 0
      }}
    >
      {navCollapse}
    </List>
  );
}

NavGroup.propTypes = { item: PropTypes.object };
