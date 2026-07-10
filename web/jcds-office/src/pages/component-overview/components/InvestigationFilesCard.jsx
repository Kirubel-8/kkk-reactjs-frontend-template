import React, { useRef } from 'react';
import { Box, Card, Typography, Button, Divider, IconButton, Grid, CircularProgress } from '@mui/material';
import { FaFileAlt } from 'react-icons/fa';
import { EyeIcon } from '@heroicons/react/24/solid';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { AttachmentCard } from './utils/sharedComponents';

export default function InvestigationFilesCard({
  files = [],
  attachments = [],
  onUpload,
  onClearFiles,
  onRemoveFile,
  // fileInputRef removed
  // onSelectFile removed
  isBulkUploading,
  canEdit,
  onViewFile,
  // Staging props
  stagedDeletes = new Set(),
  stagedReplaces = new Map(),
  selectedAttachments = new Set(),
  onStageDelete,
  onStageReplace,
  onUnstage,
  onToggleSelection,
  onSelectAll,
  onBulkStageDelete,
  onSaveChanges,
  onCancelChanges,
  onSelectFiles = () => {},
  hideUploadActions = false,
  showUploadButton = false,
  title = 'Investigation Files'
}) {
  const fileInputRef = useRef(null);
  // Determine if card should be shown
  const hasContent = files.length > 0 || attachments.length > 0;
  const shouldRender = hasContent || canEdit;
  if (!shouldRender) return null;

  const handleFilePick = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    onSelectFiles(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '12px',
        p: 3,
        backgroundColor: '#fff',
        border: '1px solid #E0E0E0',
        boxShadow: 'none',
        minHeight: 'fit-content'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            color: '#215167',
            fontSize: '18px',
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        {canEdit && !hideUploadActions && (
          <>
            <input ref={fileInputRef} type="file" hidden multiple onChange={handleFilePick} aria-label="Select files to upload" />
            <Button
              variant="contained"
              disabled={isBulkUploading}
              startIcon={isBulkUploading ? <CircularProgress size={20} color="inherit" /> : <AttachFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                backgroundColor: '#007BFF99',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 0.5,
                fontSize: '0.875rem',
                borderRadius: 1,
                minHeight: '36.5px',
                '&:hover': { backgroundColor: '#007BFF' },
                '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
              }}
            >
              {isBulkUploading ? 'Uploading...' : 'Add Files'}
            </Button>
          </>
        )}
      </Box>
      <Divider sx={{ mb: 2.5, borderColor: '#E8E8E8' }} />

      {/* Selected Files for Upload Section */}
      {files.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>
              Selected for Upload ({files.length})
            </Typography>
            {showUploadButton && canEdit && !hideUploadActions && typeof onUpload === 'function' && (
              <Button
                variant="contained"
                onClick={onUpload}
                disabled={isBulkUploading}
                sx={{
                  backgroundColor: '#0d4a6f',
                  textTransform: 'none',
                  fontSize: '12px',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  '&:hover': { backgroundColor: '#0b3d5d' },
                  '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                }}
              >
                Upload
              </Button>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: '8px',
              rowGap: '16px'
            }}
          >
            {files.map((f, idx) => (
              <Box
                key={`${f.filename || f.name}-${idx}`}
                sx={{
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: { xs: '100%', sm: 'calc(50% - 4px)' },
                  maxWidth: { xs: '100%', sm: '280px' },
                  height: '64px',
                  py: '20px',
                  px: '16px',
                  backgroundColor: '#E8EEFD'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
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
                      style={{ width: '24px', height: '32px', color: '#215167', position: 'absolute', top: '8px', left: '12px' }}
                    />
                  </Box>
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
                      {f.filename || f.name}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', ml: '16px' }}>
                  <button
                    type="button"
                    onClick={() => onViewFile(f)}
                    style={{
                      width: '20px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0
                    }}
                  >
                    <EyeIcon style={{ width: '20px', height: '16px', color: '#6582CC' }} />
                  </button>
                  {canEdit && f.canDelete !== false && (
                    <IconButton size="small" onClick={() => onRemoveFile(idx, f)} sx={{ p: 0 }}>
                      <DeleteIcon sx={{ color: '#FF4C4C', fontSize: '16px' }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Existing Attachments Section */}
      {attachments.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {canEdit && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>
                  Uploaded Files ({attachments.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={onSelectAll} sx={{ textTransform: 'none', fontSize: '12px' }}>
                    {selectedAttachments.size === attachments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedAttachments.size > 0 && (
                    <Button size="small" color="error" onClick={onBulkStageDelete} sx={{ textTransform: 'none', fontSize: '12px' }}>
                      Delete ({selectedAttachments.size})
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: '8px',
              rowGap: '16px'
            }}
          >
            {attachments.map((attachment, idx) => {
              const attachmentId = attachment.case_attachment_id;
              const isStagedDelete = stagedDeletes.has(attachmentId);
              const isStagedReplace = stagedReplaces.has(attachmentId);
              const isSelected = selectedAttachments.has(attachmentId);

              return (
                <AttachmentCard
                  key={attachmentId || idx}
                  name={attachment.file_name || attachment.name || `Investigation File ${idx + 1}`}
                  size={attachment.file_size || attachment.size}
                  showStatus={false}
                  selectable={canEdit}
                  selected={isSelected}
                  onToggleSelect={canEdit ? () => onToggleSelection(attachmentId) : undefined}
                  stagedDelete={isStagedDelete}
                  stagedReplace={isStagedReplace}
                  onView={() => onViewFile(attachment)}
                  onReplaceFile={canEdit ? (file) => onStageReplace(attachmentId, file) : undefined}
                  onStageDelete={canEdit ? () => onStageDelete(attachmentId) : undefined}
                  onUndoStage={canEdit ? () => onUnstage(attachmentId) : undefined}
                />
              );
            })}
          </Box>

          {/* Save Changes Button Area */}
          {(stagedDeletes.size > 0 || stagedReplaces.size > 0) && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onCancelChanges} disabled={isBulkUploading} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onSaveChanges}
                disabled={isBulkUploading}
                sx={{ backgroundColor: '#0d4a6f', textTransform: 'none' }}
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Box>
      )}

      {!hasContent && canEdit && (
        <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
          <Typography variant="body2">No investigation files uploaded yet.</Typography>
        </Box>
      )}
    </Card>
  );
}
