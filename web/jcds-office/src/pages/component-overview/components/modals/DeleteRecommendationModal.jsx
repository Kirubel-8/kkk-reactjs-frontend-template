import CommonModal from '../../components/CommonModal';
import { Button } from '@mui/material';

/**
 * Confirms removal of a decision recommendation.
 */
export const DeleteRecommendationModal = ({ open, onClose, onConfirm }) => (
  <CommonModal
    open={open}
    onClose={onClose}
    title="Remove Recommendation"
    description="Are you sure you want to remove this decision recommendation?"
    maxWidth="xs"
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
          fontWeight: 600,
          boxShadow: '0 4px 10px rgba(220, 53, 69, 0.3)'
        }}
      >
        Remove
      </Button>
    }
  />
);
