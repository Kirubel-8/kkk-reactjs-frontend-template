import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const isValidDate = (date) => !isNaN(new Date(date).getTime());
const formatDate = (date) => (isValidDate(date) ? format(new Date(date), 'dd/MM/yyyy, hh:mm a') : 'N/A');

const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const CaseDetailModal = ({ open, onClose, logs }) => {
  if (!logs || logs.length === 0) return null;

  const rowSize = 5;
  const rowChunks = chunkArray(logs, rowSize);
console.log("logloglog",rowChunks);
  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth sx={{ '& .MuiDialog-paper': { width: '90%', maxWidth: '1200px' } }}>
      <DialogTitle
        sx={{
          fontWeight: 'bold',
          fontSize: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          pt: 3
        }}
      >
        Case Status Log
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rowChunks.map((row, rowIndex) => {
            const isEvenRow = rowIndex % 2 === 0;
            const isSecondRow = rowIndex === 1;

            return (
              <Box
                key={rowIndex}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: isEvenRow ? 'flex-start' : 'flex-end',
                  gap: 4,
                  alignItems: isSecondRow ? 'flex-start' : 'center'
                }}
              >
                {row.map((log, itemIndex) => {
                  const globalIndex = rowIndex * rowSize + itemIndex;

                  // Skip regular rendering for 5th and 6th in second row
                  if (isSecondRow && (itemIndex === 4 || itemIndex === 5)) return null;

                  return (
                    <Box
                      key={log?.activity_log_id || globalIndex}
                      sx={{
                        width: 'calc(20% - 3.2px)',
                        minWidth: '200px',
                        position: 'relative',
                        borderRadius: 2,
                        padding: 2
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#22c55e', fontWeight: 600, mb: 1 }}>
                        {/* {log?.new_value?.case_status || log?.new_value || 'Status'} */}
                             {log.new_value?.case_status || log.new_value?.status || 'Status'}

                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            mr: 1
                          }}
                        />
                        <Box
                          sx={{
                            height: 4,
                            backgroundColor: '#22c55e',
                            borderRadius: 2,
                            flex: 1
                          }}
                        />
                      </Box>

                      <Typography variant="body1" sx={{ color: '#2563eb', fontWeight: 500 }}>
                        {log?.user?.full_name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                        {formatDate(log?.updatedAt)}
                      </Typography>
                    </Box>
                  );
                })}

                {/* Special vertical column for 5th and 6th logs in second row */}
                {isSecondRow && row[4] && row[5] && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      position: 'relative',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '260px', // ensure enough height for the line
                      pt: 2,
                      pb: 2
                    }}
                  >
                    {/* Vertical Line Connector */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '45px', // adjust this to align with the top dot
                        bottom: '45px', // adjust this to align with the bottom dot
                        left: '20px', // aligns with the dot's center horizontally
                        width: '4px',
                        backgroundColor: '#22c55e',
                        zIndex: 0,
                        borderRadius: 2
                      }}
                    />

                    {[4, 5].map((i) => {
                      const log = row[i];
                      if (!log) return null;
                      const globalIndex = rowIndex * rowSize + i;

                      return (
                        <Box
                          key={log.activity_log_id || globalIndex}
                          sx={{
                            width: 'calc(20% - 3.2px)',
                            minWidth: '200px',
                            position: 'relative',
                            borderRadius: 2,
                            padding: 2,
                            zIndex: 1,
                            backgroundColor: 'white'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: '#22c55e', fontWeight: 600, mb: 1 }}>
                            {/* {log.new_value?.case_status || log.new_value || 'Status'} */}
                             {log.new_value?.case_status || log.new_value?.status || 'Status'}

                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                mr: 1,
                                zIndex: 2
                              }}
                            />
                            <Box
                              sx={{
                                height: 4,
                                backgroundColor: '#22c55e',
                                borderRadius: 2,
                                flex: 1,
                                zIndex: 2
                              }}
                            />
                          </Box>

                          <Typography variant="body1" sx={{ color: '#2563eb', fontWeight: 500 }}>
                            {log.user?.full_name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                            {formatDate(log.updatedAt)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetailModal;