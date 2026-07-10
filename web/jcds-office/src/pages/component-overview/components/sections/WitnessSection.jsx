import React, { useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { EyeIcon } from '@heroicons/react/24/solid';
import { useTheme } from '@mui/material/styles';
import { WitnessRow } from '../utils/sharedComponents';

/**
 * WitnessSection - Renders witness information with modal for viewing all
 * Presentational component that displays witness data
 */
const WitnessSection = ({ witnesses = [], maxDisplay = 3 }) => {
  const [openWitnessModal, setOpenWitnessModal] = useState(false);
  const theme = useTheme();

  if (!witnesses || witnesses.length === 0) return null;

  const displayedWitnesses = witnesses.slice(0, maxDisplay);
  const hasMoreWitnesses = witnesses.length > maxDisplay;

  return (
    <>
      <Box sx={{ mb: '16px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: '18px',
              color: '#094C81'
            }}
          >
            Witness Information
          </Typography>
          {hasMoreWitnesses && (
            <button
              onClick={() => setOpenWitnessModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0
              }}
            >
              <EyeIcon style={{ width: '20px', height: '20px', color: '#094C81' }} />
            </button>
          )}
        </Box>
        {displayedWitnesses.map((witness, index) => (
          <React.Fragment key={index}>
            <Divider sx={{ borderColor: '#E8E8E8' }} />
            <WitnessRow name={witness.name} phone={witness.phone} />
          </React.Fragment>
        ))}
      </Box>

      {/* Witness List Modal - Matching viewDetailComplaint3 style */}
      {openWitnessModal && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.modal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.15)',
              width: '692px',
              maxHeight: '480px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: '16px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f9fafb'
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  color: '#094C81'
                }}
              >
                Witness Information
              </Typography>
              <button
                onClick={() => setOpenWitnessModal(false)}
                style={{
                  padding: '8px',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ height: '24px', width: '24px' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Box>

            {/* Modal Content */}
            <Box sx={{ overflowY: 'auto', flex: 1, p: '24px' }}>
              {witnesses && witnesses.length > 0 ? (
                witnesses.slice(0, 8).map((witness, index) => (
                  <React.Fragment key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: '12px'
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 400,
                          fontSize: '16px',
                          color: '#212121'
                        }}
                      >
                        {witness.name || 'N/A'}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 400,
                          fontSize: '16px',
                          color: '#212121'
                        }}
                      >
                        {witness.phone || 'N/A'}
                      </Typography>
                    </Box>
                    {index < Math.min(witnesses.length, 8) - 1 && <Divider sx={{ borderColor: '#E8E8E8' }} />}
                  </React.Fragment>
                ))
              ) : (
                <Box sx={{ py: '12px' }}>
                  <Typography
                    sx={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                      fontSize: '16px',
                      color: '#212121'
                    }}
                  >
                    No witnesses available
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default WitnessSection;
