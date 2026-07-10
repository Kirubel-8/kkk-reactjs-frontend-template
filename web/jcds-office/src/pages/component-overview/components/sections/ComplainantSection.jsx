import React from 'react';
import { Box, Divider } from '@mui/material';
import { SectionHeader, InfoRow } from '../utils/sharedComponents';

/**
 * ComplainantSection - Renders complainant information fields
 * Presentational component that displays complainant data
 */
const ComplainantSection = ({ complainantInfo, fields = [] }) => {
  if (!fields || fields.length === 0) return null;

  return (
    <Box sx={{ mb: '16px' }}>
      <SectionHeader title="Complainant Information" status={complainantInfo?.status} />
      {fields.map((field) => (
        <React.Fragment key={field.label}>
          <Divider sx={{ borderColor: '#E8E8E8' }} />
          <InfoRow label={field.label} value={field.value} />
        </React.Fragment>
      ))}
    </Box>
  );
};

export default ComplainantSection;
