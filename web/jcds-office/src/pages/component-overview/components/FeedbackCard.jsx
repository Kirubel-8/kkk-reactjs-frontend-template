import React from 'react';
import { Box, Card, Typography, Divider } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

export default function FeedbackCard({ title, content, type = 'warning' }) {
  if (!content) return null;

  const getStatusColor = () => {
    switch (type) {
      case 'error': return '#e74c3c'; // Red for Rejection
      case 'warning': return '#f39c12'; // Orange for Return/Warning
      default: return '#0d4a6f';
    }
  };

  const color = getStatusColor();

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        p: 3,
        backgroundColor: '#fff'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <ErrorIcon sx={{ color: color, fontSize: '24px' }} />
        <Typography 
          sx={{ 
            color: '#094C81', 
            fontSize: '18px', 
            fontWeight: 600 
          }}
        >
          {title || 'Feedback Section'}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
      <Typography
        sx={{
          fontSize: '14px',
          color: '#334155',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap'
        }}
      >
        {content}
      </Typography>
    </Card>
  );
}
