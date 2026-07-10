import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function DisciplinaryDetailLeftCard({
  applicant,
  judgeName,
  courtOffice,
  fileNumber,
  currentStatus, // For backward compatibility
  caseStatus, // New: Case status
  customerStatus, // New: Customer/Complaint status
  issues,
  evidencesList,
  onOpenIssues,
  onOpenTextEvidence,
  onOpenDoc,
}) {
  const typographyStyles = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: "1rem",
    color: "#041f36",
  };

  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return "-";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return "#6c757d";
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return "#e67e22";
    if (statusLower === "rejected") return "#e74c3c";
    if (statusLower === "open" || statusLower === "under_investigation") return "#3498db";
    if (statusLower === "accepted" || statusLower === "decided") return "#27ae60";
    if (statusLower === "under_council_review") return "#9b59b6";
    if (statusLower === "closed" || statusLower === "committe decided") return "#6c757d";
    return "#6c757d";
  };

  // Use new props if provided, otherwise fall back to currentStatus for backward compatibility
  // Check if caseStatus was explicitly passed (even if null/undefined)
  const hasCaseStatus = caseStatus !== undefined;
  const hasCustomerStatus = customerStatus !== undefined;
  
  const displayCaseStatus = hasCaseStatus ? (caseStatus || null) : null;
  const displayCustomerStatus = hasCustomerStatus ? (customerStatus || null) : (currentStatus || null);
  
  // Determine if we should show both statuses (when caseStatus prop was provided)
  const showBothStatuses = hasCaseStatus;

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
      <CardContent sx={{ p: 2.0 }}>
        {/* Applicant Information */}
        <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
          Applicant Information
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {[
          ["Name", applicant?.full_name],
          ["Email", applicant?.email],
          ["Phone", applicant?.phone_number],
          ["Gender", applicant?.gender],
          ["Address", applicant?.address],
        ].map(([label, value]) => (
          <Box
            key={label}
            sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, mb: 0.75 }}
          >
            <Typography fontWeight={600} color="text.secondary">
              {label}:
            </Typography>
            <Typography fontWeight={600} color="text.primary">
              {value || "-"}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Complaint Information */}
        <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
          Complaint Information
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {[
          ["Judge Name", judgeName],
          ["Court Office", courtOffice],
          ["File Number", fileNumber],
        ].map(([label, value]) => (
          <Box
            key={label}
            sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, mb: 0.75 }}
          >
            <Typography fontWeight={600} color="text.secondary">
              {label}:
            </Typography>
            <Typography fontWeight={600} color="text.primary">
              {value || "-"}
            </Typography>
          </Box>
        ))}
        {/* Case Status - Show if caseStatus prop was provided */}
        {showBothStatuses && (
          <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, mb: 0.75 }}>
            <Typography fontWeight={600} color="text.secondary">
              Case Status:
            </Typography>
            <Typography
              fontWeight={600}
              sx={{
                color: getStatusColor(displayCaseStatus),
              }}
            >
              {formatStatus(displayCaseStatus)}
            </Typography>
          </Box>
        )}
        {/* Customer Status - Always show (uses customerStatus or falls back to currentStatus) */}
        <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, mb: 1 }}>
          <Typography fontWeight={600} color="text.secondary">
            {showBothStatuses ? "Customer Status:" : "Status:"}
          </Typography>
          <Typography
            fontWeight={600}
            sx={{
              color: getStatusColor(displayCustomerStatus),
            }}
          >
            {formatStatus(displayCustomerStatus)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Complaint Issues */}
        {issues?.length ? (
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<VisibilityIcon />}
            onClick={onOpenIssues}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.25, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            View Complaint Issues
          </Button>
        ) : (
          <Typography color="text.secondary">No issues found</Typography>
        )}

        {/* Evidence Documents (compact) */}
        <Typography variant="h6" sx={{ ...typographyStyles, mt: 2, mb: 1 }} gutterBottom>
          Evidence Documents
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List sx={{ mb: 1 }}>
          {evidencesList?.length ? (
            evidencesList.map((doc) => {
              if (!doc.file_url) return null; // skip text evidence here
              return (
                <ListItem
                  key={doc.evidence_id}
                  button
                  onClick={() => onOpenDoc?.(doc)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: "#f8f9fa",
                    '&:hover': { backgroundColor: "#e9ecef" },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontWeight: 500 }}
                    primary={doc.file_url.replace(/^.*[\\\/]/, '')}
                    secondary={doc.description || "No Description"}
                    sx={{ wordBreak: "break-word" }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                    {doc.file_status === "verified" && (
                      <Tooltip title="Verified" arrow>
                        <CheckCircleIcon sx={{ color: "green" }} />
                      </Tooltip>
                    )}
                    {doc.file_status === "rejected" && (
                      <Tooltip title="Rejected" arrow>
                        <CancelIcon sx={{ color: "red" }} />
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              );
            })
          ) : (
            <Typography color="text.secondary">No evidence found</Typography>
          )}
          {/* Text Evidence - Display like file evidence */}
          {evidencesList?.filter(doc => !doc.file_url).map((doc, index) => (
            <ListItem
              key={doc.evidence_id || `text_${index}`}
              button
              onClick={() => onOpenTextEvidence?.()}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                backgroundColor: "#f8f9fa",
                '&:hover': { backgroundColor: "#e9ecef" },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1,
              }}
            >
              <ListItemText
                primaryTypographyProps={{ fontWeight: 500 }}
                primary="Text Evidence"
                secondary={doc.description ? (doc.description.length > 50 ? doc.description.substring(0, 50) + '...' : doc.description) : "No Description"}
                sx={{ wordBreak: "break-word" }}
              />
              <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                {doc.file_status === "verified" && (
                  <Tooltip title="Verified" arrow>
                    <CheckCircleIcon sx={{ color: "green" }} />
                  </Tooltip>
                )}
                {doc.file_status === "rejected" && (
                  <Tooltip title="Rejected" arrow>
                    <CancelIcon sx={{ color: "red" }} />
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
