import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Box, Backdrop, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const DottedProgress = styled(CircularProgress)(({ theme, size }) => ({
  color: theme.palette.primary.main,
  position: 'relative',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
    strokeDasharray: '0.1, 10',
    strokeDashoffset: 0,
    animationDuration: '1.5s'
  },
  ...(size === 'small' && {
    width: '40px !important',
    height: '40px !important'
  }),
  ...(size === 'medium' && {
    width: '60px !important',
    height: '60px !important'
  }),
  ...(size === 'large' && {
    width: '80px !important',
    height: '80px !important'
  })
}));

const LoadingContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.8)'
}));

export function Loading({
  open = true,
  size = 'medium',
  thickness = 2,
  text = '',
  overlayColor = 'rgba(255, 255, 255, 0.5)',
  overlayBlur = '0px'
}) {
  const [showLoading, setShowLoading] = useState(open);

  useEffect(() => {
    setShowLoading(open);
  }, [open]);

  if (!showLoading) return null;

  return (
    <Backdrop
      open={showLoading}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        backgroundColor: overlayColor,
        backdropFilter: `blur(${overlayBlur})`,
        transition: 'opacity 0.1s ease'
      }}
    >
      <LoadingContent>
        <DottedProgress size={size} thickness={thickness} variant="indeterminate" />
        {text && (
          <Box mt={2}>
            <Typography variant="subtitle1" color="textSecondary">
              {text}
            </Typography>
          </Box>
        )}
      </LoadingContent>
    </Backdrop>
  );
}

Loading.propTypes = {
  open: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  thickness: PropTypes.number,
  text: PropTypes.string,
  overlayColor: PropTypes.string,
  overlayBlur: PropTypes.string
};

Loading.defaultProps = {
  open: true,
  size: 'medium',
  thickness: 2,
  text: '',
  overlayColor: 'rgba(255, 255, 255, 0.5)',
  overlayBlur: '0px'
};
