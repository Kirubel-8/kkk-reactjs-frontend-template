import React from 'react';
import { Card, CardContent, Typography, Divider, Box, Chip, Button } from '@mui/material';

/**
 * Renders the left-side case review details card with applicant, complaint, and witness information (user provided information excl evidence)
 */
const CaseReviewLeftCard = ({ applicant, complaintMeta, witnesses, onOpenComplaintDetails }) => {
  const typographyStyles = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: '16px',
    color: '#041f36'
  };

  const renderFieldRows = (rows, labelWidth = '140px') =>
    rows.map(([label, value]) => (
      <Box
        key={label}
        sx={{
          display: 'grid',
          gridTemplateColumns: `${labelWidth} 1fr`,
          alignItems: 'center',
          gap: 6,
          mb: 1
        }}
      >
        <Typography fontWeight={600} color="text.secondary" sx={{ fontSize: '14px' }}>
          {label}:
        </Typography>
        <Typography fontWeight={600} color="text.primary" sx={{ fontSize: '14px' }}>
          {value || '-'}
        </Typography>
      </Box>
    ));

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
          Applicant Information
        </Typography>
        <Divider sx={{ mb: 1, borderColor: 'rgba(0,0,0,0.12)' }} />
        {renderFieldRows(
          [
            ['Name', applicant?.full_name],
            ['Email', applicant?.email],
            ['Phone', applicant?.phone_number],
            ['Gender', applicant?.gender],
            ['Address', applicant?.address]
          ],
          '120px'
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
            Complaint Information
          </Typography>
          <Divider sx={{ mb: 1, borderColor: 'rgba(0,0,0,0.12)' }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: 6,
              mb: 1,
              alignItems: 'center'
            }}
          >
            <Typography fontWeight={600} color="text.secondary" sx={{ fontSize: '14px' }}>
              Case Type:
            </Typography>
            <Chip
              size="small"
              label={
                complaintMeta?.case_type
                  ? complaintMeta.case_type.charAt(0).toUpperCase() + complaintMeta.case_type.slice(1)
                  : 'N/A'
              }
              sx={{
                backgroundColor: '#EAF3F7',
                color: '#1E516A',
                fontWeight: 600,
                textTransform: 'capitalize',
                width: 'fit-content',
                fontSize: '12px',
                px: 1.25,
                py: 0.5
              }}
            />
          </Box>
          {renderFieldRows(
            [
              ['Complaint ID', complaintMeta?.complaint_id],
              ['Judge Name', complaintMeta?.judge_name || 'N/A'],
              ['Case File Number', complaintMeta?.case_file_number],
              ['Act Date', complaintMeta?.act_date]
            ],
            '150px'
          )}
          <Box sx={{ mt: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onOpenComplaintDetails}
              sx={{ textTransform: 'none', fontSize: '14px', py: 1, borderRadius: 2, fontWeight: 600 }}
            >
              View complaint details
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
            Witness Information
          </Typography>
          <Divider sx={{ mb: 1, borderColor: 'rgba(0,0,0,0.12)' }} />
          {witnesses && witnesses.length > 0 ? (
            witnesses.map((witness, index) => (
              <Box key={witness.witness_id || index} sx={{ mb: index < witnesses.length - 1 ? 2 : 0 }}>
                {witnesses.length > 1 && (
                  <Typography fontWeight={700} color="primary" sx={{ fontSize: '14px', mb: 1 }}>
                    Witness {index + 1}
                  </Typography>
                )}
                {renderFieldRows(
                  [
                    ['Full Name', witness?.witness_name],
                    ['Address', witness?.witness_address]
                  ],
                  '120px'
                )}
              </Box>
            ))
          ) : (
            <Typography fontWeight={600} color="text.secondary" sx={{ fontSize: '14px' }}>
              No witnesses listed
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CaseReviewLeftCard;
