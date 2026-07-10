import PropTypes from 'prop-types';
import { forwardRef, useEffect } from 'react';
import { Link, useLocation, matchPath } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

// project import
import { handlerActiveItem, useGetMenuMaster } from 'api/menu';

export default function NavItem({ item, level, mini }) {
  const theme = useTheme();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const openItem = menuMaster.openedItem;

  const { pathname } = useLocation();
  const isSelected =
    !!(item.url && matchPath({ path: item.url, end: true }, pathname)) || openItem === item.id;

  useEffect(() => {
    if (pathname === item.url) handlerActiveItem(item.id);
  }, [pathname]);

  // ====================
  // Font customization
  const fontFamily = "'Montserrat', sans-serif"; 
  const fontSize = '0.95rem';
  const fontWeight = 500; // medium
  const selectedFontWeight = 600; // bolder when selected

  // Colors from theme
  const textColor = theme.palette.grey[700];
  const textSelectedColor = theme.palette.primary.contrastText;
  const bgSelected = theme.palette.primary.main;
  const bgHover = theme.palette.primary.light;
  // =====================

  let itemTarget = '_self';
  if (item.target) itemTarget = '_blank';

  let listItemProps = {
    component: forwardRef((props, ref) => (
      <Link ref={ref} {...props} to={item.url || '#'} target={itemTarget} />
    )),
  };
  if (item?.external) {
    listItemProps = { component: 'a', href: item.url || '#', target: itemTarget };
  }

  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} /> : false;

  return (
    <ListItemButton
      {...listItemProps}
      disabled={item.disabled}
      onClick={() => handlerActiveItem(item.id)}
      selected={isSelected}
      sx={{
        zIndex: 1201,
        pl: drawerOpen ? `${level * 28}px` : 1.5,
        py: !drawerOpen && level === 1 ? 1.25 : 1,
        my: 0.5,
        borderRadius: '10px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: bgHover,
          '& .MuiTypography-root': { color: textSelectedColor },
          '& .MuiListItemIcon-root': { color: textSelectedColor },
        },
        '&.Mui-selected': {
          bgcolor: bgSelected,
          '& .MuiTypography-root': {
            color: textSelectedColor,
            fontWeight: selectedFontWeight,
          },
          '& .MuiListItemIcon-root': {
            color: textSelectedColor,
          },
          '&:hover': {
            bgcolor: bgHover,
          },
        },
      }}
    >
      {itemIcon && (
        <ListItemIcon
          sx={{
            minWidth: 28,
            color: isSelected ? textSelectedColor : textColor,
            transition: 'color 0.2s ease',
            ...(!drawerOpen && {
              borderRadius: 1.5,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                bgcolor: 'secondary.lighter',
              },
            }),
          }}
        >
          {itemIcon}
        </ListItemIcon>
      )}

      {(drawerOpen || (!drawerOpen && level !== 1)) && (
        <ListItemText
          primary={
            // !mini ? (
            <Typography
              variant="body2"
              sx={{
                color: isSelected ? textSelectedColor : textColor,
                fontFamily,
                fontSize,
                fontWeight: isSelected ? selectedFontWeight : fontWeight,
                transition: 'color 0.2s ease',
              }}
            >
              {item.title}
            </Typography>
            // ) : null
          }
        />
      )}

      {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
        <Chip
          color={item.chip.color}
          variant={item.chip.variant}
          size={item.chip.size}
          label={item.chip.label}
          avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
        />
      )}
    </ListItemButton>
  );
}

NavItem.propTypes = { item: PropTypes.object, level: PropTypes.number };
