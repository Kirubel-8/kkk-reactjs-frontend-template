import React, { useRef } from 'react';
import { Box, Typography, Divider, Checkbox, IconButton, Button } from '@mui/material';
import { FaFileAlt } from 'react-icons/fa';
import { EyeIcon } from '@heroicons/react/24/solid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getStatusColor } from './caseInfoHelpers';

/**
 * Renders an info row with label and value, matching viewDetailComplaint3 style
 */
export const InfoRow = ({ label, value, color }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: '12px'
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 400,
          fontSize: '16px',
          color: '#212121'
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 400,
          fontSize: '16px',
          color: color ?? '#212121',
          textAlign: 'right'
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/**
 * Section header component with title, optional status, and optional action
 */
export const SectionHeader = ({ title, status, action }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: '16px'
    }}
  >
    <Typography
      sx={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 600,
        fontSize: '18px',
        color: '#215167'
      }}
    >
      {title}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {action}
      {status && (
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            color: getStatusColor(status),
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {status}
        </Typography>
      )}
    </Box>
  </Box>
);

/**
 * Witness Row Component - Matches viewDetailComplaint3 style
 */
export const WitnessRow = ({ name, phone }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: '12px'
    }}
  >
    <Typography
      sx={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        color: '#212121'
      }}
    >
      {name || 'Unknown Witness'}
    </Typography>
    <Typography
      sx={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 400,
        fontSize: '16px',
        color: '#212121'
      }}
    >
      {phone || 'N/A'}
    </Typography>
  </Box>
);

/**
 * Attachment Card Component - Matches viewDetailComplaint3 style; optionally supports selection and staging controls
 */
export const AttachmentCard = ({
  name,
  size,
  status,
  showStatus,
  onView,
  onDelete,
  // Selection
  selectable = false,
  selected = false,
  onToggleSelect,
  // Staging / editing
  stagedDelete = false,
  stagedReplace = false,
  onReplaceFile,
  onStageDelete,
  onUndoStage,
  // Additional action slot
  actions
}) => {
  const fileInputRef = useRef(null);
  const shouldShowStatus = showStatus && status;
  const statusIcon =
    shouldShowStatus && (status === 'approved' || status === 'verified') ? (
      <CheckCircleIcon sx={{ color: '#2e7d32', width: 20, height: 20 }} />
    ) : shouldShowStatus && status === 'rejected' ? (
      <CloseIcon sx={{ color: '#c62828', width: 20, height: 20 }} />
    ) : null;

  const handleActivate = () => {
    if (onView) onView();
  };

  const handleKeyDown = (event) => {
    if (!onView) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onView();
    }
  };

  const backgroundColor = stagedDelete ? '#fee2e2' : stagedReplace ? '#fef3c7' : '#E8EEFD';
  const borderStyles =
    stagedDelete || stagedReplace
      ? {
          border: '1px solid',
          borderColor: stagedDelete ? '#fecaca' : '#fde68a'
        }
      : {};

  const handleReplaceClick = (event) => {
    event.stopPropagation();
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && onReplaceFile) {
      onReplaceFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box
      sx={{
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '320px',
        height: '64px',
        py: '20px',
        px: '16px',
        backgroundColor,
        ...borderStyles,
        ":hover": {
          backgroundColor: stagedDelete || stagedReplace ? backgroundColor : '#D8EDFD'
        },
        cursor: onView ? 'pointer' : 'default'
      }}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
        {selectable && (
          <Checkbox
            size="small"
            checked={selected}
            onChange={(event) => {
              event.stopPropagation();
              onToggleSelect?.();
            }}
            sx={{ p: 0, mr: '8px' }}
          />
        )}
        {/* Icon Background */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          <FaFileAlt
            style={{
              width: '24px',
              height: '32px',
              color: '#215167',
              position: 'absolute',
              top: '8px',
              left: '12px'
            }}
          />
        </Box>

        {/* File Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, ml: '16px', minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: '16px',
              color: '#0A1D39',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {name}
          </Typography>
          {stagedDelete && (
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                color: '#ef4444',
                mt: '2px'
              }}
            >
              Marked for deletion
            </Typography>
          )}
          {stagedReplace && (
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                color: '#d97706',
                mt: '2px'
              }}
            >
              Marked for replacement
            </Typography>
          )}
          {size && (
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: '14px',
                color: '#949494',
                mt: '4px'
              }}
            >
              {size}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Action Icons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', ml: '16px' }}>
        {onReplaceFile && (
          <>
            <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} aria-label="Select replacement file" />
            <IconButton
              component="span"
              size="small"
              onClick={handleReplaceClick}
              onMouseDown={(event) => event.stopPropagation()}
              sx={{ p: 0 }}
            >
              <EditIcon sx={{ color: '#64748b', fontSize: '16px' }} />
            </IconButton>
          </>
        )}
        {onStageDelete && !stagedDelete && !stagedReplace && (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onStageDelete();
            }}
            sx={{ p: 0 }}
          >
            <DeleteIcon sx={{ color: '#FF4C4C', fontSize: '16px' }} />
          </IconButton>
        )}
        {(stagedDelete || stagedReplace) && onUndoStage && (
          <Button
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onUndoStage();
            }}
            sx={{ minWidth: 'auto', p: 0.5, fontSize: '11px', textTransform: 'none' }}
          >
            Undo
          </Button>
        )}
        {onView && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onView();
            }}
            style={{
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0
            }}
          >
            <EyeIcon style={{ width: '20px', height: '20px', color: '#6582CC' }} />
          </button>
        )}
        {actions}
        {statusIcon}
      </Box>
    </Box>
  );
};

