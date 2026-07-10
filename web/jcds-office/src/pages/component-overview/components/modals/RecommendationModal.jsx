import CommonModal from '../../components/CommonModal';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';

/**
 * Accept complaint modal with optional recommendation.
 */
export const RecommendationModal = ({
  open,
  onClose,
  onSubmit,
  decisionStatuses,
  selectedDecisionStatusId,
  onStatusChange,
  decisionDescription,
  onDecisionDescriptionChange,
  loadingDecisionStatuses,
  canSubmit
}) => (
  <CommonModal
    open={open}
    onClose={onClose}
    title="Accept Complaint"
    width={{ xs: '90%', sm: 500 }}
    showCloseButton={false}
    actions={
      <>
        <Button variant="text" onClick={onClose} sx={{ textTransform: 'none', fontSize: '14px' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!canSubmit}
          color="inherit"
          sx={{
            textTransform: 'none',
            fontSize: '14px',
            color: '#fff',
            backgroundColor: '#28a745 !important',
            '&:hover': { backgroundColor: canSubmit ? '#16425a' : '#9E9E9E' },
            '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
          }}
        >
          Submit
        </Button>
      </>
    }
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!canSubmit && (
        <Typography variant="body2" color="error" sx={{ mb: 2, fontSize: '14px' }}>
          Recommendations can only be added while the complaint is under investigation.
        </Typography>
      )}

      <FormControl fullWidth size="small">
        <InputLabel id="recommend-decision-modal-status-label" sx={{ fontSize: '14px', py: 0.5 }}>
          Recommended Decision
        </InputLabel>
        <Select
          labelId="recommend-decision-modal-status-label"
          id="recommend-decision-modal-status-select"
          value={selectedDecisionStatusId || ''}
          label="Status with Agenda (optional)"
          onChange={onStatusChange}
          disabled={loadingDecisionStatuses || !canSubmit}
          sx={{ fontSize: '14px', backgroundColor: '#f2f2f2', py: 0.5 }}
        >
          {loadingDecisionStatuses ? (
            <MenuItem disabled sx={{ fontSize: '14px' }}>
              Loading...
            </MenuItem>
          ) : !decisionStatuses || decisionStatuses.length === 0 ? (
            <MenuItem disabled sx={{ fontSize: '14px' }}>
              No statuses available
            </MenuItem>
          ) : (
            decisionStatuses.map((status) => (
              <MenuItem key={status.status_id} value={status.status_id} sx={{ fontSize: '14px' }}>
                {status.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <TextField
        multiline
        rows={3}
        fullWidth
        placeholder="Optional decision recommendation note..."
        value={decisionDescription}
        onChange={onDecisionDescriptionChange}
        disabled={!canSubmit}
        sx={{
          '& .MuiInputBase-input': { fontSize: '14px' },
          '& .MuiInputLabel-root': { fontSize: '14px' },
          backgroundColor: '#f2f2f2'
        }}
      />
    </Box>
  </CommonModal>
);





