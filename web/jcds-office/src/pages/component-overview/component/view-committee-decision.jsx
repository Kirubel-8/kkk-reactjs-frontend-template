import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function ViewCommitteeDecision({
  committeeReview,
  attachments = [],
  expertAttachments = [],
  onOpenCaseAttachment,
  onOpenCaseTextAttachment,
  onOpenExpertAttachment,
  typographyStyles = { fontFamily: 'Inter, Arial, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#041f36' },
  canViewCommitteeDecisions = false
}) {
  // Check if user has permission to view committee decisions
  if (!canViewCommitteeDecisions) {
    return null;
  }

  if (!committeeReview) {
    return null;
  }

  // Filter committee head files from case attachments
  const committeeHeadFileAttachments = attachments.filter(
    (att) => att.description?.includes('[COMMITTEE_HEAD]') && (att.file_path || att.preview_url)
  );
  const committeeHeadTextAttachments = attachments.filter(
    (att) => att.description?.includes('[COMMITTEE_HEAD]') &&
             att.description &&
             att.description !== null &&
             att.description !== '' &&
             !att.file_path &&
             !att.preview_url
  );

  // Filter committee head expert attachments
  const committeeHeadExpertAttachments = expertAttachments.filter(
    (att) => att.description?.includes('[COMMITTEE_HEAD]')
  );

  const hasFiles = 
    committeeHeadFileAttachments.length > 0 ||
    committeeHeadTextAttachments.length > 0 ||
    committeeHeadExpertAttachments.length > 0;

  return (
    <>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
        Committee Review
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <Paper
        sx={{
          p: 2,
          mb: 1,
          backgroundColor: "#f8f9fa",
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}
      >
        {/* Show Agenda Type from statusAgenda */}
        {committeeReview.statusAgenda?.agenda && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
              Agenda Type
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {committeeReview.statusAgenda.agenda.name || 'N/A'}
            </Typography>
            {committeeReview.statusAgenda.agenda.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {committeeReview.statusAgenda.agenda.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Show Decision Status from statusAgenda */}
        {committeeReview.statusAgenda && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
              Decision Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {committeeReview.statusAgenda.name || 'N/A'}
              </Typography>
              {committeeReview.updated_once && (
                <Chip 
                  label="Final" 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              )}
            </Box>
            {committeeReview.statusAgenda.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {committeeReview.statusAgenda.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Show interim_decision_id if statusAgenda not available */}
        {!committeeReview.statusAgenda && committeeReview.interim_decision_id && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
              Decision ID
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {committeeReview.interim_decision_id}
            </Typography>
          </Box>
        )}

        {committeeReview.comment && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
              Comment
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {committeeReview.comment}
            </Typography>
          </Box>
        )}

        {(committeeReview.reviewed_at || committeeReview.created_at) && (
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Submitted on: {new Date(committeeReview.reviewed_at || committeeReview.created_at).toLocaleString()}
            </Typography>
          </Box>
        )}

        {/* Committee files shown under the review */}
        {hasFiles && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Files
            </Typography>
            <List sx={{ mb: 1 }}>
              {/* Committee Head File Attachments */}
              {committeeHeadFileAttachments.map((att) => (
                <ListItem
                  key={att.id || att.case_attachment_id}
                  button
                  onClick={() => onOpenCaseAttachment?.(att)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: "#e3f2fd",
                    '&:hover': { backgroundColor: "#bbdefb" },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 500 }}
                    primary={att.filename || att.file_name || "Committee File"}
                    sx={{ wordBreak: "break-word" }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <AttachFileIcon sx={{ color: "#1565c0", mr: 1 }} />
                    {att.file_status === "approved" && (
                      <Tooltip title="Approved" arrow>
                        <CheckCircleIcon sx={{ color: "green" }} />
                      </Tooltip>
                    )}
                    {att.file_status === "rejected" && (
                      <Tooltip title="Rejected" arrow>
                        <CancelIcon sx={{ color: "red" }} />
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}

              {/* Committee Head Text Attachments */}
              {committeeHeadTextAttachments.map((att, index) => (
                <ListItem
                  key={att.id || att.case_attachment_id || `committee_head_text_${index}`}
                  button
                  onClick={() => onOpenCaseTextAttachment?.(att)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: "#e3f2fd",
                    '&:hover': { backgroundColor: "#bbdefb" },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 500 }}
                    primary="Committee Text Attachment"
                    secondary={
                      att.description?.replace('[COMMITTEE_HEAD]', '').trim()
                        ? att.description.replace('[COMMITTEE_HEAD]', '').trim().length > 50
                          ? att.description.replace('[COMMITTEE_HEAD]', '').trim().substring(0, 50) + "..."
                          : att.description.replace('[COMMITTEE_HEAD]', '').trim()
                        : "No Description"
                    }
                    sx={{ wordBreak: "break-word" }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    {att.file_status === "approved" && (
                      <Tooltip title="Approved" arrow>
                        <CheckCircleIcon sx={{ color: "green" }} />
                      </Tooltip>
                    )}
                    {att.file_status === "rejected" && (
                      <Tooltip title="Rejected" arrow>
                        <CancelIcon sx={{ color: "red" }} />
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              ))}

              {/* Committee Head Expert Attachments */}
              {committeeHeadExpertAttachments.map((att) => (
                <ListItem
                  key={att.id || att.expert_attachment_id}
                  button
                  onClick={() => onOpenExpertAttachment?.(att)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: "#e3f2fd",
                    '&:hover': { backgroundColor: "#bbdefb" },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 500 }}
                    primary={att.filename || att.document_name || "Committee File"}
                    sx={{ wordBreak: "break-word" }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    <AttachFileIcon sx={{ color: "#1565c0", mr: 1 }} />
                    {att.file_status === "approved" || att.document_status === "approved" ? (
                      <Tooltip title="Approved" arrow>
                        <CheckCircleIcon sx={{ color: "green" }} />
                      </Tooltip>
                    ) : null}
                    {att.file_status === "rejected" || att.document_status === "rejected" ? (
                      <Tooltip title="Rejected" arrow>
                        <CancelIcon sx={{ color: "red" }} />
                      </Tooltip>
                    ) : null}
                  </Box>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </>
  );
}

