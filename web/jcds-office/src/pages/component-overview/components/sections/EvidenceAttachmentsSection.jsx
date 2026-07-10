import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { AttachmentCard } from '../utils/sharedComponents';

/**
 * EvidenceAttachmentsSection - Renders evidence attachments
 * Presentational component that displays evidence files
 */
const EvidenceAttachmentsSection = ({ attachments = [], showEvidenceStatus = false, onViewAttachment }) => {
  if (!attachments || attachments.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: '18px',
              color: '#215167'
            }}
          >
            Evidence Attachments
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#E8E8E8', mb: '16px' }} />
        <Box sx={{ py: '16px' }}>
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
              fontSize: '16px',
              color: '#212121'
            }}
          >
            No evidence files available
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: '18px',
            color: '#215167'
          }}
        >
          Evidence Attachments
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#E8E8E8', mb: '16px' }} />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: '10px',
          rowGap: '14px'
        }}
      >
        {attachments.map((file, index) => (
          <AttachmentCard
            key={index}
            name={file.name}
            size={file.size}
            status={file.status || file.file_status} // status on disciplinary is file.file_status - TODO: Make this consistent
            showStatus={showEvidenceStatus}
            onView={() => onViewAttachment && onViewAttachment(file)}
          />
        ))}
      </Box>
    </Box>
  );
};

export default EvidenceAttachmentsSection;
