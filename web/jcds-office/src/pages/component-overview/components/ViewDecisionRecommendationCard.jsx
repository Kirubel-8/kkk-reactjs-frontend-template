import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip
} from '@mui/material';
// import RecommendIcon from '@mui/icons-material/Recommend';

const ViewDecisionRecommendationCard = ({
  recommendation,
  decisionStatuses = []
}) => {
  const getRecommendationStatusName = (statusId) => {
    if (!statusId) return 'Unknown status';
    const found = decisionStatuses?.find((s) => s.status_id === statusId);
    return found?.name || 'Unknown status';
  };

  // Normalize to array
  const recommendations = Array.isArray(recommendation) 
    ? recommendation 
    : recommendation 
      ? [recommendation] 
      : [];

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {/* <RecommendIcon sx={{ color: '#1E516A', fontSize: '24px' }} /> */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#041f36', fontSize: '16px' }}>
            {recommendations.length === 1 ? 'Recommended Decision' : 'Recommended Decisions'}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.12)' }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {recommendations.map((rec, index) => {
            // Handle both direct status object and status_with_agenda_id
            const statusName = rec.status?.name 
              || getRecommendationStatusName(rec.status_with_agenda_id);
            
            const userName = rec.user?.full_name || rec.user?.email || 'Unknown User';

            return (
              <Box
                key={rec.decision_recommendation_id || index}
                sx={{
                  p: 2,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  ...(recommendations.length > 1 && {
                    borderLeft: '3px solid #1E516A'
                  })
                }}
              >
                {recommendations.length > 1 && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 1.5, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}
                  >
                    Recommendation {index + 1} - {userName}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontSize: '13px', fontWeight: 600 }}>
                      Recommended Decision
                    </Typography>
                    <Chip
                      label={statusName}
                      sx={{
                        backgroundColor: '#1E516A',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '14px',
                        py: 2.5
                      }}
                    />
                  </Box>

                  {rec.description && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontSize: '13px', fontWeight: 600 }}>
                        Note
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: 'text.primary',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {rec.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ViewDecisionRecommendationCard;

