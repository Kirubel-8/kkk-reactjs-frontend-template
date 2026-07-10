import CommonModal from '../../components/CommonModal';
import { Alert, Box, Button, Chip, TextField, Typography } from '@mui/material';

/**
 * Shows evidence preview and review actions.
 */
export const EvidencePreviewModal = ({
  open,
  onClose,
  evidences = [],
  currentEvidence,
  currentDocIndex,
  evidenceSrc,
  isImageEvidence,
  canManageEvidence,
  showRejectionField,
  comment,
  onCommentChange,
  onApproveEvidence,
  onRejectClick,
  onConfirmReject,
  onCancelRejection,
  onPrevious,
  onNext
}) => {
  if (!currentEvidence) return null;

  const evidenceStatusRaw = currentEvidence?.status || currentEvidence?.file_status || '';
  const evidenceStatus = typeof evidenceStatusRaw === 'string' ? evidenceStatusRaw.toLowerCase() : '';
  const isApprovedLike = evidenceStatus === 'approved' || evidenceStatus === 'verified';
  const evidenceCountLabel = evidences.length > 1 ? `Evidence ${currentDocIndex + 1} of ${evidences.length}` : '';

  return (
    <CommonModal open={open} onClose={onClose} title="Evidence Preview" width={canManageEvidence ? 1100 : 900}>
      <Box display="flex" flexDirection={{ xs: 'column', md: canManageEvidence ? 'row' : 'column' }} gap={3}>
        <Box sx={{ flex: canManageEvidence ? 2 : 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {(currentEvidence || evidences.length > 1) && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-end', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
                p: 1.5,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                backgroundColor: '#f9fafb'
              }}
            >
              {currentEvidence && evidenceStatus && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={evidenceStatus.charAt(0).toUpperCase() + evidenceStatus.slice(1)}
                    sx={{
                      backgroundColor:
                        evidenceStatus === 'approved' || evidenceStatus === 'verified'
                          ? '#EAF6EA'
                          : evidenceStatus === 'rejected'
                            ? '#FDECEA'
                            : '#FFF8E1',
                      color:
                        evidenceStatus === 'approved' || evidenceStatus === 'verified'
                          ? 'green'
                          : evidenceStatus === 'rejected'
                            ? 'red'
                            : '#FFB800',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                    size="small"
                  />
                </Box>
              )}

              {evidences.length > 1 && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onPrevious}
                    disabled={currentDocIndex === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Previous File
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    {evidenceCountLabel}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onNext}
                    disabled={currentDocIndex === evidences.length - 1}
                    sx={{ textTransform: 'none' }}
                  >
                    Next File
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <Box
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 12px 28px rgba(15,23,42,0.08)'
            }}
          >
            {isImageEvidence ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '600px',
                  backgroundColor: '#fff'
                }}
              >
                <Box
                  component="img"
                  src={evidenceSrc || ''}
                  alt={currentEvidence?.file_name || 'Evidence image'}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: '100%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            ) : (
              <iframe
                src={evidenceSrc || ''}
                width="100%"
                height="600px"
                title="Evidence Document"
                style={{
                  display: 'block',
                  border: 'none',
                  backgroundColor: '#fff'
                }}
              />
            )}
          </Box>

          {evidenceStatus === 'rejected' && currentEvidence?.rejection_reason && (
            <Alert severity="error" sx={{ mt: 1 }}>
              Previously rejected: {currentEvidence.rejection_reason}
            </Alert>
          )}
          {/* {!canManageEvidence && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Evidence review actions are available only while the complaint is under investigation.
            </Alert>
          )} */}
        </Box>

        {canManageEvidence && (
          <Box
            sx={{
              flex: '0 0 275px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}
          >
            {!showRejectionField ? (
              <>
                <Alert severity="warning" icon={false} sx={{ bgcolor: '#FFF8E1', color: '#7A6800' }}>
                  You can give a comment about the report when approving the request.
                </Alert>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={isApprovedLike}
                    sx={{
                      backgroundColor: isApprovedLike ? '#9E9E9E' : '#4CAF50',
                      textTransform: 'none',
                      py: 1,
                      '&:hover': { backgroundColor: isApprovedLike ? '#9E9E9E' : '#43A047' },
                      '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                    }}
                    onClick={() => {
                      console.log('currentEvidence', currentEvidence);
                      onApproveEvidence(currentEvidence.complaint_evidence_id || currentEvidence.evidence_id)
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={evidenceStatus === 'rejected'}
                    sx={{
                      backgroundColor: evidenceStatus === 'rejected' ? '#9E9E9E' : '#E53935',
                      textTransform: 'none',
                      py: 1.5,
                      '&:hover': { backgroundColor: evidenceStatus === 'rejected' ? '#9E9E9E' : '#D32F2F' },
                      '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                    }}
                    onClick={onRejectClick}
                  >
                    Reject
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Alert severity="warning" icon={false} sx={{ bgcolor: '#FFF8E1', color: '#7A6800' }}>
                  You can give a comment about the report when approving the request.
                </Alert>
                <Typography fontWeight={600} fontSize="16px">
                  Rejection Reason
                </Typography>
                <TextField
                  multiline
                  minRows={6}
                  placeholder="Please enter the reason for rejection..."
                  value={comment}
                  onChange={onCommentChange}
                  fullWidth
                />
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button variant="outlined" onClick={onCancelRejection}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: '#E53935',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#D32F2F' }
                    }}
                    onClick={() => onConfirmReject(currentEvidence.complaint_evidence_id)}
                  >
                    Confirm Reject
                  </Button>
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
    </CommonModal>
  );
};
