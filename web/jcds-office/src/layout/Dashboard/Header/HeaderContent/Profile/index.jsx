import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import authService from 'service/auth.service';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import userService from 'service/user.service';
import { useStateContext } from '../../../../../routes/contextProvider';

// components
import ProfileTab from './ProfileTab';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';

// icons
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// ==============================|| HEADER CONTENT - NEW PREMIUM DROPDOWN ||============================== //

export default function Profile() {
  const theme = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useStateContext();

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event) => {
    if (anchorRef.current?.contains(event.target)) return;
    setOpen(false);
  };

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      const decoded = jwtDecode(userToken);
      userService.getUserProfile(decoded.id)
        .then(setUserProfile)
        .catch(console.error);
    }
  }, []);

  const logout = async () => {
    await authService.logout(setToken);
    navigate('/login');
  };

  // Tabs
  const [value, setValue] = useState(0);
  const onTabChange = (event, newValue) => setValue(newValue);

  // Format roles for display
  const roles = userProfile?.roles?.map((r) => r.name) || [];
  const firstRole = roles[0] || 'Role placeholder';
  const remainingRoles = roles.slice(1);
  const displayRole = remainingRoles.length > 0 ? `${firstRole}...` : firstRole;
  const fullRolesText = roles.join(', ') || 'Role placeholder';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      {/* BUTTON THAT OPENS DROPDOWN */}
      <ButtonBase
        sx={{
          px: 1.2,
          py: 0.4,
          borderRadius: '12px',
          backdropFilter: 'blur(6px)',
          background: open ? 'rgba(130,160,255,0.15)' : 'transparent',
          transition: '.25s',
          '&:hover': { background: 'rgba(130,160,255,0.2)' }
        }}
        ref={anchorRef}
        onClick={handleToggle}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Stack spacing={0} alignItems="flex-start">
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {userProfile?.full_name ?? 'User'}
            </Typography>
            {remainingRoles.length > 0 ? (
              <Tooltip title={fullRolesText} arrow>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary', 
                    lineHeight: 1.2,
                    cursor: 'help',
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayRole}
                </Typography>
              </Tooltip>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                {displayRole}
              </Typography>
            )}
          </Stack>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <UserOutlined style={{ fontSize: 20, color: '#666' }} />
          </Box>
        </Stack>
      </ButtonBase>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        transition
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 10] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="fade" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={{
                width: 300,
                overflow: 'hidden',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.12)',
                mt: 2.5
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard content={false} border={false}>
                  {/* HEADER */}
                  <CardContent sx={{ p: 3, mt:-4 }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                      <Grid item>
                        <Stack spacing={0.3}>
                          {/* <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {userProfile?.full_name}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            {userProfile?.roles?.map((r) => r.name).join(', ') || 'No role'}
                          </Typography> */}
                        </Stack>
                      </Grid>

                      {/* LOGOUT ICON */}
                      {/* <Grid item>
                        <Tooltip title="Logout">
                          <IconButton size="medium" onClick={logout} sx={{ color: '#d62828' }}>
                            <LogoutOutlined />
                          </IconButton>
                        </Tooltip>
                      </Grid> */}
                    </Grid>
                  </CardContent>

                  {/* TABS */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={onTabChange} variant="fullWidth">
                      <Tab
                        icon={<UserOutlined style={{ marginRight: 8 }} />}
                        iconPosition="start"
                        label="Profile"
                      />
                    </Tabs>
                  </Box>

                  {/* CONTENT */}
                  <Box sx={{ p: 1.5 }}>
                    <ProfileTab
                      onSubmit={logout}
                      fullName={userProfile?.full_name}
                      roles={userProfile?.roles?.map((r) => r.name).join(', ')}
                    />
                  </Box>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
