import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Modal,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { RequestPage } from '@mui/icons-material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import fileOrganizerService from '../../../service/fileOrganizer.service';
import authService from '../../../service/auth.service';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import ComplaintContentCard from '../components/ComplaintContentCard';
import InvestigationFilesCard from '../components/InvestigationFilesCard';
import { hasValue } from '../components/utils/caseInfoHelpers';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { InvestigationDocumentModal } from '../components/modals/InvestigationDocumentModal';
import CommonPreviewModal from '../components/CommonPreviewModal';
import { FaLessThan, FaHistory } from 'react-icons/fa';
import { useTheme } from '@mui/material';
import { getStatusMeta } from '../../../utils/statusColors';

export default function DisciplinaryDetailPage() {
  const theme = useTheme();
  const [openDoc, setOpenDoc] = useState(null);
  const [dispComplaint, setDispComplaint] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [assignedCommittee, setAssignedCommittee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docStatus, setDocStatus] = useState({});
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [evidencesList, setEvidencesList] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [courtOffice, setCourtOffice] = useState(null);

  // Additional features for FileOrganizerExpert
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [expertDescription, setExpertDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [expandedTextEvidence, setExpandedTextEvidence] = useState({});
  const [isExpertDescExpanded, setIsExpertDescExpanded] = useState(false);
  const [expandedIssueDesc, setExpandedIssueDesc] = useState({});
  const [openExpertDescModal, setOpenExpertDescModal] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Investigation file modal states
  const [openInvestigationDoc, setOpenInvestigationDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Helper to check if a file is staged (has File object)
  const isStagedFile = (file) => {
    return file && file.file instanceof File;
  };

  // Helper to transform file to InvestigationFilesCard format
  const transformFileForDisplay = (file, idx) => ({
    case_attachment_id: file.id || idx,
    file_path: file.preview_url || file.file_url || file.file_path,
    file_name: file.filename || file.file_name,
    name: file.filename || file.file_name,
    file_status: file.file_status || 'pending',
    size: file.file_size || file.file?.size || 0,
    file: file.file,
    canDelete: isStagedFile(file) ? true : !file.uploaded_by || file.uploaded_by === currentUserId
  });

  // Helper to transform evidence for display
  const transformEvidenceForDisplay = (evidence, idx) => ({
    ...evidence,
    name: evidence.file_name || evidence.name || `Evidence ${idx + 1}`,
    status: evidence.file_status || evidence.status
  });

  const hasPermission = (resource, action) => permissions.some((p) => p.resource === resource && p.action === action);

  const canFileOrganize = hasPermission('JudiciaryInvestigationDirectorate', 'fileOrganize');

  const handleSnackClose = () => setSnackOpen(false);

  const navigate = useNavigate();
  const location = useLocation();
  console.log('location', location.state);
  const disp_id = location.state?.caseId || location.state?.case_id || location.state?.disp_id;
  const navSuccessMessage = location.state?.successMessage;
  const caseId = location.state?.caseId;
  console.log('caseId', caseId);

  const handleOpenDoc = (doc) => setOpenDoc(doc);
  const handleCloseDoc = () => setOpenDoc(null);

  const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // First, normalize backslashes to forward slashes
    let normalizedUrl = url.replace(/\\/g, '/');

    // Ensure URL starts with a forward slash
    if (!normalizedUrl.startsWith('/')) {
      normalizedUrl = `/${normalizedUrl}`;
    }

    // Remove 'public/' prefix if it exists since server serves from /uploads/ directly
    if (normalizedUrl.startsWith('/public/')) {
      normalizedUrl = normalizedUrl.replace('/public', '');
    }

    return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${normalizedUrl}`;
  };

  const fetchCaseDetail = async () => {
    try {
      if (!caseId) {
        setError('No case ID found');
        setLoading(false);
        return;
      }

      const detailResponse = await fileOrganizerService.getAssignedDisciplinaryRequestById(caseId);
      const caseData = detailResponse.data;
      const complaint = caseData.disciplinary_complaint;

      // Set complaint details
      setDispComplaint(complaint);

      // Issues / Evidences
      const sortedEvs = [...(complaint?.evidences || [])].sort((a, b) => (a.file_url || '').localeCompare(b.file_url || ''));
      setEvidencesList(sortedEvs);

      // Case meta
      setCaseData(caseData);

      const courtOffice = caseData.courtOfficeRequest || {};
      setCourtOffice(courtOffice);

      // Committee assigned
      setAssignedCommittee(caseData.assigned_committee || null);

      // Attachments
      const evList = [];
      let expertDesc = '';

      if (Array.isArray(caseData.attachments)) {
        caseData.attachments.forEach((a, idx) => {
          if (a.file_name === 'expert_description.txt') {
            expertDesc = a.description || '';
          } else {
            const fullUrl = getFullFileUrl(a.file_path);
            evList.push({
              id: a.case_attachment_id || `att_${idx}`,
              filename: a.file_name,
              file_type: (a.file_path || '').split('.').pop(),
              preview_url: fullUrl,
              description: a.description || '',
              file_status: a.file_status || 'pending'
            });
          }
        });
      }

      setExpertDescription(expertDesc);
      setUploadedFiles(evList);
    } catch (err) {
      console.error('Error fetching case detail:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [caseId]);

  // Load user permissions
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (!token) {
          setPermissions([]);
          setPermissionsLoading(false);
          return;
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
        setCurrentUserId(userId);

        // Try to get from localStorage first
        const stored = localStorage.getItem('permissions');
        if (stored) {
          setPermissions(JSON.parse(stored));
          setPermissionsLoading(false);
        }

        // Always fetch fresh from API to ensure we have latest permissions
        try {
          const response = await authService.getPermissionsByUserId(userId);
          const freshPermissions = response.data.permissions || [];
          setPermissions(freshPermissions);
          localStorage.setItem('permissions', JSON.stringify(freshPermissions));
        } catch (error) {
          console.error('Error fetching permissions:', error);
          // If API fails but we have stored permissions, use those
          if (stored) {
            setPermissions(JSON.parse(stored));
          }
        } finally {
          setPermissionsLoading(false);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions([]);
        setPermissionsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Show success toast if navigated with a success message (from Get Files page)
  useEffect(() => {
    if (navSuccessMessage) {
      setSnackMessage(navSuccessMessage);
      setSnackSeverity('success');
      setSnackOpen(true);
    }
  }, [navSuccessMessage]);

  const handleAssignToCommittee = async () => {
    setAssignLoading(true);
    try {
      const formData = new FormData();

      // Append all staged files
      uploadedFiles.forEach((fileObj) => {
        if (fileObj.file) {
          formData.append('files', fileObj.file);
        }
      });

      // Optional description
      if (expertDescription?.trim()) {
        formData.append('expert_description', expertDescription.trim());
      }

      const response = await fileOrganizerService.assignToCommittee(caseId, formData);

      if (response?.error) throw new Error(response.error);

      // Small delay to ensure server has processed the uploaded files
      await new Promise((resolve) => setTimeout(resolve, 500));

      await fetchCaseDetail(); // refresh case details - this will populate uploadedFiles with server files

      setSnackMessage(response.message || 'Complaint assigned to committee successfully.');
      setSnackSeverity('success');
      setSnackOpen(true);

      // Note: Don't clear uploadedFiles here - fetchCaseDetail() already populated it with server files
      // Only clear expertDescription if it was a new entry (not from server)
      // The fetchCaseDetail will set expertDescription from server, so we can clear it if it was user input
      setExpertDescription('');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to assign to committee. Please try again.';

      console.error('Assign to Committee Error:', err);

      setSnackMessage(errorMsg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRequestDocuments = async () => {
    try {
      await fileOrganizerService.requestCourtOfficeDocuments(caseId);
      setSnackMessage('Documents requested from court office');
      setSnackSeverity('success');
      setSnackOpen(true);
      fetchCaseDetail();
    } catch (error) {
      console.error('Error requesting documents:', error);
      setSnackMessage('Failed to request documents');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await fileOrganizerService.removeAttachment(attachmentId);
      setSnackMessage('Attachment removed successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      fetchCaseDetail();
    } catch (error) {
      console.error('Error removing attachment:', error);
      setSnackMessage('Failed to remove attachment');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  // File upload handlers - Support multiple files
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create file objects for all selected files
    const newFiles = files.map((selectedFile, index) => ({
      id: `temp_${Date.now()}_${index}`,
      filename: selectedFile.name,
      file_type: selectedFile.type || 'application/octet-stream',
      file_size: selectedFile.size,
      file: selectedFile,
      preview_url: URL.createObjectURL(selectedFile)
    }));

    // Append to existing files
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setSnackMessage(`${files.length} file(s) added successfully.`);
    setSnackSeverity('success');
    setSnackOpen(true);

    // Reset the input
    event.target.value = '';
  };

  const handleSubmitFile = async () => {
    // Direct submission without modal
    await handleAssignToCommittee();
  };

  const handleRemoveUploadedFile = (fileId) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((file) => file.id === fileId);
      if (fileToRemove && fileToRemove.preview_url) {
        URL.revokeObjectURL(fileToRemove.preview_url);
      }
      return prev.filter((file) => file.id !== fileId);
    });
    setSnackMessage('File removed successfully');
    setSnackSeverity('success');
    setSnackOpen(true);
  };

  const handleOpenUploadedFile = (file) => {
    setOpenDoc({
      evidence_id: file.id,
      file_url: file.preview_url,
      description: file.filename,
      file_status: file.file_status || 'pending',
      file_type: file.file_type || (file.filename ? file.filename.split('.').pop() : '')
    });
  };

  // Investigation file modal handlers
  const handleOpenInvestigationDoc = (doc) => {
    setOpenInvestigationDoc(doc);
  };

  const handleCloseInvestigationDoc = () => {
    setOpenInvestigationDoc(null);
  };

  const handlePreviewFile = (fileOrAttachment) => {
    setPreviewFile(fileOrAttachment);
  };

  const handleClosePreviewFile = () => {
    setPreviewFile(null);
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

  const { applicant, issues, evidences, judge_name, court_office, file_number, status, attachments: pendingAttachments } = dispComplaint;

  const { court_office_document_request_status = 'none', court_office_request_reason = '' } = courtOffice;

  // Separate case status and customer status
  const caseStatus = caseData?.status || null;

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
    const detailedDescription = issues?.length ? issues.map((i) => i.description).join('\n\n') : 'No issues documented.';
    return [
      { title: 'Detailed Description', content: detailedDescription }
    ].filter((section) => section.content);
  })();

  // Prepare evidence attachments
  const evidenceAttachments = evidencesList.map((e, i) => ({
    ...e,
    name: e.file_name || e.name || `Text Evidence ${i + 1}`,
    status: e.file_status || e.status
  }));
  const customerStatus = status;
  const assignedName = assignedCommittee?.name || dispComplaint?.assigned_committee?.name;
  const displayCaseNumber = caseData?.case_number || file_number;

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

  const statusMeta = getStatusMeta(theme, caseStatus || status);

  const handlePrevious = () => {
    if (!openDoc) return;
    const currentIndex = evidencesList.findIndex((e) => e.id === openDoc.id || e.case_attachment_id === openDoc.case_attachment_id);
    if (currentIndex > 0) {
      setOpenDoc(evidencesList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!openDoc) return;
    const currentIndex = evidencesList.findIndex((e) => e.id === openDoc.id || e.case_attachment_id === openDoc.case_attachment_id);
    if (currentIndex < evidencesList.length - 1) {
      setOpenDoc(evidencesList[currentIndex + 1]);
    }
  };

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
                  Disciplinary File Organization
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
                Organize and submit file documents for committee review.
              </Typography>
            </Box>

            {/* Header Actions */}
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

              {/* Attach Doc Button */}
              {canFileOrganize && !assignedCommittee && (
                <>
                  <input type="file" id="header-file-input" style={{ display: 'none' }} onChange={handleFileSelect} accept="*/*" multiple />
                  <label htmlFor="header-file-input">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<AttachFileIcon />}
                      sx={{
                        px: 2.5,
                        py: 0.5,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        borderRadius: 1,
                        fontWeight: 600,
                        minWidth: 100,
                        minHeight: '36.5px',
                        backgroundColor: '#007BFF99',
                        color: '#fff',
                        '&:hover': { backgroundColor: '#005BFF', color: '#fff' }
                      }}
                    >
                      Attach File
                    </Button>
                  </label>
                  {/* remove the secondary condition to let the file organizer re-request files from the court office after already getting files */}
                  {court_office_document_request_status !== 'pending' &&
                  (court_office_document_request_status === 'none' || court_office_document_request_status === 'returned_empty') ? (
                    <Button
                      onClick={handleRequestDocuments}
                      startIcon={<RequestPage />}
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
                        color: '#fff',
                        '&:hover': { backgroundColor: theme.palette.statusButtons.return, color: '#fff' }
                      }}
                    >
                      Request File
                    </Button>
                  ) : (
                    <Chip
                      label={
                        court_office_document_request_status === 'pending'
                          ? 'Documents Requested'
                          : court_office_document_request_status === 'fulfilled'
                            ? 'Documents Received'
                            : 'Request Status: ' + court_office_document_request_status
                      }
                      color={
                        court_office_document_request_status === 'pending'
                          ? 'warning'
                          : court_office_document_request_status === 'fulfilled'
                            ? 'success'
                            : 'default'
                      }
                      variant="outlined"
                      sx={{ height: 40, alignItems: 'center' }}
                    />
                  )}

                  {/* Submit Action */}
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmitFile}
                    disabled={assignLoading || uploadedFiles.length === 0}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      minWidth: 100,
                      minHeight: '36.5px',
                      boxShadow: uploadedFiles.length === 0 ? 'none' : '0 4px 12px rgba(46, 204, 113, 0.3)'
                    }}
                  >
                    Submit File
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
          {/* LEFT SIDE */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column">
            <InfoCardWrapper grow={true}>
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

          {/* RIGHT SIDE */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column">
            {/* Court Office Pending Attachments - if any */}
            {pendingAttachments && pendingAttachments.length > 0 && (
              <Card sx={{ borderRadius: '12px', p: 3, backgroundColor: '#fff', border: '1px solid #E0E0E0', boxShadow: 'none' }}>
                <Typography sx={{ fontFamily: "'Montserrat', sans-serif", color: '#215167', fontSize: '18px', fontWeight: 600, mb: 2 }}>
                  Court Office Documents
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {pendingAttachments.map((file) => (
                    <Paper
                      key={file.case_attachment_id}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f0f7ff',
                        border: '1px solid #cce5ff',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '310px'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFileIcon color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {file.file_name}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => window.open(getFullFileUrl(file.file_path), '_blank')} color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Card>
            )}
            <CaseContentCardWrapper grow={true}>
              <ComplaintContentCard sections={sections} decisionProps={{ hasRecommendation: false }} renderDecision={false} />
              <InvestigationFilesCard
                files={[]}
                attachments={(() => {
                  // Combine all files
                  const allFiles = [...uploadedFiles.map(transformFileForDisplay), ...evidencesList.map(transformEvidenceForDisplay)];

                  // Deduplicate by case_attachment_id or file_path
                  const seen = new Set();
                  return allFiles.filter((file) => {
                    const key = file.case_attachment_id || file.file_path || file.id;
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                })()}
                canEdit={canFileOrganize && !assignedCommittee }
                isBulkUploading={false}
                title="Document Attachments"
                hideUploadActions={true}
                showUploadButton={false}
                onSelectFiles={(files) => {
                  if (files.length > 0) {
                    const file = files[0];
                    const fileData = {
                      id: Date.now(),
                      filename: file.name,
                      file_type: file.type || file.name.split('.').pop(),
                      file_url: URL.createObjectURL(file), // Preview URL
                      file: file
                    };
                    setUploadedFiles([fileData]);
                  }
                }}
                onViewFile={(file) => {
                  if (file instanceof File) {
                    handlePreviewFile(file);
                  } else {
                    if (canFileOrganize && !assignedCommittee) {
                      handlePreviewFile(file);
                    } else {
                      handleOpenInvestigationDoc(file);
                    }
                  }
                }}
                onRemoveFile={(index) => {
                  // InvestigationFilesCard passes index
                  const fileToRemove = uploadedFiles[index];
                  if (fileToRemove) handleRemoveUploadedFile(fileToRemove.id);
                }}
                onStageDelete={(attachmentId) => {
                  // Find the file in uploadedFiles by id or case_attachment_id
                  const fileToRemove = uploadedFiles.find(
                    (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                  );
                if (fileToRemove) {
                  // If it's a staged file (has file property), remove it directly
                  if (isStagedFile(fileToRemove)) {
                    handleRemoveUploadedFile(fileToRemove.id);
                  }
                  // For server files, staging for deletion would go here if needed
                }
              }}
              onStageReplace={(attachmentId, newFile) => {
                // Find the file in uploadedFiles
                const fileToReplace = uploadedFiles.find(
                  (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                );
                if (fileToReplace && isStagedFile(fileToReplace)) {
                  // Replace staged file
                  setUploadedFiles((prev) => {
                    const updated = prev.map((file) => {
                      if (file.id === fileToReplace.id) {
                        // Revoke old blob URL
                        if (file.preview_url && file.preview_url.startsWith('blob:')) {
                          URL.revokeObjectURL(file.preview_url);
                        }
                        // Create new file object
                        return {
                          ...file,
                          file: newFile,
                          filename: newFile.name,
                          file_type: newFile.type || newFile.name.split('.').pop(),
                          file_size: newFile.size,
                          preview_url: URL.createObjectURL(newFile)
                        };
                      }
                      return file;
                    });
                    return updated;
                  });
                  setSnackMessage('File replaced successfully');
                  setSnackSeverity('success');
                  setSnackOpen(true);
                }
              }}
                stagedDeletes={new Set()}
                stagedReplaces={new Map()}
                selectedAttachments={new Set()}
                onUnstage={() => {}}
                onToggleSelection={() => {}}
                onSelectAll={() => {}}
                onBulkStageDelete={() => {}}
                onSaveChanges={() => {}}
                onCancelChanges={() => {}}
                onViewInvestigationDoc={handleOpenInvestigationDoc}
              />
            </CaseContentCardWrapper>
          </Grid>
        </Grid>

        {/* Modals */}
        <EvidencePreviewModal
          open={!!(openDoc && openDoc.file_url)}
          onClose={handleCloseDoc}
          evidences={evidencesList}
          currentEvidence={openDoc}
          currentDocIndex={
            openDoc ? evidencesList.findIndex((e) => e.id === openDoc.id || e.case_attachment_id === openDoc.case_attachment_id) : 0
          }
          evidenceSrc={openDoc?.file_url ? getFullFileUrl(openDoc.file_url) : null}
          isImageEvidence={openDoc?.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)}
          canManageEvidence={false}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        {/* Text Evidence Modal (Simplified) */}
        <AnimatePresence>
          {openDoc && !openDoc.file_url && (
            <Modal
              open={true}
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
                sx={{
                  position: 'relative',
                  width: { xs: '95%', sm: '80%', md: '60%' },
                  maxWidth: 800,
                  bgcolor: '#ffffff',
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  p: { xs: 3, sm: 4 },
                  outline: 'none',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                <Typography variant="h6" align="center" sx={{ fontWeight: 700, color: '#1f2a38', mb: 2 }}>
                  Text Evidence Detail
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#fafafa',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    fontSize: '1rem',
                    color: '#333',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {openDoc.description || 'No content.'}
                </Box>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Expert Description Modal */}
        <AnimatePresence>
          {openExpertDescModal && (
            <Modal
              open={openExpertDescModal}
              onClose={() => setOpenExpertDescModal(false)}
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
                <Typography
                  variant="h6"
                  align="center"
                  sx={{ fontWeight: 700, color: '#1f2a38', mb: 2, mt: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                >
                  Expert Description
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#495057' }}>{expertDescription}</Typography>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Investigation File Modals */}
        <InvestigationDocumentModal openDoc={openInvestigationDoc} onClose={handleCloseInvestigationDoc} />
        <CommonPreviewModal file={previewFile} onClose={handleClosePreviewFile} />
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
