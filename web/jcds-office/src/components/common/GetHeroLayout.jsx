import { Box, Button, Container, Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import backgroundImage from '../../assets/images/cityscape.png';

/**
 * Renders a reusable single-hero layout for "Get" pages with a cityscape background,
 * centered call-to-action, and an optional content area below the hero.
 */
const GetHeroLayout = ({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  loading = false,
  children,
  background = backgroundImage,
}) => {
  const theme = useTheme();
  const actionContent = useMemo(() => (
    <>
      {actionIcon}
      {actionIcon ? ' ' : ''}
      {actionLabel}
    </>
  ), [actionIcon, actionLabel]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7f8fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        
      }}
    >
      <Box
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          backgroundImage: `url(${background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          mb: 4,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.78)',
          }}
        />
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            py: { xs: 6, md: 8 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight={700} color="#215167">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
              {subtitle}
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={onAction}
            disabled={loading}
            sx={{
              mt: 1,
              borderRadius: '5px',
              px: 4,
              py: 1.2,
              fontWeight: 'bold',
              textTransform: 'none',
              background: theme.palette.primary.main,
              boxShadow: '0 10px 22px rgba(0,0,0,0.08)',
              '&:hover': { background: theme.palette.primary.dark },
            }}
          >
            {loading ? 'Loading...' : actionContent}
          </Button>
        </Container>
      </Box>

      <Box sx={{ pb: 6, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
};

GetHeroLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actionLabel: PropTypes.string.isRequired,
  actionIcon: PropTypes.node,
  onAction: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node,
  background: PropTypes.string,
};

export default GetHeroLayout;

