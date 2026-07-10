import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

// icons
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// ==============================|| PROFILE TAB - MODERN CLEAN UI ||============================== //

export default function ProfileTab({ onSubmit, fullName, roles }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const go = (event, index, route) => {
    setSelectedIndex(index);
    if (route) navigate(route);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35 }}
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* USER NAME + ROLE CARD */}
      <Box
        sx={{
          p: 1.8,
          mb: 1.3,
          borderRadius: '18px',
          background: '#f7f9ff',
          boxShadow: '0 3px 12px rgba(0,0,0,0.06)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {fullName}
        </Typography>

        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.3 }}>
          {roles}
        </Typography>
      </Box>

      {/* ACTION LIST */}
      <List sx={{ p: 0 }}>
        {/* View Profile */}
        <ListItemButton
          selected={selectedIndex === 1}
          onClick={(e) => go(e, 1, '/user-management')}
          sx={{
            borderRadius: '14px',
            mb: 1,
            py: 1.25,
            transition: '.25s',
            '&:hover': {
              background: '#eef4ff',
              transform: 'translateY(-1px)',
              boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
            }
          }}
        >
          <ListItemIcon sx={{ color: '#3F5BFF' }}>
            <UserOutlined />
          </ListItemIcon>
          <ListItemText primary="View Profile" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* Logout */}
        <ListItemButton
          selected={selectedIndex === 3}
          onClick={onSubmit}
          sx={{
            borderRadius: '14px',
            py: 1.25,
            background: '#fff4f4',
            border: '1px solid #ffe1e1',
            color: '#d62828',
            fontWeight: 600,
            '&:hover': {
              background: '#ffeaea',
              transform: 'translateY(-1px)',
              boxShadow: '0 3px 10px rgba(255,0,0,0.15)'
            }
          }}
        >
          <ListItemIcon sx={{ color: '#d62828' }}>
            <LogoutOutlined />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </motion.div>
  );
}

ProfileTab.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  fullName: PropTypes.string.isRequired,
  roles: PropTypes.string.isRequired
};
