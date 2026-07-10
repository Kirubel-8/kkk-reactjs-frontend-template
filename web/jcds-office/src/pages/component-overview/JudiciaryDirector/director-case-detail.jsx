import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Modal,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { FaLessThan, FaHistory } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import judiciaryDirectorService from '../../../service/judiciaryDirector.service';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import ComplaintContentCard from '../components/ComplaintContentCard';
import FeedbackSection from '../components/sections/FeedbackSection';
import { hasValue } from '../components/utils/caseInfoHelpers';
import ReasonModal from '../components/modals/ReasonModal';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { useTheme } from '@mui/material/styles';
import { getStatusMeta } from '../../../utils/statusColors';

export default function DirectorCaseDetail() {
  const theme = useTheme();
  const [dispComplaint, setDispComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [actionLoading, setActionLoading] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [openDoc, setOpenDoc] = useState(null);
  const [evidencesList, setEvidencesList] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);

  const handleSnackClose = () => setSnackOpen(false);
  const navigate = useNavigate();
  const location = useLocation();
  const disp_id = location.state?.disp_id;
  const navSuccessMessage = location.state?.successMessage;

  const handleOpenDoc = (doc) => setOpenDoc(doc);
  const handleCloseDoc = () => setOpenDoc(null);

  const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    let normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    if (normalizedUrl.startsWith('/public/')) {
      normalizedUrl = normalizedUrl.replace('/public', '');
    }

    return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${normalizedUrl}`;
  };

  const fetchComplaint = async () => {
    try {
      if (!disp_id) {
        setError('No case ID found');
        setLoading(false);
        return;
      }

      const response = await judiciaryDirectorService.getAssignedCaseById(disp_id);
      setDispComplaint(response.data);
      const sorted = [...(response.data.evidences || [])].sort((a, b) => (a.file_url || '').localeCompare(b.file_url || ''));
      setEvidencesList(sorted);

      const returneDirector = response.data?.case?.disciplinaryCaseReturn;

      console.log('kirub', returneDirector);
      if (returneDirector && returneDirector.length > 0) {
        setReturnHistory(returneDirector);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [disp_id]);

  useEffect(() => {
    if (navSuccessMessage) {
      setSnackMessage(navSuccessMessage);
      setSnackSeverity('success');
      setSnackOpen(true);
    }
  }, [navSuccessMessage]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await judiciaryDirectorService.approveCase(disp_id);

      setSnackMessage(response.message || 'Case approved successfully!');
      setSnackSeverity('success');
      setSnackOpen(true);

      fetchComplaint();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to approve case';
      setSnackMessage(errorMsg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnReason || !returnReason.trim()) {
      setSnackMessage('Please provide a reason for returning the case');
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      const response = await judiciaryDirectorService.returnCase(disp_id, returnReason);

      setSnackMessage(response.message || 'Case returned successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      setOpenReturnModal(false);
      setReturnReason('');

      fetchComplaint();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to return case';
      setSnackMessage(errorMsg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setActionLoading(false);
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
        Case not found
      </Typography>
    );

  const { applicant, issues, judge_name, court_office, file_number, status, case: caseData, witnesses } = dispComplaint;

  const isPendingReview = caseData?.status === 'pending_director_approval' || caseData?.status === 'pending_director_approval_again';

  const statusMeta = getStatusMeta(theme, status, caseData?.status);

  // Field computation logic
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
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = (() => {
    const detailedDescription = issues?.length ? issues.map((i) => `${i.description}`).join('\n\n') : null;
    return [{ title: 'Detailed Description', content: detailedDescription }].filter((section) => section.content);
  })();

  // Prepare feedback entries
  const feedbackEntries = (() => {
    return (returnHistory || [])
      .map((r) => ({
        id: r.id || `feedback-${r.created_at}`,
        title: 'Returned',
        message: r.return_reason || r.comment || '',
        date: r.created_at || r.createdAt || null,
        source: r.createdByUser?.full_name || 'Director'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  // Prepare evidence attachments
  const evidenceAttachments = evidencesList.map((e, i) => ({
    ...e,
    name: e.file_name || e.name || `Text Evidence ${i + 1}`,
    size: e.file_size ? `${(e.file_size / 1024).toFixed(1)} KB` : undefined
  }));

  return (
    <>
      <Box
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          backgroundColor: '#f8fafc',
          fontFamily: "'Montserrat', sans-serif"
        }}
      >
        {/* Header & Actions */}
        <Box display="flex" sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%', ml: 1 }}>
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
                  <FaLessThan style={{ color: theme.palette.primary.main, fontSize: '16px' }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: theme.palette.primary.main, fontSize: '22px' }}
                >
                  Director Case Review
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '14px',
                  color: '#A3AED0',
                  ml: 4
                }}
              >
                Review case details and make a decision.
              </Typography>
            </Box>

            {/* Action Buttons */}
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
              {isPendingReview && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleApprove}
                    disabled={actionLoading}
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      minWidth: 100,
                      minHeight: '36.5px',
                      color: '#fff',
                      backgroundColor: theme.palette.statusButtons.accept,
                      boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)',
                      '&:hover': { backgroundColor: theme.palette.statusButtons.accept }
                    }}
                  >
                    {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'Approve Case'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CancelIcon />}
                    onClick={() => setOpenReturnModal(true)}
                    disabled={actionLoading}
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      minWidth: 100,
                      minHeight: '36.5px',
                      color: '#fff',
                      backgroundColor: theme.palette.statusButtons.return,
                      '&:hover': { borderWidth: 2, backgroundColor: theme.palette.statusButtons.return }
                    }}
                  >
                    Return Case
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4} height="100%">
          {/* LEFT SIDE - Case Info */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={1.5}>
            <InfoCardWrapper grow={false}>
              <CaseInfoSection
                judgeInfo={{
                  complaintId: disp_id,
                  judgeName: judge_name,
                  courtOffice: court_office,
                  caseFileNumber: file_number
                }}
                fields={judgeFields}
                caseStatusLabel={statusMeta.label}
                showComplainantStatus={false}
              />
              <EvidenceAttachmentsSection
                attachments={evidenceAttachments}
                showEvidenceStatus={false}
                onViewAttachment={handleOpenDoc}
              />
            </InfoCardWrapper>
          </Grid>

          {/* RIGHT SIDE - Actions & Content */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
            {/* Main Content Card */}
            <CaseContentCardWrapper>
              <ComplaintContentCard sections={sections} decisionProps={{ hasRecommendation: false }} renderDecision={false} />
              <FeedbackSection feedbackEntries={feedbackEntries} />
            </CaseContentCardWrapper>
          </Grid>
        </Grid>

        {/* Return Modal */}
        <ReasonModal
          open={openReturnModal}
          title="Return Case"
          placeholder="Enter reason for returning this case..."
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          onClose={() => {
            setOpenReturnModal(false);
            setReturnReason('');
          }}
          onSubmit={handleReturn}
          submitLabel="Submit"
          submitColor="#f39c12"
          disabled={actionLoading || !returnReason.trim()}
        />

        {/* Text Evidence Modal - Kept for lists, triggered by 'onViewAttachment' if no file_url */}
        <AnimatePresence>
          {openDoc && !openDoc.file_url && (
            <Modal
              open
              onClose={handleCloseDoc}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                p: 1.5
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  width: { xs: '95%', sm: '85%', md: '70%' },
                  maxWidth: 900,
                  bgcolor: '#ffffff',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  p: { xs: 3, sm: 4 },
                  outline: 'none',
                  maxHeight: '92vh',
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2a38', mb: 2 }}>
                  Text Evidence Detail
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 2,
                    p: 3,
                    bgcolor: '#fafafa',
                    minHeight: '100px',
                    fontSize: '0.95rem',
                    color: '#333',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.8
                  }}
                >
                  {openDoc.description || 'No description provided'}
                </Box>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Document Preview (Files) */}
        <EvidencePreviewModal
          open={!!(openDoc && openDoc.file_url)}
          onClose={handleCloseDoc}
          evidences={evidencesList}
          currentEvidence={openDoc}
          currentDocIndex={openDoc ? evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id) : 0}
          evidenceSrc={getFullFileUrl(openDoc?.file_url)}
          isImageEvidence={openDoc?.file_url?.match(/\.(jpg|jpeg|png|gif)$/i)}
          canManageEvidence={false} // Director view is typically read-only for evidence modification inside modal
          onPrevious={() => {
            const idx = evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id);
            if (idx > 0) setOpenDoc(evidencesList[idx - 1]);
          }}
          onNext={() => {
            const idx = evidencesList.findIndex((e) => e.evidence_id === openDoc.evidence_id);
            if (idx < evidencesList.length - 1) setOpenDoc(evidencesList[idx + 1]);
          }}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackOpen}
          autoHideDuration={6000}
          onClose={handleSnackClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: '100%' }}>
            {snackMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
