import React from 'react';
import { Box, Card, CardContent } from '@mui/material';

/**
 * CaseContentCardWrapper - Pure wrapper component for case content cards
 * Provides Card styling and layout without any business logic
 */
const CaseContentCardWrapper = ({ children, grow = false }) => {
  return (
    <Card
      sx={{
        height: grow ? '100%' : 'fit-content',
        maxHeight: 'calc(100vh - 230px)',
        minHeight: grow ? '100%' : 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        bgcolor: '#fff',
        overflow: 'auto',
        ...(grow && {
          flex: 1
        })
      }}
    >
      <CardContent
        sx={{
          p: 4,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '9999px' },
          '&::-webkit-scrollbar-track': { backgroundColor: '#f8fafc' },
          msOverflowStyle: 'auto',
          scrollbarWidth: 'none'
        }}
      >
        <Box display="flex" flexDirection="column" gap={3} sx={{ height: '100%' }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CaseContentCardWrapper;
