import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack, CheckCircle, Pending, Person, Description, Download, Visibility, Edit, Save } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import finalDecisionService from '../../../service/finalDecisionService.service';
import { useTheme } from '@mui/material/styles';
import { getStatusMeta } from '../../../utils/statusColors';

export default function CouncilReviewDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { case_id, userRole } = location.state || {};
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [decisionOptions, setDecisionOptions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [decisionDescription, setDecisionDescription] = useState('');
  const [currentUserAssignment, setCurrentUserAssignment] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [finalDecision, setFinalDecision] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Add permission states
  const [canSubmitDecision, setCanSubmitDecision] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isCaseAssignedToUser, setIsCaseAssignedToUser] = useState(false);
  const [hasAccess, setHasAccess] = useState(true); // Default to true, will be checked
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  useEffect(() => {
    // Get current user ID and permissions from localStorage
    const getUserFromStorage = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          console.log('Current user from storage:', user);

          // Extract permissions
          const permissions = extractUserPermissions(user);
          setUserPermissions(permissions);

          // Check for submit_decision permission
          const hasSubmitDecisionPermission = permissions.some(
            (perm) => perm.resource === 'CommitteeDecided' && perm.action === 'submit_decision'
          );

          setCanSubmitDecision(hasSubmitDecisionPermission);
          setCurrentUserId(user?.user_id || user?.id);

          console.log('User permissions check:', {
            userId: user?.user_id || user?.id,
            hasSubmitDecisionPermission,
            totalPermissions: permissions.length,
            permissions: permissions.map((p) => `${p.resource}.${p.action}`)
          });

          return {
            userId: user?.user_id || user?.id,
            hasSubmitDecisionPermission
          };
        }
      } catch (error) {
        console.error('Error getting user from storage:', error);
      }
      return null;
    };

    const userInfo = getUserFromStorage();

    if (!userInfo?.userId) {
      showSnackbar('Please login to access this page', 'error');
      navigate('/login');
      return;
    }

    if (!userInfo.hasSubmitDecisionPermission) {
      showSnackbar('You do not have permission to submit decisions', 'error');
      navigate(-1);
      return;
    }

    if (case_id) {
      fetchCaseDetails(userInfo.userId);
      fetchDecisionOptions();
      fetchStatistics();
      fetchFinalDecision();
    } else {
      showSnackbar('Case ID is missing', 'error');
      navigate(-1);
    }
  }, [case_id]);
  const extractUserPermissions = (user) => {
    let permissions = [];

    if (user.permissions && Array.isArray(user.permissions)) {
      permissions = user.permissions;
    } else if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          permissions = [...permissions, ...role.permissions];
        }
      });
    }

    return permissions;
  };
  const fetchCaseDetails = async (userId) => {
    try {
      console.log('Fetching case details for case:', case_id, 'user:', userId);
      const response = await finalDecisionService.getCaseDetails(case_id);
      console.log('Case details response:', response);

      if (response.success) {
        const caseDetails = response.data;
        setCaseData(caseDetails);

        // Find current user's assignment from case data
        if (userId && caseDetails.case_decision_votes) {
          const userAssignment = caseDetails.case_decision_votes.find((vote) => vote.council_user_id === userId);

          console.log('User assignment found:', userAssignment);

          if (userAssignment) {
            setIsCaseAssignedToUser(true);
            setCurrentUserAssignment(userAssignment);
            setHasAccess(true); // User is assigned, they can access

            // If user has voted, pre-fill the decision
            if (userAssignment.is_voted && userAssignment.status_id) {
              setSelectedDecision(userAssignment.status_id);
              setDecisionDescription(userAssignment.description || '');
            }
          } else {
            // User is not assigned to this case
            setIsCaseAssignedToUser(false);
            setHasAccess(false);

            // Show warning but still allow viewing (read-only mode)
            console.warn('User is not assigned to this case');
          }
        } else {
          // No votes found or no user ID
          setIsCaseAssignedToUser(false);
          setHasAccess(false);
        }
      } else {
        showSnackbar('Failed to load case details', 'error');
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      showSnackbar('Error loading case details', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Helper function to check any permission
  const checkPermission = (resource, action) => {
    return userPermissions.some((perm) => perm.resource === resource && perm.action === action);
  };

  // Usage examples:
  const canViewDecisions = checkPermission('CommitteeDecided', 'view_decisions');
  const canViewStatistics = checkPermission('CommitteeDecided', 'view_statistics');
  const canAssignMembers = checkPermission('CommitteeDecided', 'assign_members');
  const fetchDecisionOptions = async () => {
    try {
      const response = await finalDecisionService.getDecisionOptions();
      console.log('Decision options response:', response);

      // API returns: { options: [...] }
      if (response.options && Array.isArray(response.options)) {
        const options = response.options.map((option) => ({
          status_id: option.status_id,
          name: option.name,
          description: option.description
        }));

        console.log('Processed decision options:', options);
        setDecisionOptions(options);
        return;
      }

      // fallback
      console.log('No options found, using fallback logic...');
      if (caseData?.case_decision_votes) {
        const uniqueStatuses = caseData.case_decision_votes
          .filter((v) => v.status_id && v.decisionStatus)
          .map((v) => ({
            status_id: v.status_id,
            name: v.decisionStatus.name,
            description: v.decisionStatus.description
          }));

        const uniqueOptions = Array.from(new Map(uniqueStatuses.map((i) => [i.status_id, i])).values());
        setDecisionOptions(uniqueOptions);
      }
    } catch (error) {
      console.error('Error fetching decision options:', error);
    }
  };
  const getFileType = (file) => {
    const name = file?.name || '';
    const url = file?.url || '';

    const source = name.includes('.') ? name : url;
    const ext = source.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';

    return 'other';
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const fetchStatistics = async () => {
    try {
      const response = await finalDecisionService.getDecisionStatistics(case_id);
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchFinalDecision = async () => {
    try {
      const response = await finalDecisionService.getFinalDecision(case_id);
      console.log('here final decision fetched', response.finalDecision);
      if (response.finalDecision) {
        setFinalDecision(response.finalDecision);
        console.log('this also checking final decision under rseponse', response.finalDecision);
      }
    } catch (error) {
      console.error('Error fetching final decision:', error);
    }
  };

  const handleSubmitDecision = async () => {
    // Double-check permission and assignment
    if (!canSubmitDecision) {
      showSnackbar('You do not have permission to submit decisions', 'error');
      return;
    }

    if (!isCaseAssignedToUser) {
      showSnackbar('You are not assigned to this case', 'error');
      return;
    }

    if (!selectedDecision) {
      showSnackbar('Please select a decision', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const decisionData = {
        case_id,
        status_id: selectedDecision,
        description: decisionDescription
      };

      console.log('Submitting decision:', decisionData);
      const response = await finalDecisionService.submitCouncilDecision(decisionData);
      console.log('Decision submission response:', response);

      if (response.success) {
        showSnackbar('Decision submitted successfully', 'success');

        // Refresh all data
        fetchCaseDetails(currentUserId);
        fetchStatistics();
        fetchFinalDecision();

        // Check if final decision was calculated
        if (response.data?.finalDecision?.message?.includes('Final decision has been calculated')) {
          showSnackbar('Final decision has been calculated for this case', 'success');
        }
      } else {
        showSnackbar(response.error || 'Failed to submit decision', 'error');
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
      showSnackbar(error.response?.data?.error || 'Error submitting decision', 'error');
    } finally {
      setSubmitting(false);
      setConfirmModalOpen(false);
    }
  };

  const handleOpenConfirmModal = () => {
    if (!selectedDecision) {
      showSnackbar('Please select a decision', 'warning');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
  };

  const handleEditDecision = () => {
    // Reset to allow editing (if allowed by business rules)
    setSelectedDecision('');
    setDecisionDescription('');
    showSnackbar('You can now edit your decision', 'info');
  };

  const getDecisionColor = (decisionName) => {
    if (!decisionName) return 'default';
    const lower = decisionName.toLowerCase();
    if (lower.includes('approve') || lower.includes('accept') || lower.includes('council')) return 'success';
    if (lower.includes('reject') || lower.includes('dismiss')) return 'error';
    if (lower.includes('refer') || lower.includes('return') || lower.includes('back to committe')) return 'warning';
    return 'primary';
  };

  const getStatusColor = (status) => {
    const meta = getStatusMeta(theme, status);
    return meta.color || '#757575';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load case data</Alert>
      </Box>
    );
  }

  // Check if user has access (has submit_decision permission AND is assigned to case)
  const userHasAccess = canSubmitDecision && isCaseAssignedToUser;
  const canViewOnly = canSubmitDecision && !isCaseAssignedToUser;

  if (!hasAccess && !userHasAccess && !canViewOnly) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You do not have access to this case. You need:
          <ul>
            <li>CommitteeDecided.submit_decision permission</li>
            <li>To be assigned to this case as a council member</li>
          </ul>
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // Determine user's status
  const isAssigned = !!currentUserAssignment;
  const hasVoted = currentUserAssignment?.is_voted || false;
  const canVote = isAssigned && !hasVoted && !finalDecision;
  const isCaseDecided = caseData?.status === 'council_decided' || finalDecision;

  console.log('User status:', { isAssigned, hasVoted, canVote, isCaseDecided });
  console.log('Current user assignment:', currentUserAssignment);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#2E3180">
            Case Review: {caseData.case_number}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Council Decision Panel
          </Typography>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* User Role Badge */}
          {canSubmitDecision && <Chip label="Council Member" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />}

          {/* Assignment Status Badge */}
          {isCaseAssignedToUser ? (
            <Chip label="Assigned to You" color="success" variant="outlined" icon={<CheckCircle />} />
          ) : (
            <Chip label="Not Assigned" color="default" variant="outlined" icon={<Pending />} />
          )}

          {/* Case Status */}
          <Chip
            label={caseData.status}
            sx={{
              backgroundColor: getStatusColor(caseData.status),
              color: 'white',
              fontWeight: 'bold'
            }}
          />

          {finalDecision && (
            <Chip label={`Final: ${finalDecision.status?.name}`} color={getDecisionColor(finalDecision.status?.name)} variant="outlined" />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Case Information */}
        <Grid item xs={12} md={8}>
          {/* Case Summary Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="#2E3180">
                Case Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Judge Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.disciplinary_complaint?.judge_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Court Office
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.disciplinary_complaint?.court_office || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    File Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.disciplinary_complaint?.file_number || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Applicant
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.disciplinary_complaint?.applicant?.full_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Case Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.caseType?.name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Committee Priority
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {caseData.committee_priority || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Voting Status Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="#2E3180">
                Voting Status
              </Typography>

              {caseData.case_decision_votes && (
                <>
                  {/* Progress Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Voting Progress: {caseData.case_decision_votes.filter((v) => v.is_voted).length} of{' '}
                        {caseData.case_decision_votes.length} voted
                      </Typography>
                      <Typography variant="body2">
                        {(
                          (caseData.case_decision_votes.filter((v) => v.is_voted).length / caseData.case_decision_votes.length) *
                          100
                        ).toFixed(1)}
                        %
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 10,
                        backgroundColor: '#e0e0e0',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(caseData.case_decision_votes.filter((v) => v.is_voted).length / caseData.case_decision_votes.length) * 100}%`,
                          height: '100%',
                          backgroundColor:
                            caseData.case_decision_votes.filter((v) => v.is_voted).length === caseData.case_decision_votes.length
                              ? '#4caf50'
                              : '#2196f3',
                          transition: 'width 0.5s ease'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Decision Breakdown */}
                  {caseData.case_decision_votes.filter((v) => v.is_voted).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                        Decision Breakdown
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {Object.entries(
                          caseData.case_decision_votes
                            .filter((v) => v.is_voted && v.decisionStatus)
                            .reduce((acc, vote) => {
                              const decisionName = vote.decisionStatus.name;
                              acc[decisionName] = (acc[decisionName] || 0) + 1;
                              return acc;
                            }, {})
                        ).map(([decision, count]) => (
                          <Chip key={decision} label={`${decision}: ${count}`} color={getDecisionColor(decision)} variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments Card */}
          {(caseData.attachments?.length > 0 || caseData.expert_attachments?.length > 0) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2E3180">
                  Case Documents
                </Typography>

                {caseData.attachments?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Case Attachments
                    </Typography>
                    {caseData.attachments.map((attachment) => (
                      <Box
                        key={attachment.case_attachment_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <Description sx={{ mr: 2, color: 'primary.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">{attachment.file_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {attachment.file_status}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() =>
                            handlePreview({
                              name: attachment.file_name,
                              url: attachment.file_url
                            })
                          }
                        >
                          View
                        </Button>

                        <Button size="small" startIcon={<Download />} component="a" href={attachment.file_url} target="_blank" download>
                          Download
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}

                {caseData.expert_attachments?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Expert Investigation Reports
                    </Typography>
                    {caseData.expert_attachments.map((attachment) => (
                      <Box
                        key={attachment.expert_attachment_id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <Description sx={{ mr: 2, color: 'success.main' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">{attachment.document_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {attachment.document_status}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() =>
                            handlePreview({
                              name: attachment.document_name,
                              url: attachment.document_url
                            })
                          }
                        >
                          View
                        </Button>

                        <Button size="small" startIcon={<Download />} component="a" href={attachment.file_url} target="_blank" download>
                          Download
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Decision Panel */}
        <Grid item xs={12} md={4}>
          {/* Decision Card */}
          {/* Decision Card */}
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="#2E3180">
                Your Decision
              </Typography>

              {/* Permission & Assignment Status */}
              {!canSubmitDecision ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    You do not have permission to submit decisions. Required: <strong>CommitteeDecided.submit_decision</strong>
                  </Typography>
                </Alert>
              ) : !isCaseAssignedToUser ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    You are not assigned to vote on this case. Only assigned council members can submit decisions.
                  </Typography>
                </Alert>
              ) : hasVoted ? (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  action={
                    !isCaseDecided && (
                      <Tooltip title="Edit your decision">
                        <Button color="inherit" size="small" onClick={handleEditDecision} startIcon={<Edit />}>
                          Edit
                        </Button>
                      </Tooltip>
                    )
                  }
                >
                  <Typography variant="body2">
                    You voted: <strong>{currentUserAssignment.decisionStatus?.name || 'Unknown'}</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    Submitted on: {currentUserAssignment.vote_at ? new Date(currentUserAssignment.vote_at).toLocaleString() : 'Unknown'}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">You are assigned to vote on this case. Please submit your decision.</Typography>
                </Alert>
              )}

              {/* Decision Input Section - Only show if user has permission AND is assigned */}
              {!isCaseDecided && isCaseAssignedToUser && canSubmitDecision && (
                <>
                  {/* Decision Selection */}
                  <TextField
                    select
                    label="Select Decision"
                    value={selectedDecision}
                    onChange={(e) => setSelectedDecision(e.target.value)}
                    fullWidth
                    disabled={hasVoted || !canVote}
                    sx={{ mb: 2 }}
                    helperText={hasVoted ? 'You have already voted' : !canVote ? 'Cannot vote at this time' : ''}
                  >
                    {decisionOptions.length === 0 ? (
                      <MenuItem value="" disabled>
                        <Typography color="text.secondary">Loading decision options...</Typography>
                      </MenuItem>
                    ) : (
                      decisionOptions.map((option) => (
                        <MenuItem key={option.status_id} value={option.status_id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={option.name} size="small" color={getDecisionColor(option.name)} variant="outlined" />
                            <Typography variant="body2" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </TextField>

                  {/* Description */}
                  <TextField
                    label="Comments (Optional)"
                    multiline
                    rows={3}
                    value={decisionDescription}
                    onChange={(e) => setDecisionDescription(e.target.value)}
                    fullWidth
                    disabled={hasVoted || !canVote}
                    sx={{ mb: 2 }}
                    placeholder="Add any comments or notes about your decision..."
                  />

                  {/* Submit Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleOpenConfirmModal}
                    disabled={hasVoted || !canVote || !selectedDecision || submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                    sx={{
                      backgroundColor: hasVoted ? '#4caf50' : '#2E3180',
                      '&:hover': {
                        backgroundColor: hasVoted ? '#388e3c' : '#1A1C60'
                      }
                    }}
                  >
                    {submitting ? 'Submitting...' : hasVoted ? 'Decision Submitted' : 'Submit Decision'}
                  </Button>
                </>
              )}

              {/* Read-only view for users with permission but not assigned */}
              {canSubmitDecision && !isCaseAssignedToUser && (
                <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    <Visibility sx={{ verticalAlign: 'middle', mr: 1 }} />
                    View Only Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    You have submit_decision permission but are not assigned to this case
                  </Typography>
                </Box>
              )}

              {isCaseDecided && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This case has been decided. No further votes can be submitted.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Assigned Members Card */}
          {caseData.case_decision_votes?.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2E3180">
                  Assigned Council Members ({caseData.case_decision_votes.length})
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Decision</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {caseData.case_decision_votes.map((vote) => {
                        const isCurrentUser = vote.council_user_id === currentUserId;
                        return (
                          <TableRow
                            key={vote.case_decision_vote_id}
                            sx={{
                              backgroundColor: isCurrentUser ? 'rgba(46, 49, 128, 0.08)' : 'inherit',
                              '&:hover': {
                                backgroundColor: isCurrentUser ? 'rgba(46, 49, 128, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: isCurrentUser ? '#2E3180' : 'primary.main',
                                    border: isCurrentUser ? '2px solid #2E3180' : 'none'
                                  }}
                                >
                                  {vote.councilMember?.full_name?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">
                                    {vote.councilMember?.full_name}
                                    {isCurrentUser && (
                                      <Chip
                                        label="You"
                                        size="small"
                                        sx={{
                                          ml: 1,
                                          height: 20,
                                          fontSize: '0.65rem',
                                          backgroundColor: '#2E3180',
                                          color: 'white'
                                        }}
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {vote.councilMember?.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {vote.is_voted ? (
                                <Chip icon={<CheckCircle />} label="Voted" size="small" color="success" variant="outlined" />
                              ) : (
                                <Chip icon={<Pending />} label="Pending" size="small" color="warning" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {vote.is_voted ? (
                                <Chip
                                  label={vote.decisionStatus?.name || 'N/A'}
                                  size="small"
                                  color={getDecisionColor(vote.decisionStatus?.name)}
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Awaiting
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Final Decision Card */}
          {finalDecision && (
            <Card sx={{ mt: 3, border: 1, borderColor: 'success.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="success.main">
                  Final Decision
                </Typography>

                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Chip
                    label={finalDecision.status?.name}
                    color={getDecisionColor(finalDecision.status?.name)}
                    size="large"
                    sx={{ fontSize: '1.1rem', p: 2, mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Decision finalized on: {new Date(finalDecision.created_at).toLocaleDateString()}
                  </Typography>

                  {finalDecision.decision_document && (
                    <Button variant="outlined" startIcon={<Download />} sx={{ mt: 1 }}>
                      Download Decision Document
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onClose={handleCloseConfirmModal}>
        <DialogTitle>Confirm Your Decision</DialogTitle>
        <DialogContent>
          {selectedDecision && (
            <>
              <Typography variant="body1" gutterBottom>
                You are about to submit the following decision:
              </Typography>

              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  textAlign: 'center',
                  my: 2
                }}
              >
                <Chip
                  label={decisionOptions.find((opt) => opt.status_id === selectedDecision)?.name}
                  color={getDecisionColor(decisionOptions.find((opt) => opt.status_id === selectedDecision)?.name)}
                  size="large"
                  sx={{ fontSize: '1.2rem', p: 1 }}
                />

                {decisionDescription && (
                  <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                    "{decisionDescription}"
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                Once submitted, you cannot change your decision without approval.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmModal} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmitDecision} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{previewFile?.name}</DialogTitle>

        <DialogContent dividers>
          {previewFile &&
            (() => {
              const type = getFileType(previewFile);

              if (type === 'image') {
                return (
                  <Box textAlign="center">
                    <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '70vh' }}/>
                  </Box>
                );
              }

              if (type === 'pdf') {
                return <iframe src={previewFile.url} title="PDF Preview" width="100%" height="600px" style={{ border: 'none' }} />;
              }

              return (
                <Alert severity="info">
                  Preview not supported for this file type.
                  <Box mt={2}>
                    <Button variant="contained" href={previewFile.url} target="_blank" startIcon={<Download />}>
                      Download File
                    </Button>
                  </Box>
                </Alert>
              );
            })()}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
