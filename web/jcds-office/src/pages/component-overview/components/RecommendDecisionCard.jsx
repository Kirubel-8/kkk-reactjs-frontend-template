import { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Modal,
  Fade,
  Backdrop
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Local permission helper (mirrors CaseDecisionDetail)
const hasPermission = (permissions, requiredPermission) => {
  const permissionList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return permissionList.some(({ resource, action }) =>
    permissions.some((permission) => permission.resource === resource && permission.action === action)
  );
};

const RecommendDecisionCard = ({
  decisionStatuses,
  loadingDecisionStatuses,
  selectedDecisionStatusId,
  setSelectedDecisionStatusId,
  decisionDescription,
  setDecisionDescription,
  currentRecommendation,
  isEditingRecommendation,
  setIsEditingRecommendation,
  onRecommendDecision,
  onUpdateRecommendation,
  onDeleteRecommendation,
  isUnderInvestigation,
  hasInvestigationFiles
}) => {
  const permissions = useMemo(() => {
    try {
      const p = localStorage.getItem('permissions');
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  }, []);

  const canRecommendDecision = useMemo(
    () =>
      hasPermission(permissions, {
        resource: 'complaintCase',
        action: 'recommendDecision'
      }),
    [permissions]
  );

  if (!canRecommendDecision) {
    return null;
  }

  const getRecommendationStatusName = (statusId) => {
    const found = decisionStatuses?.find((s) => s.status_id === statusId);
    return found?.name || 'Unknown status';
  };

  const [openModal, setOpenModal] = useState(false);

  const handleOpenForCreate = () => {
    if (!isUnderInvestigation || !hasInvestigationFiles) return;
    setIsEditingRecommendation(false);
    setSelectedDecisionStatusId('');
    setDecisionDescription('');
    setOpenModal(true);
  };

  const handleOpenForEdit = () => {
    if (!isUnderInvestigation) return;
    if (!currentRecommendation) return;
    setIsEditingRecommendation(true);
    setSelectedDecisionStatusId(currentRecommendation.status_with_agenda_id || '');
    setDecisionDescription(currentRecommendation.description || '');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handlePrimaryAction = () => {
    if (!isUnderInvestigation) return;
    if (currentRecommendation && isEditingRecommendation) {
      onUpdateRecommendation();
    } else {
      onRecommendDecision();
    }
    // Close modal after submission; parent will surface any errors via snackbar.
    setOpenModal(false);
  };

  return (
    <>
      <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#041f36', fontSize: '16px', mb: 1 }}>
            Recommend Decision
          </Typography>
          <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.12)' }} />

          {currentRecommendation ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '14px', mb: 0.5 }}>
                Current Recommendation
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                    {getRecommendationStatusName(currentRecommendation.status_with_agenda_id)}
                  </Typography>
                  {currentRecommendation.description && (
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontSize: '13px',
                        color: 'text.secondary',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {currentRecommendation.description}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={handleOpenForEdit}
                    disabled={!isUnderInvestigation}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={onDeleteRecommendation}
                    disabled={!isUnderInvestigation}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px', mb: 2 }}>
              Recommend a decision status and optional note for this complaint.
            </Typography>
          )}

          {!currentRecommendation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {!hasInvestigationFiles && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', fontStyle: 'italic', mb: 0.5 }}>
                  Please add investigation files above before recommending a decision.
                </Typography>
              )}
              <Button
                variant="contained"
                disabled={!hasInvestigationFiles || !isUnderInvestigation}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  backgroundColor: hasInvestigationFiles && isUnderInvestigation ? '#1E516A' : '#9E9E9E',
                  '&:hover': { backgroundColor: hasInvestigationFiles && isUnderInvestigation ? '#16425a' : '#9E9E9E' },
                  '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                }}
                onClick={currentRecommendation ? handleOpenForEdit : handleOpenForCreate}
              >
                Recommend Decision
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 300,
            sx: { backgroundColor: 'rgba(0,0,0,0.3)' }
          }
        }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              bgcolor: 'rgba(255,255,255,1)',
              borderRadius: 4,
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#041f36', fontSize: '16px' }} gutterBottom>
              {currentRecommendation && isEditingRecommendation ? 'Edit Recommendation' : 'Recommend Decision'}
            </Typography>
            <Divider sx={{ mb: 1, borderColor: 'rgba(0,0,0,0.12)' }} />

            {!isUnderInvestigation && (
              <Typography variant="body2" color="error" sx={{ mb: 2, fontSize: '14px' }}>
                Recommendations can only be added or edited while the complaint is under investigation.
              </Typography>
            )}

            <FormControl fullWidth size="small">
              <InputLabel id="recommend-decision-modal-status-label" sx={{ fontSize: '14px' }}>
                Status with Agenda
              </InputLabel>
              <Select
                labelId="recommend-decision-modal-status-label"
                id="recommend-decision-modal-status-select"
                value={selectedDecisionStatusId || ''}
                label="Status with Agenda"
                onChange={(e) => setSelectedDecisionStatusId(e.target.value)}
                disabled={loadingDecisionStatuses || !isUnderInvestigation}
                sx={{ fontSize: '14px' }}
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

            {/* <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Optional decision recommendation note..."
              value={decisionDescription}
              onChange={(e) => setDecisionDescription(e.target.value)}
              disabled={!isUnderInvestigation}
              sx={{
                '& .MuiInputBase-input': { fontSize: '14px' },
                '& .MuiInputLabel-root': { fontSize: '14px' }
              }}
            /> */}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                mt: 1
              }}
            >
              <Button variant="text" onClick={handleCloseModal} sx={{ textTransform: 'none', fontSize: '14px' }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePrimaryAction}
                disabled={!isUnderInvestigation}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  backgroundColor: isUnderInvestigation ? '#1E516A' : '#9E9E9E',
                  '&:hover': { backgroundColor: isUnderInvestigation ? '#16425a' : '#9E9E9E' },
                  '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                }}
              >
                {currentRecommendation && isEditingRecommendation ? 'Save Changes' : 'Save Recommendation'}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default RecommendDecisionCard;
