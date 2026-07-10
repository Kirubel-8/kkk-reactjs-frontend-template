import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Grid, Modal, Divider, CircularProgress, Snackbar, Alert, Tooltip, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { FaHistory } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaLessThan } from 'react-icons/fa';
import disciplineCaseService from '../../../service/disciplinary.service';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import ComplainantSection from '../components/sections/ComplainantSection';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import WitnessSection from '../components/sections/WitnessSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import ComplaintContentCard from '../components/ComplaintContentCard';
import FeedbackSection from '../components/sections/FeedbackSection';
import { hasValue, isAnonymous } from '../components/utils/caseInfoHelpers';
import ReasonModal from '../components/modals/ReasonModal';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { getStatusMeta } from '../../../utils/statusColors';

export default function DetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const disp_id = location.state?.disp_id;

  const [openDoc, setOpenDoc] = useState(null);
  const [dispComplaint, setDispComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docStatus, setDocStatus] = useState({});
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success'); // "success" | "error"
  const [evidencesList, setEvidencesList] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [expandedIssueDesc, setExpandedIssueDesc] = useState({});
  const [expandedTextEvidence, setExpandedTextEvidence] = useState({});
  const [openEvidenceRejectModal, setOpenEvidenceRejectModal] = useState(false);
  const [showPreviewReview, setShowPreviewReview] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'issues' | 'textEvidence' | null
  const [currentTextEvidenceIndex, setCurrentTextEvidenceIndex] = useState(0);
  const [rejectionHistory, setRejectionHistory] = useState([]);
  const [dispStatus, setDispStatus] = useState('');
  const [returnHistory, setReturnHistory] = useState([]);

  const handleSnackClose = () => setSnackOpen(false);
  const handleBack = () => navigate(-1);

  const handleOpenDoc = (doc) => {
    setViewMode(null);
    setOpenDoc(doc);
  };
  const handleCloseDoc = () => {
    setOpenDoc(null);
    setViewMode(null);
    setCurrentTextEvidenceIndex(0);
  };

  const getFullFileUrl = (url) => {
    if (!url) return null;
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Otherwise, prefix your backend base URL
    return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${url}`;
  };

  const statusMap = {
    pending: 'Pending',
    rejected: 'Rejected',
    returned: 'Returned',
    under_investigation: 'Under Investigation',
    approved: 'Approved',
    accepted: 'Approved'
  };

  const fetchComplaint = async () => {
    try {
      if (!disp_id) {
        setError('No complaint ID found');
        setLoading(false);
        return;
      }
      const response = await disciplineCaseService.getAssignedDisciplinaryRequestById(disp_id);
      setDispComplaint(response.data);
      console.log('Kirub', response.data);

      const sorted = [...(response.data.evidences || [])]
        .sort((a, b) => (a.file_url || '').localeCompare(b.file_url || ''))
        .map((ev) => ({ ...ev, status: ev.file_status || ev.status }));
      setEvidencesList(sorted);
      setDispStatus(response.data.status);

      // Fetch rejection history if available
      const rejection = response.data?.disciplinaryRejection;
      console.log('kirub', rejection);
      if (rejection && rejection.length > 0) {
        setRejectionHistory(rejection);
      }

      const directorReturn = response.data?.case?.disciplinaryCaseReturn;

      console.log('kirub', directorReturn);
      if (directorReturn && directorReturn.length > 0) {
        setReturnHistory(directorReturn);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchComplaint();
  }, [disp_id]);

  const handleVerify = async (id) => {
    try {
      await disciplineCaseService.updateEvidenceFileStatus(id, 'verified');
      const updatedList = evidencesList.map((doc) =>
        doc.evidence_id === id ? { ...doc, file_status: 'verified', status: 'verified' } : doc
      );
      setEvidencesList(updatedList);
      // Update the openDoc if it's text evidence
      if (viewMode === 'textEvidence' && openDoc?.evidences) {
        setOpenDoc((prev) => ({
          ...prev,
          evidences: prev.evidences.map((doc) => (doc.evidence_id === id ? { ...doc, file_status: 'verified', status: 'verified' } : doc))
        }));
      } else if (openDoc?.file_url) {
        const currentIdx = updatedList.findIndex((e) => e.evidence_id === id);
        const nextIdx = currentIdx >= 0 && currentIdx < updatedList.length - 1 ? currentIdx + 1 : currentIdx;
        if (nextIdx >= 0) {
          setOpenDoc(updatedList[nextIdx]);
        }
      }
      setExpandedTextEvidence((prev) => ({ ...prev, [id]: false }));
      // handleCloseDoc();
      setSnackMessage('Document verified successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMessage('Failed to verify document');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleOpenRejectModal = (id) => {
    setSelectedEvidenceId(id);
    setOpenEvidenceRejectModal(true);
  };

  // const handleReject = async (id) => {
  //   try {
  //     await disciplineCaseService.updateEvidenceFileStatus(id, "rejected");
  //     setEvidencesList((prev) =>
  //       prev.map((doc) =>
  //         doc.evidence_id === id ? { ...doc, file_status: "rejected" } : doc
  //       )
  //     );
  //     setExpandedTextEvidence((prev) => ({ ...prev, [id]: false }));
  //     handleCloseDoc();
  //     setSnackMessage("Document rejected successfully");
  //     setSnackSeverity("success");
  //     setSnackOpen(true);
  //   } catch (err) {
  //     console.error(err);
  //     setSnackMessage("Failed to reject document");
  //     setSnackSeverity("error");
  //     setSnackOpen(true);
  //   }
  // };

  const handleReject = async () => {
    try {
      await disciplineCaseService.updateEvidenceFileStatus(selectedEvidenceId, 'rejected', rejectionReason);
      const updatedList = evidencesList.map((doc) =>
        doc.evidence_id === selectedEvidenceId ? { ...doc, file_status: 'rejected', status: 'rejected' } : doc
      );
      setEvidencesList(updatedList);
      // Update the openDoc if it's text evidence
      if (viewMode === 'textEvidence' && openDoc?.evidences) {
        setOpenDoc((prev) => ({
          ...prev,
          evidences: prev.evidences.map((doc) =>
            doc.evidence_id === selectedEvidenceId ? { ...doc, file_status: 'rejected', status: 'rejected' } : doc
          )
        }));
      } else if (openDoc?.file_url) {
        const currentIdx = updatedList.findIndex((e) => e.evidence_id === selectedEvidenceId);
        const nextIdx = currentIdx >= 0 && currentIdx < updatedList.length - 1 ? currentIdx + 1 : currentIdx;
        if (nextIdx >= 0) {
          setOpenDoc(updatedList[nextIdx]);
        }
      }
      setOpenEvidenceRejectModal(false);
      setShowPreviewReview(false);
      // handleCloseDoc();
      setRejectionReason('');
      setSnackMessage('Document rejected successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMessage('Failed to reject document');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleDispComplaint = async (action, comment = null) => {
    try {
      setDecisionLoading(true);
      const response = await disciplineCaseService.processDisciplinaryComplaint(disp_id, action, comment);
      await fetchComplaint();
      setSnackMessage(
        response.message || `Complaint ${action === 'accept' ? 'accepted' : action === 'return' ? 'returned' : 'rejected'} successfully.`
      );
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to perform action.';
      setSnackMessage(msg);
      setSnackSeverity('info');
      setSnackOpen(true);
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" align="center" mt={5}>
        {error}
      </Typography>
    );

  if (!dispComplaint)
    return (
      <Typography align="center" mt={5}>
        Complaint not found
      </Typography>
    );

  const { applicant, issues, evidences, judge_name, court_office, file_number } = dispComplaint;

  // Field computation logic
  const isAnonymousComplainant = applicant && isAnonymous(applicant.full_name);

  const complainantFields = (() => {
    const fields = [];
    if (applicant) {
      if (!isAnonymousComplainant && hasValue(applicant.full_name)) {
        fields.push({ label: 'Name', value: applicant.full_name });
      }
      if (hasValue(applicant.phone_number)) {
        fields.push({ label: 'Phone', value: applicant.phone_number });
      }
    }
    return fields;
  })();

  const judgeFields = (() => {
    const fields = [];
    if (hasValue(disp_id)) {
      const complaintId = disp_id?.substring(0, 8).toUpperCase();
      fields.push({ label: 'Report ID', value: complaintId, color: theme.palette.primary.main });
    }
    if (hasValue(judge_name)) {
      fields.push({ label: 'Judge Name', value: judge_name });
    }
    if (hasValue(court_office)) {
      fields.push({ label: 'Court Office', value: court_office });
    }
    if (hasValue(file_number)) {
      fields.push({ label: 'Case File Number', value: file_number });
    }
    if (hasValue(dispComplaint.case_type)) {
      fields.push({ label: 'Case Type', value: dispComplaint.case_type });
    }
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = (() => {
    const detailedDescription = issues?.length ? issues.map((i) => `${i.description}`).join('\n\n') : null;
    return [{ title: 'Detailed Description', content: detailedDescription }].filter((section) => section.content);
  })();

  // Prepare feedback entries
  const feedbackEntries = [
    ...(rejectionHistory || []).map((r) => ({
      id: r.id || `rejection-${r.created_at}`,
      title: 'Rejected',
      message: r.comment || '',
      date: r.created_at || r.createdAt || null,
      source: 'Admin'
    })),
    ...(returnHistory || []).map((r) => ({
      id: r.id || `return-${r.created_at}`,
      title: 'Returned',
      message: r.return_reason || r.comment || '',
      date: r.created_at || r.createdAt || null,
      source: 'Director'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Prepare evidence attachments
  const evidenceAttachments = evidencesList.map((doc, idx) => ({
    name: doc.file_url ? doc.file_url.replace(/^.*[\\\/]/, '') : 'Text Evidence',
    size: doc.file_url ? 'Document' : 'Text Content',
    file_path: doc.file_url,
    ...doc,
    status: doc.file_status || doc.status
  }));

  // Prepare witnesses
  const preparedWitnesses =
    dispComplaint.witnesses?.map((w) => ({
      name: w.witness_name,
      phone: w.witness_phone_number || '-',
      address: w.witness_address
    })) || [];

  // Animation Variants
  const fadeVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const typographyStyles = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    fontSize: '1rem',
    color: '#041f36'
  };

  const casesta = dispComplaint.case?.status;

  console.log('kiruuubb', casesta);

  const statusMeta = getStatusMeta(theme, dispStatus);

  const isUnderInvestigation = dispComplaint.status === 'under_investigation';
  const isReturned = dispStatus === 'returned';
  const isNotDirectorReturned = dispComplaint.case && dispComplaint.case?.status !== 'Returned by Director';
  const isRejected = dispStatus === 'rejected';
  const isAccepted = dispStatus === 'accepted';
  const isPendingDirector =
    dispComplaint.case?.status === 'pending_director_approval' || dispComplaint.case?.status === 'pending_director_approval_again';

  const hasUnapprovedEvidence = evidencesList.some((ev) => !['verified', 'approved'].includes(ev.file_status));

  // Disable button logic
  const disableAccept = isReturned || isRejected || hasUnapprovedEvidence || (isAccepted && isPendingDirector);
  const disableReturn = isRejected || isReturned || isNotDirectorReturned;
  const disableReject = isReturned || isRejected || isNotDirectorReturned;

  console.log('disable buttons debug', {
    disableAccept,
    disableReturn,
    disableReject,
    isReturned,
    isRejected,
    isUnderInvestigation,
    isPendingDirector,
    isNotDirectorReturned,
    hasUnapprovedEvidence
  });

  // Function to check if we should show action buttons
  const showActionButtons = () => {
    console.log('action buttons debug', {
      isUnderInvestigation,
      isReturned,
      isRejected,
      isAccepted,
      isPendingDirector,
      condition1: isUnderInvestigation,
      condition2: !isReturned && !isRejected && (!isAccepted || !isPendingDirector)
    });
    const isAwaitingApproval = (isUnderInvestigation && !isPendingDirector) || (isAccepted && !isNotDirectorReturned);
    return isAwaitingApproval && !(isReturned || isRejected);
  };

  // Header subtext
  const headerSubtext = `Review and manage disciplinary case.`;

  const acceptTooltip = disableAccept
    ? hasUnapprovedEvidence
      ? 'Approve all evidences before accepting this complaint.'
      : 'Cannot accept this complaint'
    : 'Accept complaint';

  return (
    <>
      <Box
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          backgroundColor: '#f8fafc',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: { xs: '0.875rem', sm: '0.9rem', md: '1rem' },
          fontWeight: 600,
          lineHeight: 1.6,
          color: '#1f2a38'
        }}
      >
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
                  Disciplinary Management
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* <Button
                variant="contained"
                startIcon={<FaHistory />}
                onClick={() => {}}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: 1,
                  fontWeight: 600,
                  minWidth: 100,
                  minHeight: '36.5px',
                  backgroundColor: theme.palette.statusButtons.neutral,
                  color: '#fff',
                  '&:hover': { backgroundColor: theme.palette.statusButtons.neutral, color: '#fff' }
                }}
              >
                History | Log
              </Button> */}
              {showActionButtons() && (
                <>
                  {/* Accept button */}
                  <Tooltip title={acceptTooltip}>
                    <span>
                      <Button
                        variant="contained"
                        onClick={() => handleDispComplaint('accept')}
                        disabled={decisionLoading || disableAccept}
                        startIcon={<CheckIcon sx={{ color: '#fff' }} />}
                        sx={{
                          px: 2.5,
                          py: 0.5,
                          fontSize: '0.875rem',
                          textTransform: 'none',
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 100,
                          minHeight: '36.5px',
                          backgroundColor: '#4CAF50',
                          '&:hover': { backgroundColor: '#43A047' },
                          '&:disabled': { backgroundColor: '#9E9E9E' }
                        }}
                      >
                        Accept
                      </Button>
                    </span>
                  </Tooltip>

                  {/* Return button */}
                  <Tooltip title={disableReturn ? 'Cannot return this complaint' : 'Return complaint for revision'}>
                    <span>
                      <Button
                        variant="contained"
                        onClick={() => setOpenReturnModal(true)}
                        disabled={decisionLoading || disableReturn}
                        startIcon={<UndoIcon />}
                        sx={{
                          px: 2.5,
                          py: 0.5,
                          fontSize: '0.875rem',
                          textTransform: 'none',
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 100,
                          minHeight: '36.5px',
                          backgroundColor: theme.palette.statusButtons.return,
                          '&:hover': { backgroundColor: '#FFC66C' },
                          '&:disabled': { backgroundColor: '#9E9E9E' }
                        }}
                      >
                        Return
                      </Button>
                    </span>
                  </Tooltip>

                  {/* Reject button */}
                  <Tooltip title={disableReject ? 'Cannot reject this complaint' : 'Reject complaint'}>
                    <span>
                      <Button
                        variant="contained"
                        onClick={() => setOpenRejectModal(true)}
                        disabled={decisionLoading || disableReject}
                        startIcon={<CloseIcon />}
                        sx={{
                          px: 2.5,
                          py: 0.5,
                          fontSize: '0.875rem',
                          textTransform: 'none',
                          borderRadius: 1,
                          fontWeight: 600,
                          minWidth: 100,
                          minHeight: '36.5px',
                          backgroundColor: theme.palette.statusButtons.rejected,
                          '&:hover': { backgroundColor: '#D32F2F' },
                          '&:disabled': { backgroundColor: '#9E9E9E' }
                        }}
                      >
                        Reject
                      </Button>
                    </span>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* LEFT SIDE */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
            <InfoCardWrapper grow={false}>
              <ComplainantSection
                complainantInfo={{
                  name: applicant?.full_name,
                  id: disp_id || dispComplaint?.complaint_id,
                  email: applicant?.email,
                  phone: applicant?.phone_number,
                  gender: applicant?.gender,
                  status: statusMeta.label
                }}
                fields={complainantFields}
              />
              <CaseInfoSection
                judgeInfo={{
                  complaintId: disp_id,
                  judgeName: judge_name,
                  courtOffice: court_office,
                  caseFileNumber: file_number,
                  caseType: dispComplaint.case_type
                }}
                fields={judgeFields}
                caseStatusLabel={complainantFields.length === 0 ? statusMeta.label : null}
                showComplainantStatus={complainantFields.length > 0}
              />
              <WitnessSection witnesses={preparedWitnesses} />
              <EvidenceAttachmentsSection
                attachments={evidenceAttachments}
                showEvidenceStatus={true}
                onViewAttachment={(doc) => {
                  if (!doc.file_url) {
                    // For text evidence
                    const textEvidences = evidencesList.filter((d) => !d.file_url);
                    const index = textEvidences.findIndex((d) => d.evidence_id === doc.evidence_id);
                    setViewMode('textEvidence');
                    setCurrentTextEvidenceIndex(index >= 0 ? index : 0);
                    setOpenDoc({
                      type: 'textEvidence',
                      evidences: textEvidences
                    });
                  } else {
                    handleOpenDoc(doc);
                  }
                }}
              />
            </InfoCardWrapper>
          </Grid>

          {/* RIGHT SIDE */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
            <CaseContentCardWrapper>
              <ComplaintContentCard sections={sections} decisionProps={{ hasRecommendation: false }} renderDecision={false} />
              <FeedbackSection feedbackEntries={feedbackEntries} />
            </CaseContentCardWrapper>
          </Grid>
        </Grid>

        {/* Reusable Reason Modals */}
        <ReasonModal
          open={openRejectModal}
          title="Reject Complaint"
          placeholder="Please provide a clear reason for rejecting this complaint..."
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          onClose={() => setOpenRejectModal(false)}
          onSubmit={async () => {
            await handleDispComplaint('reject', rejectComment);
            setOpenRejectModal(false);
            setRejectComment('');
          }}
          submitLabel="Reject"
          submitColor="#e74c3c"
          disabled={decisionLoading || !rejectComment.trim()}
        />

        <ReasonModal
          open={openReturnModal}
          title="Return Complaint"
          placeholder="Please provide a clear reason for returning this complaint..."
          value={returnComment}
          onChange={(e) => setReturnComment(e.target.value)}
          onClose={() => setOpenReturnModal(false)}
          onSubmit={async () => {
            await handleDispComplaint('return', returnComment);
            setOpenReturnModal(false);
            setReturnComment('');
          }}
          submitLabel="Return"
          submitColor="#f39c12"
          disabled={decisionLoading || !returnComment.trim()}
        />
        <ReasonModal
          open={openEvidenceRejectModal}
          title="Reject Evidence"
          placeholder="Write rejection reason here..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          onClose={() => setOpenEvidenceRejectModal(false)}
          onSubmit={handleReject}
          submitLabel="Submit"
          submitColor="#d32f2f"
          disabled={!rejectionReason.trim()}
        />

        {/* Document & Text Evidence Preview */}
        <EvidencePreviewModal
          open={!!(openDoc && (viewMode === 'textEvidence' || openDoc.file_url))}
          onClose={handleCloseDoc}
          evidences={viewMode === 'textEvidence' ? openDoc?.evidences || [] : evidencesList}
          currentEvidence={viewMode === 'textEvidence' ? openDoc?.evidences?.[currentTextEvidenceIndex] : openDoc}
          currentDocIndex={
            viewMode === 'textEvidence'
              ? currentTextEvidenceIndex
              : openDoc
                ? evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id)
                : 0
          }
          evidenceSrc={
            viewMode === 'textEvidence'
              ? `data:text/html;charset=utf-8,<html lang="en"><body style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">${encodeURIComponent(
                  openDoc?.evidences?.[currentTextEvidenceIndex]?.description || 'No description provided.'
                )}</body></html>`
              : getFullFileUrl(openDoc?.file_url)
          }
          isImageEvidence={viewMode !== 'textEvidence' && openDoc?.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)}
          canManageEvidence={showActionButtons()}
          showRejectionField={showPreviewReview}
          comment={rejectionReason}
          onCommentChange={(e) => setRejectionReason(e.target.value)}
          onApproveEvidence={(id) => handleVerify(id)}
          onRejectClick={() => {
            const id = viewMode === 'textEvidence' ? openDoc?.evidences?.[currentTextEvidenceIndex]?.evidence_id : openDoc?.evidence_id;
            setSelectedEvidenceId(id);
            setShowPreviewReview(true);
          }}
          onConfirmReject={handleReject}
          onCancelRejection={() => {
            setShowPreviewReview(false);
            setRejectionReason('');
          }}
          onPrevious={() => {
            if (viewMode === 'textEvidence') {
              setCurrentTextEvidenceIndex((prev) => Math.max(0, prev - 1));
            } else {
              const idx = evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id);
              if (idx > 0) setOpenDoc(evidencesList[idx - 1]);
            }
          }}
          onNext={() => {
            if (viewMode === 'textEvidence') {
              const len = openDoc?.evidences?.length || 0;
              setCurrentTextEvidenceIndex((prev) => Math.min(len - 1, prev + 1));
            } else {
              const idx = evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id);
              if (idx < evidencesList.length - 1) setOpenDoc(evidencesList[idx + 1]);
            }
          }}
        />
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
