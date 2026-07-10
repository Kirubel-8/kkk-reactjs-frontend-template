import { useLocation } from 'react-router-dom';
import caseReviewService from '../../../service/caseReview.service';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { InvestigationDocumentModal } from '../components/modals/InvestigationDocumentModal';
import CommonModal from '../components/CommonModal';
import {
  Alert,
  Snackbar,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { getStatusMeta } from '../../../utils/statusColors';

const toTitleCase = (value, fallback = 'Not available') => {
  if (!value) return fallback;
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

const getStatusChipColor = (status) => {
  const normalized = (status || '').toLowerCase();
  if (['pending', 'submitted'].includes(normalized)) return 'primary';
  if (['under_investigation', 'under review'].includes(normalized)) return 'warning';
  if (['accepted', 'verified', 'approved', 'under_council_review'].includes(normalized)) return 'success';
  if (['rejected', 'declined'].includes(normalized)) return 'error';
  if (['returned', 'returned_to_office'].includes(normalized)) return 'info';
  return 'default';
};

// Copy/Reuse the hasPermission util from ProtectedRoute
const hasPermission = (permissions, requiredPermission) => {
  const permissionList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return permissionList.some(({ resource, action }) =>
    permissions.some((permission) => permission.resource === resource && permission.action === action)
  );
};

const CaseDecisionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openDoc, setOpenDoc] = useState(null);
  const [file, setFile] = useState(null);
  const [externalDecision, setExternalDecision] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [selectedAgendaWithStatus, setSelectedAgendaWithStatus] = useState('');
  const [loadingAgendas, setLoadingAgendas] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const id = location.state?.caseId;

  // Check user permissions
  const permissions = useMemo(() => {
    try {
      const p = localStorage.getItem('permissions');
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  }, []);

  const canDecide = useMemo(() => hasPermission(permissions, { resource: 'caseDecision', action: 'decide' }), [permissions]);

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
      const response = await caseReviewService.getCaseDetailForDecision(id);
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

  const fetchAgendasAndStatuses = useCallback(async () => {
    setLoadingAgendas(true);
    try {
      // Fetch statuses using the correct endpoint for case decisions
      let statusesList = [];
      try {
        const fetchedStatuses = await caseReviewService.getDecisionStatuses();
        if (Array.isArray(fetchedStatuses)) {
          statusesList = fetchedStatuses;
        } else if (fetchedStatuses && typeof fetchedStatuses === 'object') {
          statusesList = fetchedStatuses.data || fetchedStatuses.statuses || fetchedStatuses.result || [];
        }
      } catch (statusErr) {
        console.warn('⚠️ Could not fetch statuses:', statusErr.message);
        statusesList = [];
      }
      setStatuses(statusesList);
    } catch (err) {
      console.error('❌ Error fetching agendas:', err);
    } finally {
      setLoadingAgendas(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAgendasAndStatuses();
  }, [fetchData, fetchAgendasAndStatuses]);

  const handleMakeDecision = async () => {
    if (selectedAgendaWithStatus) {
      try {
        setLoading(true);
        const decisionData = {
          decision_status_id: selectedAgendaWithStatus,
          letter_ref_number: null, // Leave null as requested
          external_decision: externalDecision || null,
          decision_document: file
        };

        await caseReviewService.makeDecisionOnCase(id, decisionData);
        await fetchData();
        setSnackbar({
          open: true,
          message: 'Decision made successfully',
          severity: 'success'
        });
        handleCloseModal();
      } catch (error) {
        setSnackbar({
          open: true,
          message: getErrorMessage(error, 'Unable to submit decision. Please check all required fields and try again.'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a decision status before submitting.',
        severity: 'warning'
      });
    }
  };

  const getStatusMetaForDecision = (status, caseStatus) => {
    // In decision views, treat under_council_review as Pending
    return getStatusMeta(theme, status, caseStatus, 'under_council_review');
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

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleOpenDoc = (doc) => setOpenDoc(doc);
  const handleCloseDoc = () => setOpenDoc(null);

  const handleBack = () => {
    navigate('/case_decision');
  };

  // Builds a safe absolute file URL, handling env base and stripping duplicate slashes
  const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_DOCUMENT_URL || import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
    const normalizedBase = base.replace(/\/+$/, '');
    const normalizedPath = url.replace(/^\/+/, '');
    return `${normalizedBase}/${normalizedPath}`;
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
  const complaintData = data.complaint;
  const applicant = data?.applicant || complaintData?.applicant;
  const witnesses = data?.witnesses || complaintData?.witnesses;
  const evidences = data?.evidences || complaintData?.evidences || [];
  const mergedAttachments =
    (complaintData?.case?.attachments && complaintData.case.attachments.length > 0 ? complaintData.case.attachments : data?.attachments) ||
    [];
  const complaintDataView = {
    ...complaintData,
    case: {
      ...complaintData?.case,
      attachments: mergedAttachments
    }
  };
  const investigationAttachments = mergedAttachments;
  const isCaseClosed = data?.status === 'closed' || (complaintData?.status || '').toLowerCase() === 'decided';
  const decision = data?.decision;
  const recommendationList = data?.decisionRecommendations || null;
  const latestRecommendation = getLatestRecommendation(recommendationList);
  const feedbackEntries = buildFeedbackEntries(complaintDataView);

  const complaintMeta = {
    case_type: data?.case_type || complaintData?.case_type,
    complaint_id: data?.complaint_id || complaintData?.complaint_id,
    judge_name: data?.judge_name || complaintData?.judge_name,
    case_file_number: data?.case_file_number || complaintData?.case_file_number,
    act_date: data?.act_date || complaintData?.act_date
  };
  const complaintStatusLabel = toTitleCase(complaintData?.status);
  const caseStatusLabel = toTitleCase(data?.status || complaintData?.case?.status);
  const complaintStatusChipColor = getStatusChipColor(complaintData?.status);
  const caseStatusChipColor = getStatusChipColor(data?.status || complaintData?.case?.status);
  const statusMeta = getStatusMetaForDecision(complaintData?.status, complaintData?.case?.status);
  const statusLabel = statusMeta.label;
  const statusColor = statusMeta.color;
  const showHeaderActions = !isCaseClosed && canDecide;
  const evidenceAttachments = evidences.map((ev, idx) => ({
    name: `Evidence ${idx + 1} (${ev.file_type?.split('/')[1] || 'doc'})`,
    size: ev.file_size ? `${(ev.file_size / 1024).toFixed(1)} KB` : 'Unknown',
    file_path: ev.file_path,
    ...ev
  }));

  const getRecommendationStatusName = (statusId) => {
    const found = statuses?.find((status) => status.status_id === statusId);
    return found?.name || 'Unknown status';
  };

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
    if (hasValue(complaintDataView?.judge_court)) {
      fields.push({ label: 'Court Office', value: complaintDataView.judge_court });
    }
    if (hasValue(complaintMeta?.case_file_number)) {
      fields.push({ label: 'Case File Number', value: complaintMeta.case_file_number });
    }
    if (hasValue(complaintMeta?.case_type)) {
      fields.push({ label: 'Case Type', value: complaintMeta.case_type });
    }
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = [
    { title: 'Detailed Description', content: complaintDataView?.detailed_description },
    { title: 'Damage Description', content: complaintDataView?.damage_description },
    { title: 'Additional Explanation', content: complaintDataView?.additional_explanation }
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

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 3 }}>
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
                Case Decision
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ fontSize: '14px', color: '#A3AED0' }}>
              Review the complaint details and record the council decision.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {showHeaderActions && (
              <Button
                variant="contained"
                onClick={handleOpenModal}
                disabled={loading}
                startIcon={<CheckCircleIcon sx={{ color: '#fff' }} />}
                sx={{
                  backgroundColor: loading ? '#9E9E9E' : '#28a745',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  py: 0.5,
                  fontSize: '0.875rem',
                  borderRadius: 1,
                  minHeight: '36.5px',
                  '&:hover': { backgroundColor: loading ? '#9E9E9E' : '#28a745' },
                  '&:disabled': { backgroundColor: '#9E9E9E', color: '#fff' }
                }}
              >
                Decide
              </Button>
            )}
            {decision && (
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 1,
                  px: 2,
                  py: 1.5,
                  minWidth: 260
                  // backgroundColor: '#f8fafc'
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Decision Given
                    </Typography>
                    <Chip
                      label={decision?.status?.name || 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: '#0d6f4e',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    />
                  </Box>
                  {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                      Ref #
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '13px' }}>
                      {decision?.letterRef?.reference_number || 'N/A'}
                    </Typography>
                  </Box> */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {decision?.decision_document && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => window.open(getFullFileUrl(decision.decision_document), '_blank')}
                        sx={{ textTransform: 'none', fontSize: '12px', px: 1.25, py: 0.25 }}
                      >
                        Decision Doc
                      </Button>
                    )}
                    {decision?.external_decision_document && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => window.open(getFullFileUrl(decision.external_decision_document), '_blank')}
                        sx={{ textTransform: 'none', fontSize: '12px', px: 1.25, py: 0.25 }}
                      >
                        External Doc
                      </Button>
                    )}
                  </Box>
                </Box>
              </Card>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={1.5}>
          <InfoCardWrapper grow={true}>
            <CaseInfoSection
              judgeInfo={{
                complaintId: complaintMeta?.complaint_id,
                judgeName: complaintMeta?.judge_name,
                courtOffice: complaintDataView?.judge_court,
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
              files={[]}
              attachments={investigationAttachments}
              canEdit={false}
              isBulkUploading={false}
              onViewFile={handleOpenDoc}
              title="Investigation Files"
              hideUploadActions={true}
              showUploadButton={false}
              stagedDeletes={new Set()}
              stagedReplaces={new Map()}
              selectedAttachments={new Set()}
              onStageDelete={() => {}}
              onStageReplace={() => {}}
              onUnstage={() => {}}
              onToggleSelection={() => {}}
              onSelectAll={() => {}}
              onBulkStageDelete={() => {}}
              onSaveChanges={() => {}}
              onCancelChanges={() => {}}
              onSelectFiles={() => {}}
              onRemoveFile={() => {}}
              onClearFiles={() => {}}
              onViewInvestigationDoc={handleOpenDoc}
            />
            <DecisionStatusSection {...decisionProps} />
            <FeedbackSection feedbackEntries={feedbackEntries} />
          </CaseContentCardWrapper>
        </Grid>
      </Grid>

      {/* Document Preview Modal */}
      {openDoc && <InvestigationDocumentModal openDoc={openDoc} onClose={handleCloseDoc} />}

      <CommonModal
        open={openModal}
        onClose={handleCloseModal}
        title="Complaint Case Decision"
        width={{ xs: '90%', sm: 600 }}
        actions={
          <>
            <Button
              variant="text"
              onClick={handleCloseModal}
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                // color: theme.palette.statusButtons.rejected,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleMakeDecision}
              disabled={loading || !selectedAgendaWithStatus}
              startIcon={<CheckCircleIcon />}
              sx={{
                textTransform: 'none',
                fontSize: '14px',
                py: 1.2,
                backgroundColor: theme.palette.statusButtons.accept,
                '&:hover': {
                  backgroundColor: theme.palette.statusButtons.accept,
                  opacity: 0.85
                }
              }}
            >
              Submit Decision
            </Button>
          </>
        }
        showCloseButton={false}
      >
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={12}>
            <FormControl fullWidth>
              <InputLabel
                id="agenda-status-label"
                sx={{
                  fontSize: '12px',
                  '&.MuiInputLabel-shrink': { top: 0, backgroundColor: '#fff', px: 0.5 }
                }}
              >
                Decision
              </InputLabel>
              <Select
                labelId="agenda-status-label"
                id="agenda-status-select"
                value={selectedAgendaWithStatus || ''}
                label="Decision"
                onChange={(e) => setSelectedAgendaWithStatus(e.target.value)}
                disabled={loadingAgendas}
                sx={{ fontSize: '14px' }}
              >
                {loadingAgendas ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading...
                  </MenuItem>
                ) : !statuses || statuses.length === 0 ? (
                  <MenuItem disabled sx={{ fontSize: '14px' }}>
                    No statuses available
                  </MenuItem>
                ) : (
                  statuses.map((status) => (
                    <MenuItem key={status.status_id} value={status.status_id} sx={{ fontSize: '14px' }}>
                      {status.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Decision Description (Optional)"
          value={externalDecision}
          onChange={(e) => setExternalDecision(e.target.value)}
          sx={{
            '& .MuiInputBase-input': { fontSize: '14px' },
            '& .MuiInputLabel-root': { fontSize: '14px' }
          }}
        />

        {file && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              px: 1
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '75%'
              }}
            >
              {file.name}
            </Typography>
            <Button
              size="small"
              color="error"
              variant="text"
              onClick={() => setFile(null)}
              sx={{ textTransform: 'none', fontSize: '14px' }}
            >
              Remove
            </Button>
          </Box>
        )}
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

export default CaseDecisionDetail;
