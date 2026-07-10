import React from 'react';
import { Box, Typography } from '@mui/material';
import { MdOutlineMessage } from 'react-icons/md';

/**
 * FeedbackSection - Renders feedback in the same bubble style as the applicant view.
 */
const FeedbackSection = ({ feedbackEntries = [], status }) => {
  const normalizedStatus = (status || '').toString().toLowerCase();
  const isDecided = normalizedStatus === 'decided';

  if (feedbackEntries.length === 0) {
    return null;
  }

  const normalizedEntries = Array.isArray(feedbackEntries)
    ? feedbackEntries
        .map((entry, idx) => {
          const text = entry?.comment || entry?.message || '';
          const timestamp =
            entry?.createdAt ||
            entry?.created_at ||
            entry?.updatedAt ||
            entry?.updated_at ||
            entry?.date ||
            null;
          const dateText = timestamp
            ? (() => {
                const parsed = new Date(timestamp);
                return Number.isNaN(parsed.getTime())
                  ? ''
                  : parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              })()
            : '';

          const userId = entry?.user_id ?? entry?.userId;
          const customerId = entry?.customer_id ?? entry?.customerId;
          const isFromUser = userId !== null && userId !== undefined;
          const isFromCustomer = !isFromUser && customerId !== null && customerId !== undefined;

          const messageAlignment = isFromUser ? 'flex-start' : 'flex-end';
          const messageBgColor = isFromUser ? '#4475F21F' : '#E8EEFD';
          const authorName =
            entry?.author_name ||
            entry?.user_name ||
            entry?.customer_name ||
            entry?.source ||
            (isFromUser ? 'Staff' : isFromCustomer ? 'Customer' : '');

          return {
            key: entry?.complaint_rejection_id || entry?.id || `feedback-${idx}`,
            text,
            dateText,
            messageAlignment,
            messageBgColor,
            authorName
          };
        })
        .filter((item) => item && (item.text || item.dateText))
    : [];

  const hasFeedback = normalizedEntries.length > 0;
  const containerMinHeight = isDecided ? '20rem' : '28.5rem';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '48rem',
        borderRadius: '12px',
        border: '1px solid #E0E0E0',
        backgroundColor: 'white',
        minHeight: containerMinHeight
      }}
    >
      {/* Header */}
      <Box sx={{ mt: '-12px', pt: '12px' }}>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: '18px',
            color: '#222222',
            px: '24px',
            pt: '24px'
          }}
        >
          Feedback Section
        </Typography>
      </Box>

      {/* Separator */}
      <Box sx={{ mt: '12px', width: '100%', height: '1px', borderBottom: '1px solid #E8E8E8' }} />

      {/* Content */}
      {hasFeedback ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            pt: '16px',
            px: '24px',
            pb: '24px',
            overflow: 'hidden',
            backgroundColor: '#F7F7FF'
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              pr: '8px',
              '&::-webkit-scrollbar': { display: 'none' },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {normalizedEntries.map((entry) => (
              <Box
                key={entry.key}
                sx={{
                  alignSelf: entry.messageAlignment,
                  maxWidth: '85%',
                  backgroundColor: entry.messageBgColor,
                  borderRadius: '8px',
                  p: '12px',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                  textAlign: 'left'
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Source Sans Pro', sans-serif",
                    fontWeight: 400,
                    fontSize: '15.75px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#073954',
                    mb: '8px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {entry.text || 'No description provided'}
                </Typography>
                {(entry.authorName || entry.dateText) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: '8px',
                      pt: '8px',
                      borderTop: '1px solid #E8E8E8'
                    }}
                  >
                    {entry.authorName ? (
                      <Typography
                        sx={{
                          fontFamily: "'Source Sans Pro', sans-serif",
                          fontWeight: 400,
                          fontSize: '12px',
                          color: '#718096',
                          mr: '8px'
                        }}
                      >
                        {entry.authorName}
                      </Typography>
                    ) : (
                      <span />
                    )}
                    {entry.dateText && (
                      <Typography
                        sx={{
                          fontFamily: "'Source Sans Pro', sans-serif",
                          fontWeight: 400,
                          fontSize: '12px',
                          color: '#718096'
                        }}
                      >
                        {entry.dateText}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, px: '24px', pb: '24px' }}>
          <MdOutlineMessage style={{ width: '48px', height: '48px', color: '#718096A6' }} />
          <Box sx={{ mt: '12px', textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: '16px',
                textAlign: 'center',
                color: '#718096',
                mb: '8px'
              }}
            >
              No issue has been submitted.
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: '16px',
                textAlign: 'center',
                color: '#718096'
              }}
            >
              Please feel free to provide your question or the issue you
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 400,
                fontSize: '16px',
                textAlign: 'center',
                color: '#718096',
                mt: '4px'
              }}
            >
              are facing whenever you are ready. we are here to help.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FeedbackSection;

