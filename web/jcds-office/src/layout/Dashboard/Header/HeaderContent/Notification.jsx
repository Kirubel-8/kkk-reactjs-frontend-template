import { useRef, useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import {
  Avatar,
  Badge,
  ClickAwayListener,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Popper,
  Tooltip,
  Typography,
  Box,
  Collapse
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';

// icons
import BellOutlined from '@ant-design/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// sx styles
const avatarSX = { width: 36, height: 36, fontSize: '1rem' };
const actionSX = { mt: '6px', ml: 1, alignSelf: 'flex-start', transform: 'none' };

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

export default function Notification() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));
  const anchorRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await informExpertService.getUserNotifications();
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggle = () => setOpen((prevOpen) => !prevOpen);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await informExpertService.markNotificationAsRead(notificationId);

      const updatedNotifications = notifications.map((n) => (n.notification_id === notificationId ? { ...n, is_read: true } : n));
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await informExpertService.markAllAsRead();
      const updated = notifications.map((n) => ({ ...n, is_read: true }));
      setNotifications(updated);
      setUnreadCount(0);
      setReadOpen(true); // expand read section automatically
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{
          color: 'text.primary',
          bgcolor: open ? 'grey.100' : 'transparent'
        }}
        aria-label="open notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <BellOutlined style={{ fontSize: '1.25rem' }} />
        </Badge>
      </IconButton>

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
                minWidth: 285,
                maxWidth: { xs: 285, md: 420 }
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Notifications"
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    unreadCount > 0 && (
                      <Tooltip title="Mark all as read">
                        <IconButton color="success" size="small" onClick={handleMarkAllRead}>
                          <CheckCircleOutlined style={{ fontSize: '1.15rem' }} />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  {/* Scrollable container */}
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    <List
                      component="nav"
                      sx={{
                        p: 0,
                        '& .MuiListItemButton-root': {
                          py: 0.5,
                          '&.Mui-selected': { bgcolor: 'grey.50', color: 'text.primary' },
                          '& .MuiAvatar-root': avatarSX,
                          '& .MuiListItemSecondaryAction-root': {
                            ...actionSX,
                            position: 'relative'
                          }
                        }
                      }}
                    >
                      {/* Unread notifications */}
                      {unreadNotifications.length > 0 &&
                        unreadNotifications.map((n) => (
                          <Box key={n.notification_id}>
                            <ListItemButton selected onClick={() => handleNotificationClick(n.notification_id)}>
                              <ListItemAvatar>
                                <Avatar sx={{ color: 'primary.main', bgcolor: 'primary.lighter' }}>
                                  <MessageOutlined />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={<Typography variant="h6">{n.title || 'New Notification'}</Typography>}
                                secondary={n.message || 'No message provided'}
                              />
                              <ListItemSecondaryAction>
                                <Typography variant="caption" noWrap>
                                   {new Date(n.createdAt).toLocaleTimeString()}
                                </Typography>
                              </ListItemSecondaryAction>
                            </ListItemButton>
                            <Divider />
                          </Box>
                        ))}

                      {/* Read notifications section */}
                      {readNotifications.length > 0 && (
                        <>
                          <ListItemButton onClick={() => setReadOpen((prev) => !prev)} sx={{ bgcolor: 'grey.200' }}>
                            <ListItemText
                              primary={<Typography variant="subtitle1">Read Notifications ({readNotifications.length})</Typography>}
                            />
                            {readOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </ListItemButton>
                          <Collapse in={readOpen} timeout="auto" unmountOnExit>
                            {readNotifications.map((n) => (
                              <Box key={n.notification_id}>
                                <ListItemButton onClick={() => handleNotificationClick(n.notification_id)} sx={{ bgcolor: 'grey.100' }}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ color: 'grey.600', bgcolor: 'grey.300' }}>
                                      <MessageOutlined />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={<Typography variant="body1">{n.title || 'Notification'}</Typography>}
                                    secondary={n.message || 'No message provided'}
                                  />
<ListItemSecondaryAction>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Typography variant="caption" noWrap>
      {new Date(n.createdAt).toLocaleTimeString()}
    </Typography>
    <DoneAllIcon fontSize="small" sx={{ color: 'green' }} />
  </Box>
</ListItemSecondaryAction>

                                </ListItemButton>
                                <Divider />
                              </Box>
                            ))}
                          </Collapse>
                        </>
                      )}
                    </List>
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
