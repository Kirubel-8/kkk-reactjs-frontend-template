import React from 'react';
import { Box, Divider } from '@mui/material';
import { SectionHeader, InfoRow } from '../utils/sharedComponents';

/**
 * CaseInfoSection - Renders case information fields
 * Presentational component that displays case/judge data
 */
const CaseInfoSection = ({ judgeInfo, fields = [], caseStatusLabel = null, showComplainantStatus = false }) => {
  if (!fields || fields.length === 0) return null;

  // Show case status label only if complainant section is not shown
  const statusToShow = !showComplainantStatus && caseStatusLabel ? caseStatusLabel : null;

  return (
    <Box sx={{ mb: '16px' }}>
      <SectionHeader title="Case Information" status={statusToShow} />
      {fields.map((field) => (
        <React.Fragment key={field.label}>
          <Divider sx={{ borderColor: '#E8E8E8' }} />
          <InfoRow label={field.label} value={field.value} color={field?.color ?? null} />
        </React.Fragment>
      ))}
    </Box>
  );
};

export default CaseInfoSection;
