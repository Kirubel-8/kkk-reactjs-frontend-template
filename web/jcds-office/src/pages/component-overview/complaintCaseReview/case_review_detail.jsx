import { useLocation } from 'react-router-dom';
import caseReviewService from '../../../service/caseReview.service';
import compliantRequestService from '../../../service/compliantRequest.service';
import { useState, useEffect, useCallback, useRef } from 'react';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import WitnessSection from '../components/sections/WitnessSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import ComplaintContentCard, { DecisionStatusSection } from '../components/ComplaintContentCard';
import InvestigationFilesCard from '../components/InvestigationFilesCard';
import FeedbackSection from '../components/sections/FeedbackSection';
import { hasValue } from '../components/utils/caseInfoHelpers';
import { FaLessThan } from 'react-icons/fa';
import {
  Alert,
  Snackbar,
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import UndoIcon from '@mui/icons-material/Undo';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CommonModal from '../components/CommonModal';
import { InvestigationDocumentModal } from '../components/modals/InvestigationDocumentModal';
import { useTheme } from '@mui/material/styles';
import { getStatusColor } from '../../../utils/statusColors';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ChevronLeftOutlined } from '@mui/icons-material';

// Copy/Reuse the hasPermission util from ProtectedRoute
const hasPermission = (permissions, requiredPermission) => {
  const permissionList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return permissionList.some(({ resource, action }) =>
    permissions.some((permission) => permission.resource === resource && permission.action === action)
  );
};

const CaseReviewDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectComment, setRejectComment] = useState('');
  const [investigationNote, setInvestigationNote] = useState('');
  const [investigationFiles, setInvestigationFiles] = useState([]);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openComplaintDetailsModal, setOpenComplaintDetailsModal] = useState(false);
  const [openDoc, setOpenDoc] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [justApproved, setJustApproved] = useState(false);
  const [decisionStatuses, setDecisionStatuses] = useState([]);

  const [expandedPanel, setExpandedPanel] = useState('detailed_description');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const id = location.state?.complaintId;

  // Check user permissions
  const permissions = (() => {
    try {
      const p = localStorage.getItem('permissions');
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  })();

  const canApprove = hasPermission(permissions, { resource: 'caseReview', action: 'approve' });
  const canReject = hasPermission(permissions, { resource: 'caseReview', action: 'reject' });
  const canManageInvestigation = hasPermission(permissions, { resource: 'complaintCase', action: 'recommendDecision' });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getErrorMessage = (error, defaultMessage) => {
    if (!error) return defaultMessage;

    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('network') || msg.includes('timeout')) {
        return 'Connection error. Please check your internet connection and try again.';
      }
      if (msg.includes('401') || msg.includes('unauthorized')) {
        return 'Your session has expired. Please log in again.';
      }
      if (msg.includes('403') || msg.includes('forbidden')) {
        return 'You do not have permission to perform this action.';
      }
      if (msg.includes('404') || msg.includes('not found')) {
        return 'The requested item could not be found.';
      }
      if (msg.includes('500') || msg.includes('server error')) {
        return 'A server error occurred. Please try again later.';
      }
      return error.message.length < 100 ? error.message : defaultMessage;
    }

    return defaultMessage;
  };

  const fetchData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await caseReviewService.getComplaintForReviewById(id);
      setData(response);
      console.log({ response });
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to load case details. Please refresh the page.'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDecisionStatuses = useCallback(async () => {
    try {
      const fetchedStatuses = await caseReviewService.getDecisionStatuses();
      if (Array.isArray(fetchedStatuses)) {
        setDecisionStatuses(fetchedStatuses);
      } else if (fetchedStatuses && typeof fetchedStatuses === 'object') {
        setDecisionStatuses(fetchedStatuses.data || fetchedStatuses.statuses || fetchedStatuses.result || []);
      }
    } catch (error) {
      console.warn('Could not fetch decision statuses:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDecisionStatuses();
  }, [fetchData, fetchDecisionStatuses]);

  const handleApprove = async () => {
    try {
      setLoading(true);
      await caseReviewService.approveComplaintForCaseReview(id);
      setSnackbar({
        open: true,
        message: 'Complaint approved successfully',
        severity: 'success'
      });
      setJustApproved(true);
      await fetchData(); // Refresh data to show new status
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Unable to approve complaint.');
      setSnackbar({
        open: true,
        message:
          errorMsg.includes('attachment') || errorMsg.includes('investigation')
            ? errorMsg
            : 'Unable to approve complaint. Please ensure at least one investigation attachment has been uploaded.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectComment.trim()) {
      try {
        setLoading(true);
        await caseReviewService.rejectComplaintForCaseReview(id, rejectComment);
        setSnackbar({
          open: true,
          message: 'Complaint returned successfully',
          severity: 'success'
        });
        await fetchData();
      } catch (error) {
        setSnackbar({
          open: true,
          message: getErrorMessage(error, 'Unable to return complaint. Please try again.'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColorValue = (status, caseStatus) => {
    return getStatusColor(theme, status, caseStatus);
  };

  const getStatusLabel = (status, caseStatus) => {
    const normalizedCaseStatus = (caseStatus || '').toLowerCase();
    
    if (normalizedCaseStatus === 'returned_to_office') {
      return 'Returned';
    }

    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'under_investigation':
        return 'Under Investigation';
      case 'accepted':
        return 'Accepted';
      case 'under_council_review':
        return 'Under Review';
      case 'decided':
        return 'Closed';
      case 'rejected':
        return 'Rejected';
      case 'returned':
        return 'Returned';
      default: {
        const pretty = normalized.replace(/_/g, ' ');
        return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : 'Pending';
      }
    }
  };

  const getLatestRecommendation = (items) => {
    const list = Array.isArray(items) ? items : items ? [items] : [];
    if (list.length === 0) return null;
    const sorted = [...list].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
    return sorted[0];
  };

  const buildFeedbackEntries = (complaint) => {
    if (!complaint) return [];
    const asArray = (value) => {
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    };

    const deriveSource = () => {
      const caseStatus = (complaint?.case?.status || '').toLowerCase();
      const status = (complaint?.status || '').toLowerCase();
      if (caseStatus === 'returned_to_office') return 'Council Head';
      if (status === 'rejected' || status === 'returned') return 'Investigation Team';
      return 'System';
    };

    const deriveTitle = () => {
      const caseStatus = (complaint?.case?.status || '').toLowerCase();
      const status = (complaint?.status || '').toLowerCase();
      if (caseStatus === 'returned_to_office') return 'Returned to Office';
      if (status === 'rejected') return 'Rejected';
      if (status === 'returned') return 'Returned';
      return 'Feedback';
    };

    const feedbackItems = asArray(complaint?.complaintRejection || complaint?.complaint_rejection);

    return feedbackItems
      .map((item, idx) => ({
        id: item?.complaint_rejection_id || `feedback-${idx}`,
        title: deriveTitle(),
        message: item?.comment || '',
        date: item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at || null,
        source: deriveSource()
      }))
      .filter((entry) => entry.message || entry.date);
  };

  const handleOpenRejectModal = () => {
    setOpenRejectModal(true);
  };
  const handleCloseRejectModal = () => {
    setOpenRejectModal(false);
    setRejectComment('');
  };
  const handleOpenComplaintDetails = () => setOpenComplaintDetailsModal(true);
  const handleCloseComplaintDetails = () => setOpenComplaintDetailsModal(false);

  const handleOpenDoc = (doc) => setOpenDoc(doc);
  const handleCloseDoc = () => {
    if (openDoc?.file_path && openDoc.file_path.startsWith('blob:')) {
      URL.revokeObjectURL(openDoc.file_path);
    }
    setOpenDoc(null);
  };

  const handleBack = () => {
    navigate('/case_review');
  };

  const handleInvestigationFileChange = (event) => {
    if (!canManageInvestigation) return;
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;
    setInvestigationFiles((prev) => [...prev, ...selected]);
    event.target.value = '';
  };

  const handleRemoveInvestigationFile = (index) => {
    if (!canManageInvestigation) return;
    setInvestigationFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearInvestigationFiles = () => {
    if (!canManageInvestigation) return;
    setInvestigationFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveInvestigationNote = async () => {
    if (!canManageInvestigation || !canEditInvestigation) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to upload investigation files.',
        severity: 'error'
      });
      return;
    }
    const trimmedNote = investigationNote.trim();
    if (investigationFiles.length === 0) {
      setSnackbar({
        open: true,
        message:
          trimmedNote.length > 0 ? 'Please upload a file when adding an investigation note.' : 'Please select at least one file to upload.',
        severity: 'warning'
      });
      return;
    }

    const formData = new FormData();
    formData.append('complaint_id', id);
    formData.append('note', trimmedNote);
    investigationFiles.forEach((file) => formData.append('investigation_file', file));

    setInvestigationLoading(true);
    try {
      const response = await compliantRequestService.uploadNoteAndFile(formData);
      setSnackbar({
        open: true,
        message: response.message || 'Investigation note saved successfully',
        severity: 'success'
      });
      setInvestigationNote('');
      handleClearInvestigationFiles();
      await fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to save investigation note. Please check the file and try again.'),
        severity: 'error'
      });
    } finally {
      setInvestigationLoading(false);
    }
  };

  const handleViewInvestigationFile = (fileOrAttachment) => {
    if (!fileOrAttachment) return;
    if (fileOrAttachment instanceof File) {
      const objectUrl = URL.createObjectURL(fileOrAttachment);
      handleOpenDoc({ file_path: objectUrl, description: fileOrAttachment.name });
      return;
    }
    handleOpenDoc(fileOrAttachment);
  };

  const getRecommendationStatusName = (statusId) => {
    const found = decisionStatuses?.find((status) => status.status_id === statusId);
    return found?.name || 'Unknown status';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Typography align="center" mt={5}>
        Data not found
      </Typography>
    );
  }

  // Extract data
  const complaintData = data;
  const witnesses = complaintData?.witnesses;
  const evidences = complaintData?.evidences || [];
  const attachments = complaintData?.case?.attachments || [];
  const investigationAttachments = attachments;
  const recommendationList = complaintData?.case?.decisionRecommendations || null;
  const latestRecommendation = getLatestRecommendation(recommendationList);
  const feedbackEntries = buildFeedbackEntries(complaintData);

  const complaintMeta = {
    case_type: data?.case_type,
    complaint_id: data?.complaint_id,
    judge_name: data?.judge_name,
    case_file_number: data?.case_file_number,
    act_date: data?.act_date
  };

  const isUnderInvestigation = (complaintData?.status || '').toLowerCase() === 'under_investigation';
  // Case review view is read-only for investigation artifacts, regardless of permissions.
  const canEditInvestigation = false;

  const statusLabel = getStatusLabel(complaintData?.status, complaintData?.case?.status);
  const statusColor = getStatusColorValue(complaintData?.status, complaintData?.case?.status);
  const showHeaderActions = complaintData?.status === 'accepted' && (canApprove || canReject);

  const evidenceAttachments = evidences.map((ev, idx) => ({
    name: `Evidence ${idx + 1} (${ev.file_type?.split('/')[1] || 'doc'})`,
    size: ev.file_size ? `${(ev.file_size / 1024).toFixed(1)} KB` : 'Unknown',
    file_path: ev.file_path,
    ...ev
  }));

  // Field computation logic
  const judgeFields = (() => {
    const fields = [];
    if (hasValue(complaintMeta?.complaint_id)) {
      const complaintId = complaintMeta.complaint_id?.substring(0, 8).toUpperCase();
      fields.push({ label: 'Report ID', value: complaintId, color: theme.palette.primary.main });
    }
    if (hasValue(complaintMeta?.judge_name)) {
      fields.push({ label: 'Judge Name', value: complaintMeta.judge_name });
    }
    if (hasValue(complaintData?.judge_court)) {
      fields.push({ label: 'Court Office', value: complaintData.judge_court });
    }
    if (hasValue(complaintMeta?.case_file_number)) {
      fields.push({ label: 'Case File Number', value: complaintMeta.case_file_number });
    }
    if (hasValue(complaintMeta?.case_type)) {
      fields.push({ label: 'Case Type', value: complaintMeta.case_type });
    }
    // add any other fields for judge information section here.
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = [
    { title: 'Detailed Description', content: complaintData?.detailed_description },
    { title: 'Damage Description', content: complaintData?.damage_description },
    { title: 'Additional Explanation', content: complaintData?.additional_explanation }
  ].filter((section) => section.content);

  // Decision props for ComplaintContentCard
  const decisionProps = {
    statusName: getRecommendationStatusName && getRecommendationStatusName(latestRecommendation?.status_with_agenda_id),
    description: latestRecommendation?.description,
    hasRecommendation: !!latestRecommendation
  };

  // Prepare witnesses
  const preparedWitnesses =
    witnesses?.map((w) => ({
      name: w.witness_name,
      phone: w.witness_phone_number || '-',
      address: w.witness_address
    })) || [];

  // Wrapper for InvestigationFilesCard onSelectFiles (expects files array, not event)
  const handleInvestigationFilesSelect = (selectedFiles) => {
    if (!canManageInvestigation) return;
    if (!selectedFiles || selectedFiles.length === 0) return;
    setInvestigationFiles((prev) => [...prev, ...selectedFiles]);
  };

  const headerSubtext =
    (complaintData?.status || '').toLowerCase() === 'accepted'
      ? 'Case accepted and awaiting decision.'
      : 'Review the complaint and take the necessary actions for case approval.';

  return (
    <Box sx={{ backgroundColor: '#f8fafc', py: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '14px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%', ml: 1, gap: 2, flexWrap: 'wrap' }}>
          <Box display="flex" flexDirection="column" sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={() => navigate(-1)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  transition: 'opacity 0.2s'
                }}
              >
                <FaLessThan style={{ color: '#143481' }} />
              </Box>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#215167', fontSize: '22px' }}>
                Case Management
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontSize: '14px', color: '#A3AED0' }}>
              {headerSubtext}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canEditInvestigation && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  onChange={handleInvestigationFileChange}
                  aria-label="Upload investigation files"
                />
                <Button
                  variant="contained"
                  disabled={investigationLoading}
                  startIcon={investigationLoading ? <CircularProgress size={20} color="inherit" /> : <AttachFileIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    backgroundColor: '#007BFF99',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2.5,
                    py: 0.5,
                    fontSize: '0.875rem',
                    borderRadius: 1,
                    minHeight: '36.5px',
                    '&:hover': { backgroundColor: '#0a3752' },
                    '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                  }}
                >
                  {investigationLoading ? 'Uploading...' : 'Add Files'}
                </Button>
              </>
            )}

            {showHeaderActions && (
              <>
                {canApprove && (
                  <Tooltip
                    title={
                      investigationAttachments.length === 0 ? 'Please add at least one investigation attachment before approving.' : ''
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        onClick={handleApprove}
                        disabled={loading || investigationAttachments.length === 0}
                        startIcon={<CheckIcon sx={{ color: '#fff' }} />}
                        sx={{
                          backgroundColor: !loading && investigationAttachments.length > 0 ? '#28a745' : '#9E9E9E',
                          color: '#fff',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2.5,
                          py: 0.5,
                          fontSize: '0.875rem',
                          borderRadius: 1,
                          minHeight: '36.5px',
                          '&:hover': {
                            backgroundColor: !loading && investigationAttachments.length > 0 ? '#218838' : '#9E9E9E'
                          },
                          '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                        }}
                      >
                        Approve
                      </Button>
                    </span>
                  </Tooltip>
                )}

                {canReject && (
                  <Tooltip title={loading ? 'Please wait for the current process to complete.' : ''}>
                    <span>
                      <Button
                        variant="contained"
                        onClick={handleOpenRejectModal}
                        disabled={loading}
                        startIcon={<UndoIcon sx={{ color: '#fff' }} />}
                        sx={{
                          backgroundColor: loading ? '#9E9E9E' : '#f39c12',
                          color: '#fff',
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2.5,
                          py: 0.5,
                          fontSize: '0.875rem',
                          borderRadius: 1,
                          minHeight: '36.5px',
                          '&:hover': { backgroundColor: loading ? '#9E9E9E' : '#e67e22' },
                          '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                        }}
                      >
                        Return
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* {justApproved && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 2, alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/case_decision')} endIcon={<ArrowForwardIcon />}>
              Go to Case Decision
            </Button>
          }
        >
          Complaint approved successfully! The case is now under council review.
        </Alert>
      )} */}

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={1.5}>
          <InfoCardWrapper grow={true}>
            <CaseInfoSection
              judgeInfo={{
                complaintId: complaintMeta?.complaint_id,
                judgeName: complaintMeta?.judge_name,
                courtOffice: complaintData?.judge_court,
                caseFileNumber: complaintMeta?.case_file_number,
                caseType: complaintMeta?.case_type
              }}
              fields={judgeFields}
              caseStatusLabel={statusLabel}
              showComplainantStatus={false}
            />
            <WitnessSection witnesses={preparedWitnesses} />
            <EvidenceAttachmentsSection
              attachments={evidenceAttachments}
              showEvidenceStatus={false}
              onViewAttachment={(attachment) => attachment && handleOpenDoc(attachment)}
            />
          </InfoCardWrapper>
        </Grid>

        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={1.5}>
          <CaseContentCardWrapper grow={true}>
            <ComplaintContentCard sections={sections} decisionProps={decisionProps} renderDecision={false} />
            <InvestigationFilesCard
              files={investigationFiles}
              attachments={investigationAttachments}
              onUpload={handleSaveInvestigationNote}
              onClearFiles={handleClearInvestigationFiles}
              onRemoveFile={handleRemoveInvestigationFile}
              onSelectFiles={handleInvestigationFilesSelect}
              isBulkUploading={investigationLoading}
              canEdit={canEditInvestigation}
              onViewFile={handleViewInvestigationFile}
              title="Investigation Files"
              hideUploadActions={false}
              showUploadButton={false}
              onViewInvestigationDoc={handleViewInvestigationFile}
            />
            <DecisionStatusSection {...decisionProps} />
            <FeedbackSection feedbackEntries={feedbackEntries} />
            {canEditInvestigation && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '14px', color: '#041f36' }}>
                  Investigation Note (optional)
                </Typography>
                <TextField
                  label="Investigation Note"
                  multiline
                  minRows={3}
                  value={investigationNote}
                  onChange={(e) => setInvestigationNote(e.target.value)}
                  placeholder="Add note for internal users..."
                  fullWidth
                  sx={{
                    '& .MuiInputBase-input': { fontSize: '14px' },
                    '& .MuiInputLabel-root': { fontSize: '14px' }
                  }}
                />
              </Box>
            )}
            {!canEditInvestigation && investigationAttachments.length === 0 && (
              <Typography color="text.secondary" sx={{ fontSize: '14px' }}>
                No investigation attachments available.
              </Typography>
            )}
          </CaseContentCardWrapper>
        </Grid>
      </Grid>


      {/* Document Preview Modal */}
      {openDoc && <InvestigationDocumentModal openDoc={openDoc} onClose={handleCloseDoc} />}

      {/* Reject Complaint Modal */}
      <CommonModal
        open={openRejectModal}
        onClose={handleCloseRejectModal}
        title="Return Complaint"
        width={{ xs: '90%', sm: 540 }}
        showCloseButton={false}
        actions={
          <>
            <Button variant="text" onClick={handleCloseRejectModal} sx={{ textTransform: 'none', fontSize: '14px', color: 'red' }}>
              Cancel
            </Button>
            <Button
              variant="text"
              onClick={async () => {
                await handleReject();
                if (rejectComment.trim()) handleCloseRejectModal();
              }}
              disabled={loading || !rejectComment.trim()}
              sx={{ textTransform: 'none', fontSize: '14px', py: 1.2, color: '#f39c12' }}
            >
              Return
            </Button>
          </>
        }
      >
        <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, border: '1px solid #e0e0e0', mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', lineHeight: 1.6 }}>
            <strong>Note:</strong> This action will send the complaint back to the investigation stage. The investigator will be notified
            and can make necessary corrections before resubmitting.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px', mb: 0.5 }}>
          Please provide a reason for returning this complaint:
        </Typography>
        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="Enter reason for returning (required)..."
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          sx={{
            '& .MuiInputBase-input': { fontSize: '14px' },
            '& .MuiInputLabel-root': { fontSize: '14px' }
          }}
        />
      </CommonModal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', fontSize: '14px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CaseReviewDetail;
