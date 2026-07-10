import { useLocation } from 'react-router-dom';
import compliantRequestService from '../../../service/compliantRequest.service';
import caseReviewService from '../../../service/caseReview.service';
import { useState, useEffect, useCallback, useMemo } from 'react';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import ComplainantSection from '../components/sections/ComplainantSection';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import WitnessSection from '../components/sections/WitnessSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import FeedbackSection from '../components/sections/FeedbackSection';
import ComplaintContentCard, { DecisionStatusSection, CaseTypeCommitteeSection } from '../components/ComplaintContentCard';
import InvestigationFilesCard from '../components/InvestigationFilesCard';
import ReasonModal from '../components/modals/ReasonModal';
import CommonPreviewModal from '../components/CommonPreviewModal';
import { FaLessThan } from 'react-icons/fa';
import { Alert, Box, Button, Grid, Snackbar, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material';
import { getErrorMessage, getFullFileUrl, getStatusLabel, hasPermission } from './utils/compliantHelpers';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { DeleteRecommendationModal } from '../components/modals/DeleteRecommendationModal';
import { DeleteAttachmentModal } from '../components/modals/DeleteAttachmentModal';
import { InvestigationDocumentModal } from '../components/modals/InvestigationDocumentModal';
import { RecommendationModal } from '../components/modals/RecommendationModal';
import { hasValue, isAnonymous } from '../components/utils/caseInfoHelpers';

const CompliantDetail = () => {
  const location = useLocation();
  const compliant_id = location.state.complaint_id;
  const navigate = useNavigate();
  const [compliantDetail, setCompliantDetail] = useState(null);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [openRecommendationModal, setOpenRecommendationModal] = useState(false);
  const [openDocumentModal, setOpenDocumentModal] = useState(false);
  const [openInvestigationDoc, setOpenInvestigationDoc] = useState(null);

  const [rejectmodal, setRejectModal] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [comment, setComment] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [files, setFiles] = useState([]);
  const [showRejectionField, setShowRejectionField] = useState(false);
  const [decisionStatuses, setDecisionStatuses] = useState([]);
  const [selectedDecisionStatusId, setSelectedDecisionStatusId] = useState('');
  const [decisionDescription, setDecisionDescription] = useState('');
  const [loadingDecisionStatuses, setLoadingDecisionStatuses] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [openDeleteRecommendationModal, setOpenDeleteRecommendationModal] = useState(false);
  const [openDeleteAttachmentModal, setOpenDeleteAttachmentModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);

  // Bulk operations state for flie attachments
  const [stagedDeletes, setStagedDeletes] = useState(new Set());
  const [stagedReplaces, setStagedReplaces] = useState(new Map());
  const [selectedAttachments, setSelectedAttachments] = useState(new Set());
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null); // For file preview modal (File object or attachment object)
  const theme = useTheme();
  const permissions = useMemo(() => {
    try {
      const stored = localStorage.getItem('permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const buildFeedbackEntries = (complaint) => {
    if (!complaint) return [];
    const toArray = (value) => {
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
    const feedbackItems = toArray(complaint?.complaintRejection || complaint?.complaint_rejection);

    return feedbackItems
      .filter((item) => item.status !== 'returned' || status !== 'returned')
      .map((item, idx) => ({
        id: item?.complaint_rejection_id || `feedback-${idx}`,
        title: deriveTitle(),
        message: item?.comment || '',
        date: item?.createdAt || item?.created_at || item?.updatedAt || item?.updated_at || null,
        source: deriveSource()
      }))
      .filter((entry) => entry.message || entry.date);
  };
  const getCompliantDetail = async () => {
    try {
      const response = await compliantRequestService.getCompliantRequestById(compliant_id);
      setCompliantDetail(response.complaint);
    } catch (error) {
      console.error('Get Compliant Request Error:', error);
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to load complaint details. Please refresh the page.'),
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    getCompliantDetail();
  }, [compliant_id]);
  const fetchExistingRecommendation = useCallback(async () => {
    if (!compliant_id) return;
    try {
      const result = await compliantRequestService.getDecisionRecommendations(compliant_id);
      const list = Array.isArray(result?.data) ? result.data : [];
      if (list.length > 0) {
        // Use the most recent by created_at if available, otherwise the last
        const sorted = [...list].sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        setCurrentRecommendation(sorted[0]);
      } else {
        setCurrentRecommendation(null);
      }
    } catch (error) {
      console.warn('Could not load decision recommendation:', error.message);
    }
  }, [compliant_id]);

  useEffect(() => {
    fetchExistingRecommendation();
  }, [fetchExistingRecommendation]);
  const fetchDecisionStatuses = useCallback(async () => {
    setLoadingDecisionStatuses(true);
    try {
      let statusesList = [];
      const fetchedStatuses = await caseReviewService.getDecisionStatuses();
      if (Array.isArray(fetchedStatuses)) {
        statusesList = fetchedStatuses;
      } else if (fetchedStatuses && typeof fetchedStatuses === 'object') {
        statusesList = fetchedStatuses.data || fetchedStatuses.statuses || fetchedStatuses.result || [];
      }
      setDecisionStatuses(statusesList);
    } catch (error) {
      console.warn('Could not fetch decision statuses:', error.message);
    } finally {
      setLoadingDecisionStatuses(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisionStatuses();
  }, [fetchDecisionStatuses]);

  const handleAcceptWithOptionalRecommendation = async () => {
    try {
      // Optional recommendation create/update
      if (selectedDecisionStatusId || (decisionDescription && decisionDescription.trim())) {
        const payload = {
          complaint_id: compliant_id,
          status_with_agenda_id: selectedDecisionStatusId || null,
          description: decisionDescription?.trim() || null
        };

        if (currentRecommendation?.decision_recommendation_id) {
          await compliantRequestService.updateDecisionRecommendation(currentRecommendation.decision_recommendation_id, payload);
        } else {
          await compliantRequestService.createDecisionRecommendation(payload);
        }
        await fetchExistingRecommendation();
      }

      // Proceed to accept
      await handleApprove();

      // reset modal state
      setSelectedDecisionStatusId('');
      setDecisionDescription('');
      setOpenRecommendationModal(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to accept complaint.'),
        severity: 'error'
      });
    }
  };

  const handleDeleteRecommendation = async () => {
    if (!currentRecommendation?.decision_recommendation_id) return;
    try {
      const result = await compliantRequestService.deleteDecisionRecommendation(currentRecommendation.decision_recommendation_id, {
        complaint_id: compliant_id
      });
      setCurrentRecommendation(null);
      setSelectedDecisionStatusId('');
      setDecisionDescription('');
      setSnackbar({
        open: true,
        message: result?.message || 'Decision recommendation removed.',
        severity: 'success'
      });
      setOpenDeleteRecommendationModal(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to remove decision recommendation. Please try again.'),
        severity: 'error'
      });
    }
  };

  const getRecommendationStatusName = (statusId) => {
    const found = decisionStatuses.find((s) => s.status_id === statusId);
    return found?.name || 'Unknown status';
  };
  const handleRejectClick = () => {
    setShowRejectionField(true);
  };
  const canManageEvidence = compliantDetail?.status === 'under_investigation';

  const handleConfirmReject = (complaint_evidence_id) => {
    handleRejectEvidence(complaint_evidence_id);
    setShowRejectionField(false);
  };
  if (!compliantDetail) return <Typography>Loading...</Typography>;

  const { applicant, witnesses, evidences, case_type, status } = compliantDetail || {};

  const handleCloseDocumentModal = () => {
    setOpenDocumentModal(false);
  };
  const handleCloseEvidenceModal = () => {
    setShowRejectionField(false);
    handleCloseDocumentModal();
  };
  const handleCancelRejection = () => setShowRejectionField(false);
  const handleCloseDeleteAttachmentModal = () => {
    setOpenDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  };
  const handleCloseDeleteRecommendationModal = () => setOpenDeleteRecommendationModal(false);

  const openRejectModal = () => {
    setRejectModal(true);
  };
  const currentEvidence = evidences[currentDocIndex];
  console.log('currentEvidence', currentEvidence);
  const handleNext = () => {
    if (currentDocIndex < evidences.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1);
      setShowRejectionField(false);
      setComment('');
    }
  };

  const handlePrevious = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1);
      setShowRejectionField(false);
      setComment('');
    }
  };

  const handleOpenDocumentModal = (complaint_evidence_id) => {
    // Find the index of the evidence being opened
    const evidenceIndex = evidences.findIndex((ev) => ev.complaint_evidence_id === complaint_evidence_id);
    if (evidenceIndex !== -1) {
      setCurrentDocIndex(evidenceIndex);
    }
    setShowRejectionField(false);
    setComment('');
    setOpenDocumentModal(true);
  };
  const textStyle = {
    fontSize: '17px',
    fontFamily: "'Montserrat', sans-serif",
    color: '#1E516A'
  };
  const handleBack = () => {
    navigate('/compliant');
  };

  const evidenceSrc = getFullFileUrl(currentEvidence?.file_path);
  const isImageEvidence = currentEvidence?.file_type?.startsWith('image/');
  const canSubmitRecommendation = compliantDetail?.status === 'under_investigation';

  const handleOpenInvestigationDoc = (doc) => setOpenInvestigationDoc(doc);
  const handleCommentChange = (event) => setComment(event.target.value);
  const handleReturnCommentChange = (event) => setReturnComment(event.target.value);

  // Handle file preview (for both File objects and attachment objects)
  const handlePreviewFile = (fileOrAttachment) => {
    setPreviewFile(fileOrAttachment);
  };

  const handleClosePreviewFile = () => {
    setPreviewFile(null);
  };
  const handleCloseInvestigationDoc = () => setOpenInvestigationDoc(null);
  const handleApprove = async () => {
    try {
      const response = await compliantRequestService.approveComplaint(compliant_id);
      setSnackbar({
        open: true,
        message: response.message || 'Request approved successfully',
        severity: 'success'
      });
      getCompliantDetail();
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Unable to approve complaint.');
      setSnackbar({
        open: true,
        message:
          errorMsg.includes('evidences') || errorMsg.includes('evidence')
            ? errorMsg
            : 'Unable to approve complaint. Please ensure all evidence documents are approved first.',
        severity: 'error'
      });
    }
  };
  const handleReject = async () => {
    try {
      const response = await compliantRequestService.rejectComplaint(compliant_id, { comment });
      setSnackbar({
        open: true,
        message: response.message || 'Request rejected successfully',
        severity: 'success'
      });
      getCompliantDetail();
      handleCloseEvidenceModal();
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to reject complaint. Please try again.'),
        severity: 'error'
      });
    }
  };

  const handleReturn = async () => {
    try {
      const response = await compliantRequestService.returnComplaint(compliant_id, { comment: returnComment });
      setSnackbar({
        open: true,
        message: response.message || 'Request returned successfully',
        severity: 'success'
      });
      getCompliantDetail();
      setOpenReturnModal(false);
      setReturnComment('');
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to return complaint. Please try again.'),
        severity: 'error'
      });
    }
  };

  const handleApproveEvidence = async (compliant_evidence_id) => {
    if (compliantDetail?.status !== 'under_investigation') return;
    try {
      const response = await compliantRequestService.approveCompliantEvidence(compliant_evidence_id);
      setSnackbar({
        open: true,
        message: response.message || 'Evidence approved successfully',
        severity: 'success'
      });
      getCompliantDetail();
    } catch (error) {
      console.error('Error approving evidence:', error);
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to approve evidence. Please try again.'),
        severity: 'error'
      });
    }
  };
  const handleRejectEvidence = async (complaint_evidence_id) => {
    if (compliantDetail?.status !== 'under_investigation') return;
    if (!comment || !comment.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for rejecting this evidence.',
        severity: 'warning'
      });
      return;
    }
    try {
      const response = await compliantRequestService.rejectCompliantEvidence(complaint_evidence_id, { comment });
      setSnackbar({
        open: true,
        message: response.message || 'Evidence rejected successfully',
        severity: 'success'
      });
      getCompliantDetail();
      setComment('');
      setShowRejectionField(false);
    } catch (error) {
      console.error('Error rejecting evidence:', error);
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to reject evidence. Please try again.'),
        severity: 'error'
      });
    }
  };

  const handleSelectFiles = (selectedFiles) => {
    setFiles(selectedFiles || []);
  };

  const handleUploadFile = async () => {
    if (!files || files.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select a file to upload.',
        severity: 'warning'
      });
      return;
    }

    setIsBulkUploading(true);
    const formData = new FormData();
    formData.append('complaint_id', compliant_id);
    files.forEach((f) => {
      if (f) {
        formData.append('investigation_file', f);
      }
    });

    try {
      const response = await compliantRequestService.uploadNoteAndFile(formData);

      setSnackbar({
        open: true,
        message: response.message || 'Files uploaded successfully',
        severity: 'success'
      });
      getCompliantDetail();
      setFiles([]);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to upload investigation note. Please check the file and try again.'),
        severity: 'error'
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Stage attachment for replacement
  const handleStageReplace = (case_attachment_id, file) => {
    if (!file) return;

    // Remove from deletes if it was staged for deletion
    setStagedDeletes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(case_attachment_id);
      return newSet;
    });

    // Add to replaces
    setStagedReplaces((prev) => {
      const newMap = new Map(prev);
      newMap.set(case_attachment_id, file);
      return newMap;
    });
  };

  // Stage attachment for deletion
  const handleStageDelete = (case_attachment_id) => {
    // Remove from replaces if it was staged for replacement
    setStagedReplaces((prev) => {
      const newMap = new Map(prev);
      newMap.delete(case_attachment_id);
      return newMap;
    });

    // Add to deletes
    setStagedDeletes((prev) => {
      const newSet = new Set(prev);
      newSet.add(case_attachment_id);
      return newSet;
    });
  };

  // Unstage attachment
  const handleUnstage = (case_attachment_id) => {
    setStagedDeletes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(case_attachment_id);
      return newSet;
    });
    setStagedReplaces((prev) => {
      const newMap = new Map(prev);
      newMap.delete(case_attachment_id);
      return newMap;
    });
  };

  // Toggle selection for bulk operations
  const handleToggleSelection = (case_attachment_id) => {
    setSelectedAttachments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(case_attachment_id)) {
        newSet.delete(case_attachment_id);
      } else {
        newSet.add(case_attachment_id);
      }
      return newSet;
    });
  };

  // Select all attachments
  const handleSelectAll = () => {
    if (!compliantDetail?.case?.attachments) return;

    const allIds = compliantDetail.case.attachments.map((att) => att.case_attachment_id).filter(Boolean);

    if (selectedAttachments.size === allIds.length) {
      // Deselect all
      setSelectedAttachments(new Set());
    } else {
      // Select all
      setSelectedAttachments(new Set(allIds));
    }
  };

  // Bulk stage selected for deletion
  const handleBulkStageDelete = () => {
    selectedAttachments.forEach((id) => {
      handleStageDelete(id);
    });
    setSelectedAttachments(new Set());
  };

  // Save all staged changes
  const handleSaveChanges = async () => {
    if (stagedDeletes.size === 0 && stagedReplaces.size === 0) return;

    setIsBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('complaint_id', compliant_id);

      // Add delete IDs
      if (stagedDeletes.size > 0) {
        formData.append('deletes', JSON.stringify(Array.from(stagedDeletes)));
      }

      // Add replace files
      stagedReplaces.forEach((file, attachmentId) => {
        formData.append(`replace_${attachmentId}`, file);
      });

      // Add replace metadata
      if (stagedReplaces.size > 0) {
        const replaceIds = Array.from(stagedReplaces.keys());
        formData.append('replaces', JSON.stringify(replaceIds));
      }

      const response = await compliantRequestService.bulkUpdateAttachments(formData);

      setSnackbar({
        open: true,
        message: response.message || 'Changes saved successfully',
        severity: 'success'
      });

      // Clear staged changes
      setStagedDeletes(new Set());
      setStagedReplaces(new Map());
      setSelectedAttachments(new Set());

      // Refresh data
      getCompliantDetail();
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Unable to save changes. Please try again.'),
        severity: 'error'
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Cancel all staged changes
  const handleCancelChanges = () => {
    setStagedDeletes(new Set());
    setStagedReplaces(new Map());
    setSelectedAttachments(new Set());
  };

  // Legacy handlers (kept for backward compatibility if needed)
  const handleReplaceAttachment = async (case_attachment_id, file) => {
    handleStageReplace(case_attachment_id, file);
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    handleStageDelete(attachmentToDelete.case_attachment_id);
    setOpenDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  };

  const showAcceptAndRejectButton = () => {
    // Only show buttons when status is under_investigation
    return compliantDetail.status === 'under_investigation';
  };

  // Check if all evidences are approved
  const allEvidencesApproved = () => {
    return compliantDetail.evidences && compliantDetail.evidences.every((evidence) => evidence.status === 'approved');
  };

  // Check if accept button should be enabled
  const canAccept = () => {
    if (compliantDetail.status === 'rejected') {
      return true; // Can accept if previously rejected
    }
    if (compliantDetail.status === 'under_investigation') {
      const hasAttachments = compliantDetail?.case?.attachments && compliantDetail.case.attachments.length > 0;
      return allEvidencesApproved() && hasAttachments; // Can accept only if all evidences are approved and has attachments
    }
    return false;
  };
  const canEditInvestigation = compliantDetail.status === 'under_investigation';
  const showUploadField = () => {
    return (
      canEditInvestigation &&
      compliantDetail.status === 'under_investigation' &&
      compliantDetail.evidences.every((evidence) => evidence.status === 'approved')
    );
  };

  const complaintMeta = {
    case_type: case_type,
    complaint_id: compliantDetail?.complaint_id,
    judge_name: compliantDetail?.judge_name,
    case_file_number: compliantDetail?.case_file_number,
    act_date: compliantDetail?.act_date
  };
  const feedbackEntries = buildFeedbackEntries(compliantDetail);

  console.log('compliantDetail', compliantDetail);

  const headerSubtext =
    (compliantDetail?.status || '').toLowerCase() === 'accepted'
      ? 'This complaint is accepted and awaiting council approval.'
      : 'Please review the complaint report and take necessary actions.';

  const displayStatusLabel = getStatusLabel(compliantDetail?.status, compliantDetail?.case?.status);
  const isAnonymousComplainant = applicant && isAnonymous(applicant.full_name);

  // Build complainant fields (skip name/email for anonymous users)
  const complainantFields = (() => {
    const fields = [];
    if (applicant) {
      if (!isAnonymousComplainant) {
        if (hasValue(applicant.full_name)) {
          fields.push({ label: 'Name', value: applicant.full_name });
        }
      }
      if (hasValue(applicant.phone_number)) {
        fields.push({ label: 'Phone', value: applicant.phone_number });
      }

      // add any other fields for complainant information section here.
    }
    return fields;
  })();

  // Build judge fields
  const judgeFields = (() => {
    const fields = [];
    if (complaintMeta) {
      if (hasValue(complaintMeta.complaint_id)) {
        const complaintId = complaintMeta.complaint_id?.substring(0, 8).toUpperCase();
        fields.push({ label: 'Report ID', value: complaintId, color: theme.palette.primary.main });
      }
      if (hasValue(complaintMeta.judge_name)) {
        fields.push({ label: 'Judge Name', value: complaintMeta.judge_name });
      }
      if (hasValue(compliantDetail?.judge_court)) {
        fields.push({ label: 'Court Office', value: compliantDetail.judge_court });
      }
      if (hasValue(complaintMeta.case_file_number)) {
        fields.push({ label: 'Case File Number', value: complaintMeta.case_file_number });
      }
      if (hasValue(complaintMeta.case_type)) {
        fields.push({ label: 'Case Type', value: complaintMeta.case_type });
      }
      // add any other fields for judge information section here.
    }
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = [
    { title: 'Detailed Description', content: compliantDetail?.detailed_description },
    { title: 'Damage Description', content: compliantDetail?.damage_description },
    { title: 'Additional Explanation', content: compliantDetail?.additional_explanation }
  ].filter((section) => section.content);

  // Decision props for ComplaintContentCard
  const decisionProps = {
    statusName: getRecommendationStatusName && getRecommendationStatusName(currentRecommendation?.status_with_agenda_id),
    description: currentRecommendation?.description,
    hasRecommendation: !!currentRecommendation
  };

  // Prepare evidence attachments
  const evidenceAttachments =
    compliantDetail.evidences?.map((ev, idx) => ({
      name: `Evidence ${idx + 1} (${ev.file_type.split('/')[1] || 'dox'})`,
      size: ev.file_size ? `${(ev.file_size / 1024).toFixed(1)} KB` : 'Unknown',
      file_path: ev.file_path,
      ...ev
    })) || [];

  // Prepare witnesses
  const preparedWitnesses =
    witnesses?.map((w) => ({
      name: w.witness_name,
      phone: w.witness_phone_number || '-',
      address: w.witness_address
    })) || [];

  return (
    <Box sx={{ maxHeight: '100vh', py: 2 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header & Back Button */}
      <Box display="flex" sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%', ml: 1 }}>
          <Box display="flex" flexDirection="column" sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={handleBack}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                  transition: 'opacity 0.2s'
                }}
              >
                <FaLessThan style={{ color: theme.palette.primary.main }} />
              </Box>
              <Typography
                variant="h4"
                sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: theme.palette.primary.main, fontSize: '22px' }}
              >
                Report Management
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontSize: '14px',
                color: '#A3AED0'
              }}
            >
              {headerSubtext}
            </Typography>
          </Box>
          {showAcceptAndRejectButton() && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Accept button - only show when status is under_investigation, disable if not all evidences are approved */}
              <Tooltip
                title={
                  !canAccept() || isBulkUploading
                    ? !canAccept()
                      ? 'Ensure all evidences are approved and at least one investigation file is uploaded.'
                      : 'Please wait for file upload to complete.'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    disabled={!canAccept() || isBulkUploading}
                    startIcon={<CheckIcon sx={{ color: '#fff' }} />}
                    sx={{
                      backgroundColor: canAccept() && !isBulkUploading ? '#28a745' : '#9E9E9E',
                      color: '#fff',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      borderRadius: 1,
                      minHeight: '36.5px',
                      '&:hover': { backgroundColor: canAccept() && !isBulkUploading ? '#218838' : '#9E9E9E' },
                      '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                    }}
                    onClick={() => {
                      setSelectedDecisionStatusId(currentRecommendation?.status_with_agenda_id || '');
                      setDecisionDescription(currentRecommendation?.description || '');

                      // If the user has permission to recommend decision, open the modal
                      if (hasPermission(permissions, { resource: 'complaintCase', action: 'recommendDecision' })) {
                        setOpenRecommendationModal(true);
                      } else {
                        handleApprove();
                      }
                    }}
                  >
                    Approve
                  </Button>
                </span>
              </Tooltip>

              {/* Return button - only show when status is under_investigation */}
              <Tooltip
                title={canAccept() ? 'Cannot return complaint once investigation notes are attached and all evidences are approved.' : ''}
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={() => setOpenReturnModal(true)}
                    disabled={canAccept()}
                    startIcon={<UndoIcon sx={{ color: '#fff' }} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      borderRadius: 1,
                      minHeight: '36.5px',
                      backgroundColor: canAccept() ? '#9E9E9E' : '#f39c12',
                      color: '#fff',
                      '&:hover': { backgroundColor: canAccept() ? '#9E9E9E' : '#e67e22' },
                      '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                    }}
                  >
                    Return
                  </Button>
                </span>
              </Tooltip>

              {/* Reject button - only show when status is under_investigation */}
              <Tooltip
                title={canAccept() ? 'Cannot reject complaint once investigation notes are attached and all evidences are approved.' : ''}
              >
                <span>
                  <Button
                    variant="contained"
                    disabled={canAccept()}
                    startIcon={<CloseIcon sx={{ color: '#fff' }} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      borderRadius: 1,
                      minHeight: '36.5px',
                      backgroundColor: canAccept() ? '#9E9E9E' : '#dc3545',
                      color: '#fff',
                      '&:hover': { backgroundColor: canAccept() ? '#9E9E9E' : '#c82333' },
                      '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                    }}
                    onClick={openRejectModal}
                  >
                    Reject
                  </Button>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
          <InfoCardWrapper grow={true}>
            <ComplainantSection
              complainantInfo={{
                name: applicant?.full_name,
                id: complaintMeta?.complaint_id,
                email: applicant?.email,
                phone: applicant?.phone_number,
                gender: applicant?.gender,
                address: applicant?.address,
                status: displayStatusLabel
              }}
              fields={complainantFields}
            />
            <CaseInfoSection
              judgeInfo={{
                complaintId: complaintMeta?.complaint_id,
                judgeName: complaintMeta?.judge_name,
                courtOffice: compliantDetail?.judge_court,
                caseFileNumber: complaintMeta?.case_file_number,
                caseType: complaintMeta?.case_type
              }}
              fields={judgeFields}
              caseStatusLabel={complainantFields.length === 0 ? displayStatusLabel : null}
              showComplainantStatus={complainantFields.length > 0}
            />
            <WitnessSection witnesses={preparedWitnesses} />
            <EvidenceAttachmentsSection
              attachments={evidenceAttachments}
              showEvidenceStatus={true}
              onViewAttachment={(attachment) => handleOpenDocumentModal(attachment.complaint_evidence_id)}
            />
          </InfoCardWrapper>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
          <CaseContentCardWrapper grow={true}>
            <ComplaintContentCard sections={sections} decisionProps={decisionProps} renderDecision={false} />
            <InvestigationFilesCard
              files={files}
              attachments={compliantDetail?.case?.attachments || []}
              onUpload={handleUploadFile}
              onClearFiles={() => setFiles([])}
              onRemoveFile={(idx) => {
                const newFiles = files.filter((_, i) => i !== idx);
                setFiles(newFiles);
              }}
              onSelectFiles={handleSelectFiles}
              isBulkUploading={isBulkUploading}
              canEdit={showUploadField()}
              onViewFile={(file) => {
                if (file instanceof File) {
                  handlePreviewFile(file);
                } else {
                  if (showUploadField() && !isBulkUploading) {
                    handlePreviewFile(file);
                  } else {
                    handleOpenInvestigationDoc(file);
                  }
                }
              }}
              stagedDeletes={stagedDeletes}
              stagedReplaces={stagedReplaces}
              selectedAttachments={selectedAttachments}
              onStageDelete={handleStageDelete}
              onStageReplace={handleStageReplace}
              onUnstage={handleUnstage}
              onToggleSelection={handleToggleSelection}
              onSelectAll={handleSelectAll}
              onBulkStageDelete={handleBulkStageDelete}
              onSaveChanges={handleSaveChanges}
              onCancelChanges={handleCancelChanges}
              onViewInvestigationDoc={handleOpenInvestigationDoc}
              title="Investigation Files"
              hideUploadActions={false}
              showUploadButton={true}
            />
            <DecisionStatusSection {...decisionProps} />
            <FeedbackSection feedbackEntries={feedbackEntries} />
          </CaseContentCardWrapper>
        </Grid>
      </Grid>
      <EvidencePreviewModal
        open={openDocumentModal}
        onClose={handleCloseEvidenceModal}
        evidences={evidences || []}
        currentEvidence={currentEvidence}
        currentDocIndex={currentDocIndex}
        evidenceSrc={evidenceSrc}
        isImageEvidence={isImageEvidence}
        canManageEvidence={canManageEvidence}
        showRejectionField={showRejectionField}
        comment={comment}
        onCommentChange={handleCommentChange}
        onApproveEvidence={handleApproveEvidence}
        onRejectClick={handleRejectClick}
        onConfirmReject={handleConfirmReject}
        onCancelRejection={handleCancelRejection}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <ReasonModal
        open={rejectmodal}
        title="Reject with Reason"
        placeholder="What is your reason for rejecting the complaint?"
        value={comment}
        onChange={handleCommentChange}
        onClose={() => {
          setRejectModal(false);
          setComment('');
        }}
        onSubmit={handleReject}
        submitLabel="Reject"
        submitColor="#dc3545"
        disabled={!comment.trim()}
      />

      <ReasonModal
        open={openReturnModal}
        title="Return with Reason"
        placeholder="What is your reason for returning the complaint?"
        value={returnComment}
        onChange={handleReturnCommentChange}
        onClose={() => {
          setOpenReturnModal(false);
          setReturnComment('');
        }}
        onSubmit={handleReturn}
        submitLabel="Return"
        submitColor="#c4ae68"
        disabled={!returnComment.trim()}
      />
      <DeleteRecommendationModal
        open={openDeleteRecommendationModal}
        onClose={handleCloseDeleteRecommendationModal}
        onConfirm={handleDeleteRecommendation}
      />
      <DeleteAttachmentModal
        open={openDeleteAttachmentModal}
        onClose={handleCloseDeleteAttachmentModal}
        onConfirm={handleDeleteAttachment}
      />
      <InvestigationDocumentModal openDoc={openInvestigationDoc} onClose={handleCloseInvestigationDoc} />
      <CommonPreviewModal file={previewFile} onClose={handleClosePreviewFile} />
      <RecommendationModal
        open={openRecommendationModal}
        onClose={() => setOpenRecommendationModal(false)}
        onSubmit={handleAcceptWithOptionalRecommendation}
        decisionStatuses={decisionStatuses}
        selectedDecisionStatusId={selectedDecisionStatusId}
        onStatusChange={(e) => setSelectedDecisionStatusId(e.target.value)}
        decisionDescription={decisionDescription}
        onDecisionDescriptionChange={(e) => setDecisionDescription(e.target.value)}
        loadingDecisionStatuses={loadingDecisionStatuses}
        canSubmit={canSubmitRecommendation}
      />
    </Box>
  );
};

export default CompliantDetail;
