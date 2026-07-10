import React from 'react';
import { Box, Card } from '@mui/material';

/**
 * InfoCardWrapper - Pure wrapper component for case information cards
 * Provides Card styling and layout without any business logic
 */
const InfoCardWrapper = ({ children, grow = false }) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        width: '100%',
        height: grow ? '100%' : 'fit-content',
        maxHeight: 'calc(100vh - 230px)',
        minHeight: grow ? '100%' : 'fit-content',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        pt: '32px',
        px: '32px',
        pb: '32px',
        ...(grow && {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flex: 1
        }),
        ...(!grow && {
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '9999px' },
          '&::-webkit-scrollbar-track': { backgroundColor: '#f8fafc' },
          msOverflowStyle: 'auto',
          scrollbarWidth: 'none'
        })
      }}
    >
      <Box
        sx={{
          ...(grow && {
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '9999px' },
            '&::-webkit-scrollbar-track': { backgroundColor: '#f8fafc' },
            msOverflowStyle: 'auto',
            scrollbarWidth: 'none'
          })
        }}
      >
        {children}
      </Box>
    </Card>
  );
};

export default InfoCardWrapper;
