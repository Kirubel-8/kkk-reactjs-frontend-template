// ConfirmDialog.js
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box } from '@mui/material';
import { DeleteOutlined } from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';

const ConfirmDialog = ({ open, onClose, onConfirm, title, description, confirmText = 'Delete', cancelText = 'Cancel' }) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: theme.spacing(3),
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.main,
            width: 50,
            height: 50,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing(2),
          }}
        >
          <DeleteOutlined sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: theme.spacing(1) }}>
          {title || "Are you sure?"}
        </Typography>
        <Typography color="textSecondary" sx={{ marginBottom: theme.spacing(2) }}>
          {description || "Do you really want to delete this item? This process cannot be undone."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', paddingBottom: theme.spacing(2) }}>
        <Button onClick={onClose} variant="contained" color="secondary" sx={{ marginRight: theme.spacing(1) }}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

