import { useRef, useState, startTransition } from 'react';
import { useTranslation } from 'react-i18next';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';

// assets
import GlobalOutlined from '@ant-design/icons/GlobalOutlined'; // Ant Design Global icon

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  const iconBackColorOpen = 'grey.100';

  const languages = [
    { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
    { code: 'am', label: 'አማርኛ', flag: 'https://flagcdn.com/w40/et.png' }
  ];

  const currentLanguage = i18n.language || 'en';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      {/* Language Selector Button */}
      <Tooltip title="Select Language" arrow>
        <IconButton
          color="secondary"
          variant="light"
          sx={{
            color: 'text.primary',
            bgcolor: open ? iconBackColorOpen : 'transparent',
          }}
          aria-label="open language selector"
          ref={anchorRef}
          aria-controls={open ? 'language-selector' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Badge
            badgeContent={currentLanguage.toUpperCase()}
            color="primary"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 16,
                minWidth: 16,
                borderRadius: '50%',
              },
            }}
          >
            <GlobalOutlined style={{ fontSize: '1.25rem' }} />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Language Selector Dropdown */}
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [{ name: 'offset', options: { offset: [matchesXs ? -5 : 0, 9] } }]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper
              sx={{
                boxShadow: theme.customShadows.z1,
                width: '100%',
                minWidth: 200,
                maxWidth: { xs: 200, md: 250 }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Language Selector"
                  elevation={0}
                  border={false}
                  content={false}
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        '&.Mui-selected': { bgcolor: 'grey.50', color: 'text.primary' }
                      }
                    }}
                  >
                    {languages.map((lang) => (
                      <ListItemButton
                        key={lang.code}
                        selected={currentLanguage === lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        <Avatar
                          src={lang.flag}
                          alt={lang.label}
                          sx={{ width: 24, height: 24, mr: 2 }}
                        />
                        <ListItemText
                          primary={
                            <Typography variant="body1" color="text.primary">
                              {lang.label}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
