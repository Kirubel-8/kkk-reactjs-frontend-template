import React from 'react';
import { Modal, Box, Typography, Button, Backdrop, Fade, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

/**
 * CommonModal
 * 
 * Reusable modal component for standardizing dialogs across the application.
 * Updated to match the "Evidence Preview" modal style.
 */
const CommonModal = ({ 
  open, 
  onClose, 
  title, 
  description, 
  children, 
  actions, 
  maxWidth = 'sm',
  width,
  showCloseButton = true, // Controls the "Cancel" button in footer
  hideCloseIcon = false, // Controls the "X" icon in header
  onDownload, // Download handler function
  saving = false // Loading state for download
}) => {
  
  // Map maxWidth string to typical widths
  const widthMap = {
    xs: '300px',
    sm: '500px',
    md: '700px',
    lg: '900px',
    xl: '1100px'
  };

  // Helper to resolve modal width/maxWidth in one place
  const resolvedWidth = width || { xs: '90%', sm: widthMap[maxWidth] || maxWidth };
  const resolvedMaxWidth = width ? 'none' : (widthMap[maxWidth] || maxWidth);

  const handleClose = (event, reason) => {
    // Prevent closing on backdrop click
    if (reason === 'backdropClick') return;
    if (onClose) onClose(event, reason);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { 
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)' // Matches Good Modal
          }
        }
      }}
      aria-labelledby="common-modal-title"
      aria-describedby="common-modal-description"
    >
      <Fade in={open}>
        <Box 
          sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // width: width || { xs: '90%', sm: '850px' },
            width: resolvedWidth,
            maxWidth: resolvedMaxWidth,
            // height : '800px',
            bgcolor: 'rgba(255,255,255,1)',
            borderRadius: 4,
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3, // Matches Good Modal gap
            outline: 'none',
            transition: 'all 0.4s ease-in-out'
          }}
        >
          {/* Header Section */}
          {(title || !hideCloseIcon) && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={description ? 0 : 0}>
                {title && (
                  <Typography
                    id="common-modal-title"
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#041f36', // Matches Good Modal
                      fontSize: '18px',
                      fontFamily: "'Montserrat', sans-serif"
                    }}
                  >
                    {title}
                  </Typography>
                )}
                <Box display="flex" alignItems="center" gap={1}>
                  {/* Download Button */}
                  {onDownload && (
                    <IconButton
                      aria-label="download"
                      onClick={onDownload}
                      disabled={saving}
                      size="small"
                      sx={{
                        color: saving ? 'rgba(0,0,0,0.26)' : 'rgba(0,0,0,0.54)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)'
                        },
                        '&:disabled': {
                          opacity: 0.5,
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      {saving ? (
                        <Box
                          component="div"
                          sx={{
                            width: 20,
                            height: 20,
                            border: '2px solid rgba(0,0,0,0.26)',
                            borderTop: '2px solid rgba(0,0,0,0.54)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                      ) : (
                        <ArrowDownTrayIcon style={{ width: 20, height: 20 }} />
                      )}
                    </IconButton>
                  )}
                  {/* Close Button */}
                  {!hideCloseIcon && onClose && (
                    <IconButton
                      aria-label="close modal"
                      onClick={(e) => onClose(e, 'closeButtonClick')}
                      size="small"
                    >
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
              {description && (
                <Typography
                  id="common-modal-description"
                  sx={{
                    mt: 1,
                    color: 'text.secondary',
                    fontSize: '0.95rem',
                    fontFamily: "'Montserrat', sans-serif"
                  }}
                >
                  {description}
                </Typography>
              )}
            </Box>
          )}

          {/* Divider if title exists */}
          {(title) && (
            <Divider sx={{ borderColor: 'rgba(0,0,0,0.12)', mt: -2 }} />
          )}

          {/* Content Section */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </Box>

          {/* Actions Section */}
          {actions && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 'auto'
              }}
            >
              {showCloseButton && (
                <Button
                  onClick={(e) => onClose && onClose(e, 'cancelButtonClick')}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.8,
                    color: 'text.primary',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </Button>
              )}
              {actions}
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default CommonModal;
