import React from 'react';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const InlineDottedProgress = styled(CircularProgress)(({ theme, spinnercolor }) => ({
  color: spinnercolor || theme.palette.primary.contrastText,
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
    strokeDasharray: '0.1, 10',
    strokeDashoffset: 0,
    animationDuration: '1.5s'
  },
  width: 20,
  height: 20
}));

export default function LoadingIcon({ size = 20, thickness = 4, color }) {
  return <InlineDottedProgress size={size} thickness={thickness} spinnercolor={color} />;
}

LoadingIcon.propTypes = {
  size: PropTypes.number,
  thickness: PropTypes.number,
  color: PropTypes.string
};
