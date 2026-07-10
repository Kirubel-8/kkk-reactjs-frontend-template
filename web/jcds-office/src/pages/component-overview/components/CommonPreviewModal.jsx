import React, { useEffect, useState } from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import CommonModal from './CommonModal';

/**
 * CommonPreviewModal
 * 
 * Reusable modal for previewing files (images/PDFs).
 * Handles both File objects (pre-upload) and backend attachment objects.
 */
export default function CommonPreviewModal({ file, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  // Helper to build full file URL
  const getFullFileUrl = (url) => {
    if (!url) return null;
    // Don't modify blob URLs or full URLs
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
    return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}/${url}`;
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    let url = null;
    if (file instanceof File) {
      url = URL.createObjectURL(file);
    } else if (file.file_path) {
      url = getFullFileUrl(file.file_path);
    } else if (file.preview_url) {
      // Handle blob URLs or preview URLs from staged files
      url = getFullFileUrl(file.preview_url);
    } else if (file.file_url) {
      url = getFullFileUrl(file.file_url);
    }

    setPreviewUrl(url);

    // Cleanup for Object URLs (only revoke URLs we create from File objects)
    return () => {
      if (file instanceof File && url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  const fileName = file instanceof File 
    ? file.name 
    : (file?.name || (file?.complaint_evidence_id ? 'Evidence Document' : 'Investigation File'));

  return (
    <CommonModal
      open={!!file}
      onClose={onClose}
      title={fileName}
      maxWidth="lg" // Wide modal for previews
      actions={
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ textTransform: 'none', fontSize: '14px', py: 1.2 }}
        >
          Close
        </Button>
      }
      showCloseButton={false} // Custom close button provided in actions
    >
      {previewUrl ? (
        <Box sx={{ 
          width: '100%', 
          height: '100%',
          minHeight: '600px',
          display: 'flex', 
          flexDirection: 'column', 
          bgcolor: '#f5f5f5', 
          borderRadius: 2, 
          overflow: 'hidden'
        }}>
          <iframe
            src={previewUrl}
            width="100%"
            height="100%"
            title="File Preview"
            style={{
              border: 'none',
              backgroundColor: '#fff',
              flex: 1,
              minHeight: 0
            }}
          />
        </Box>
      ) : (
        <Typography sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
          Unable to preview file.
        </Typography>
      )}
    </CommonModal>
  );
}
