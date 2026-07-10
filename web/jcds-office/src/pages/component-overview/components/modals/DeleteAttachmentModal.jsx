import CommonModal from '../../components/CommonModal';
import { Button } from '@mui/material';

/**
 * Confirms deletion of an investigation attachment.
 */
export const DeleteAttachmentModal = ({ open, onClose, onConfirm }) => (
  <CommonModal
    open={open}
    onClose={onClose}
    title="Delete Investigation File"
    description="Are you sure you want to delete this investigation file? This action cannot be undone."
    maxWidth="sm"
    actions={
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          px: 2.5,
          py: 0.8,
          fontWeight: 600
        }}
      >
        Delete
      </Button>
    }
  />
);





