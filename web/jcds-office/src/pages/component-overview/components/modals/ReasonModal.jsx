import { Button, Box, Typography, TextField } from '@mui/material';
import CommonModal from '../../components/CommonModal';

/**
 * Modal wrapper for collecting a reason/comment before submitting an action.
 */
const ReasonModal = ({
  open,
  title,
  placeholder,
  value,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  submitColor = '#c4ae68',
  disabled
}) => {
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={title}
      width={{ xs: '90%', sm: 520 }}
      showCloseButton={false}
      actions={
        <>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1.1,
              minWidth: 120,
              borderColor: '#d0d0d0',
              color: '#5c6a7a'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={onSubmit}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1.1,
              minWidth: 120,
              backgroundColor: disabled ? '#d6d6d6' : submitColor,
              color: '#fff',
              '&:hover': { backgroundColor: disabled ? '#d6d6d6' : submitColor }
            }}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <Box>
        <Typography fontWeight={600} fontSize="14px" color="text.primary" mb={1}>
          Description
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#f5f5f5'
            }
          }}
        />
      </Box>
    </CommonModal>
  );
};

export default ReasonModal;

