import React, { useEffect, useState, useCallback } from 'react';
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
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import UploadIcon from '@mui/icons-material/Upload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { FaLessThan, FaPencilAlt, FaCalendarAlt } from 'react-icons/fa';
import informExpertService from '../../../service/informExpert.service';
import StatusWithAgendaService from '../../../service/status.service';
import { getStatusMeta } from '../../../utils/statusColors';
import InfoCardWrapper from '../components/InfoCardWrapper';
import CaseContentCardWrapper from '../components/CaseContentCardWrapper';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import WitnessSection from '../components/sections/WitnessSection';
import EvidenceAttachmentsSection from '../components/sections/EvidenceAttachmentsSection';
import ComplaintContentCard, { CaseTypeCommitteeSection } from '../components/ComplaintContentCard';
import InvestigationFilesCard from '../components/InvestigationFilesCard';
import { hasValue } from '../components/utils/caseInfoHelpers';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { InvestigationDocumentModal } from '../components/modals/InvestigationDocumentModal';
import CommonPreviewModal from '../components/CommonPreviewModal';
import { PencilIcon } from '@heroicons/react/24/solid';

export default function DepartmentAssignedCaseDetail() {
  const [openDoc, setOpenDoc] = useState(null);
  const [openIssuesModal, setOpenIssuesModal] = useState(false);
  const [openTextEvidenceModal, setOpenTextEvidenceModal] = useState(false);
  const [openCaseTextAttachmentModal, setOpenCaseTextAttachmentModal] = useState(false);
  const [currentCaseTextAttachment, setCurrentCaseTextAttachment] = useState(null);
  const [showExpertSubmitModal, setShowExpertSubmitModal] = useState(false);
  const [showCommitteeSubmitModal, setShowCommitteeSubmitModal] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [assignedCommittee, setAssignedCommittee] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [evidencesList, setEvidencesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // File attachment states
  const [fileDescription, setFileDescription] = useState('');
  const [expertDescription, setExpertDescription] = useState('');
  const [committeeDescription, setCommitteeDescription] = useState('');
  const [committeeDecisionId, setCommitteeDecisionId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [expertAttachments, setExpertAttachments] = useState([]);

  // User permission states
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [canSelectCase, setCanSelectCase] = useState(false);
  const [canAttachHeadFiles, setCanAttachHeadFiles] = useState(false);
  const [canAttachExpertFiles, setCanAttachExpertFiles] = useState(false);
  const [canViewAllFiles, setCanViewAllFiles] = useState(false);
  const [canInformExpert, setCanInformExpert] = useState(false);

  // UI state
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [selectLoading, setSelectLoading] = useState(false);
  // Add this to your existing permission states

  // For uploading new files
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Status with agenda states
  const [statuses, setStatuses] = useState([]);
  const [selectedAgendaWithStatus, setSelectedAgendaWithStatus] = useState('');
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Committee review state (replaces agenda decision)
  const [committeeReview, setCommitteeReview] = useState(null);
  const [loadingDecision, setLoadingDecision] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const case_id = location.state?.case_id;

  const handleSnackClose = () => setSnackOpen(false);
  const handleOpenDoc = (doc) => {
    if (doc && doc.file_url) {
      setOpenDoc({
        id: doc.evidence_id || doc.id,
        filename: doc.file_url?.replace(/^.*[\\/]/, '') || 'No File',
        file_url: doc.file_url,
        preview_url: doc.file_url,
        description: doc.description,
        file_status: doc.file_status
      });
    } else if (doc) {
      setOpenDoc({
        id: doc.evidence_id || doc.id,
        filename: 'Document',
        file_url: null,
        preview_url: null,
        description: doc.description,
        file_status: doc.file_status
      });
    }
  };
  const handleCloseDoc = () => setOpenDoc(null);
  const handleOpenIssues = () => setOpenIssuesModal(true);
  const handleCloseIssues = () => setOpenIssuesModal(false);
  const handleOpenTextEvidence = () => setOpenTextEvidenceModal(true);
  const handleCloseTextEvidence = () => setOpenTextEvidenceModal(false);

  // Navigation handlers for EvidencePreviewModal
  const [currentEvidenceIndex, setCurrentEvidenceIndex] = useState(0);
  const textEvidences = evidencesList.filter((doc) => !doc.file_url);
  const fileEvidences = evidencesList.filter((doc) => doc.file_url);

  const handlePreviousEvidence = () => {
    if (openDoc && openDoc.file_url) {
      const currentIndex = fileEvidences.findIndex((e) => e.id === openDoc.id || e.case_attachment_id === openDoc.case_attachment_id);
      if (currentIndex > 0) {
        const prevEvidence = fileEvidences[currentIndex - 1];
        handleOpenDoc(prevEvidence);
      }
    } else if (openTextEvidenceModal) {
      const currentIndex = textEvidences.findIndex((e) => e.id === currentEvidenceIndex);
      if (currentIndex > 0) {
        setCurrentEvidenceIndex(currentIndex - 1);
      }
    }
  };

  const handleNextEvidence = () => {
    if (openDoc && openDoc.file_url) {
      const currentIndex = fileEvidences.findIndex((e) => e.id === openDoc.id || e.case_attachment_id === openDoc.case_attachment_id);
      if (currentIndex < fileEvidences.length - 1) {
        const nextEvidence = fileEvidences[currentIndex + 1];
        handleOpenDoc(nextEvidence);
      }
    } else if (openTextEvidenceModal) {
      const currentIndex = textEvidences.findIndex((e) => e.id === currentEvidenceIndex);
      if (currentIndex < textEvidences.length - 1) {
        setCurrentEvidenceIndex(currentIndex + 1);
      }
    }
  };

  const handleOpenCaseAttachment = (att) => {
    if (att && (att.file_path || att.preview_url)) {
      setOpenDoc({
        id: att.id || att.case_attachment_id,
        filename: att.filename || att.file_name || 'Case Attachment',
        file_url: att.preview_url || att.file_path,
        preview_url: att.preview_url || att.file_path,
        description: att.description || '',
        file_status: att.file_status || 'pending'
      });
    }
  };

  // Add these state variables with your existing states
  const [caseTypes, setCaseTypes] = useState([]);
  const [selectedCaseType, setSelectedCaseType] = useState('');
  const [assignTypeLoading, setAssignTypeLoading] = useState(false);
  const [showCaseTypeModal, setShowCaseTypeModal] = useState(false);

  // Add this function to fetch case types
  const fetchCaseTypes = async () => {
    try {
      const response = await informExpertService.getCaseTypes();
      setCaseTypes(response.data || []);
    } catch (err) {
      console.error('Error fetching case types:', err);
      setSnackMessage('Failed to load case types');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  // Add this function to assign case type
  const handleAssignCaseType = async () => {
    if (!selectedCaseType) {
      setSnackMessage('Please select a case type');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    setAssignTypeLoading(true);
    try {
      const response = await informExpertService.assignCaseType(case_id, selectedCaseType);
      setSnackMessage(response?.message || 'Case type assigned successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      setShowCaseTypeModal(false);
      await fetchCaseDetail(); // Refresh case data
    } catch (err) {
      console.error('Assign case type error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to assign case type';
      setSnackMessage(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setAssignTypeLoading(false);
    }
  };

  // Add this effect to fetch case types when component mounts
  useEffect(() => {
    if (case_id && canSelectCase) {
      fetchCaseTypes();
    }
  }, [case_id, canSelectCase]);

  // Add this effect to fetch case types when component mounts
  useEffect(() => {
    if (case_id && canSelectCase) {
      fetchCaseTypes();
    }
  }, [case_id, canSelectCase]);

  const handleOpenCaseTextAttachment = (att) => {
    if (att && att.description && !att.file_path && !att.preview_url) {
      setCurrentCaseTextAttachment(att);
      setOpenCaseTextAttachmentModal(true);
    }
  };

  const handleCloseCaseTextAttachment = () => {
    setOpenCaseTextAttachmentModal(false);
    setCurrentCaseTextAttachment(null);
  };

  const handleOpenExpertAttachment = (att) => {
    if (att && (att.document_path || att.file_path || att.preview_url)) {
      setOpenDoc({
        id: att.id || att.expert_attachment_id,
        filename: att.filename || att.document_name || att.file_name || 'Expert Attachment',
        file_url: att.preview_url || att.document_path || att.file_path,
        preview_url: att.preview_url || att.document_path || att.file_path,
        description: att.description || '',
        file_status: att.document_status || att.file_status || 'pending'
      });
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('blob:')) return url;

    if (url.startsWith('C:/') || url.startsWith('/C:/') || url.includes(':\\')) {
      const filename = url.split(/[\\/]/).pop();
      return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}/api/inform/expert-documents/${filename}`;
    }

    if (url.startsWith('/expert-documents/')) {
      return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}/api/inform${url}`;
    }

    let normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    if (normalizedUrl.startsWith('/public/')) {
      normalizedUrl = normalizedUrl.replace('/public', '');
    }
    return `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${normalizedUrl}`;
  };

  // Get current user and permissions from localStorage
  const getCurrentUserAndPermissions = () => {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;

      if (user) {
        setCurrentUser(user);

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

        console.log('📋 Final extracted permissions:', permissions);
        setUserPermissions(permissions);

        const hasSelectCase = permissions.some((perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'select_case');
        setCanSelectCase(hasSelectCase);

        const hasAttachHeadFiles = permissions.some(
          (perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'attach_head_file'
        );
        setCanAttachHeadFiles(hasAttachHeadFiles);

        const hasAttachExpertFiles = permissions.some(
          (perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'attach_expert_file'
        );
        setCanAttachExpertFiles(hasAttachExpertFiles);

        const hasInformExpert = permissions.some((perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'inform_expert');
        setCanInformExpert(hasInformExpert);

        const hasSelectPermission = permissions.some((perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'select_case');
        setCanSelectCase(hasSelectPermission);
        const hasViewAllFiles = permissions.some((perm) => perm.resource === 'DepartmentCommittee' && perm.action === 'read');
        setCanViewAllFiles(hasViewAllFiles);
      }

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const fetchCaseDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!case_id) {
        setError('No case ID provided');
        setLoading(false);
        return;
      }

      const response = await informExpertService.getAssignedCaseDetail(case_id);
      const caseDataFromBackend = response.data?.data;
      console.log('📋 Case Data from API:', {
        caseType: caseDataFromBackend.caseType,
        case_type: caseDataFromBackend.case_type,
        caseTypeName: caseDataFromBackend.caseType?.name,
        hasCaseType: !!caseDataFromBackend.caseType
      });
      if (!caseDataFromBackend) {
        setError('Case not found');
        setLoading(false);
        return;
      }

      setCaseData(caseDataFromBackend);
      console.log('✅ Case type loaded:', {
        name: caseDataFromBackend.caseType?.name,
        id: caseDataFromBackend.case_type,
        fullObject: caseDataFromBackend.caseType
      });
      const user = getCurrentUserAndPermissions();

      // --- Complaint ---
      const fetchedComplaint = caseDataFromBackend.disciplinary_complaint || null;
      const normalizedEvidences = (fetchedComplaint?.evidences || []).map((doc) => ({
        ...doc,
        file_url: doc.file_url ? doc.file_url.replace(/\\/g, '/') : null,
        description: doc.description || 'No Description'
      }));
      setEvidencesList(normalizedEvidences);
      setComplaint(fetchedComplaint);

      // --- Assigned Committee ---
      const committee = caseDataFromBackend.assigned_committee_ref || null;
      const assignedExpert = caseDataFromBackend.assigned_expert_ref;
      console.log('asigned expertssssssssssssssssss', assignedExpert);
      setAssignedCommittee(committee);

      // --- Case Attachments ---
      const mappedAttachments = (caseDataFromBackend.attachments || []).map((a, idx) => {
        const normalizedPath = a.file_path ? a.file_path.replace(/\\/g, '/') : null;
        return {
          id: a.case_attachment_id || `att_${idx}`,
          case_attachment_id: a.case_attachment_id,
          filename: a.file_name || (normalizedPath ? normalizedPath.split('/').pop() : `attachment_${idx}`),
          file_name: a.file_name,
          file_path: a.file_path, // Preserve original file_path
          file_type: (normalizedPath || '').split('.').pop() || 'file',
          file_status: a.file_status || 'pending',
          description: a.description || null, // Preserve original description (null if not provided)
          preview_url: normalizedPath ? getFullFileUrl(normalizedPath) : null,
          type: 'case_attachment',
          uploaded_by: a.uploaded_by,
          uploaded_by_name: a.uploaded_by_name || 'Unknown'
        };
      });
      setAttachments(mappedAttachments);

      // --- Expert Attachments ---
      const mappedExpertAttachments = (caseDataFromBackend.expert_attachments || []).map((a, idx) => {
        const normalizedPath = a.document_path ? a.document_path.replace(/\\/g, '/') : null;
        return {
          id: a.expert_attachment_id || `expert_att_${idx}`,
          filename: a.document_name || (normalizedPath ? normalizedPath.split('/').pop() : `expert_attachment_${idx}`),
          file_type: (normalizedPath || '').split('.').pop() || 'file',
          file_status: a.document_status || 'pending',
          description: a.description || '',
          preview_url: normalizedPath ? getFullFileUrl(normalizedPath) : null,
          uploaded_at: a.createdAt,
          type: 'expert_attachment',
          uploaded_by: a.uploaded_by,
          uploaded_by_name: a.uploaded_by_name || 'Unknown'
        };
      });
      setExpertAttachments(mappedExpertAttachments);

      // Expert description UI removed
    } catch (err) {
      console.error('fetchCaseDetail error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitteeReview = useCallback(async () => {
    if (!case_id) {
      console.log('⚠️ fetchCommitteeReview: No case_id provided');
      return;
    }

    setLoadingDecision(true);
    try {
      console.log('🔍 Fetching committee review for case_id:', case_id);
      const response = await informExpertService.showCommitteReview(case_id);
      console.log('📋 Committee review response:', response);

      // The API returns { review: {...}, statusAgenda: {...} } structure
      if (response?.review) {
        console.log('✅ Committee review found:', response.review);
        console.log('✅ Status agenda found:', response.statusAgenda);
        // Store the entire response so we can access both review and statusAgenda
        setCommitteeReview({
          ...response.review,
          statusAgenda: response.statusAgenda
        });
      } else if (response?.success && response?.data) {
        console.log('✅ Committee review found (success/data structure):', response.data);
        setCommitteeReview(response.data);
      } else if (response?.data) {
        console.log('✅ Committee review found (direct data):', response.data);
        setCommitteeReview(response.data);
      } else if (response) {
        // Response might be the review object directly
        console.log('✅ Committee review found (response is review):', response);
        setCommitteeReview(response);
      } else {
        console.log('⚠️ No committee review found in response');
        setCommitteeReview(null);
      }
    } catch (err) {
      console.error('❌ Error fetching committee review:', err);
      console.error('Error details:', err.response?.data || err.message);
      // If 404 or not found, set to null (committee head hasn't sent yet)
      if (err.response?.status === 404) {
        console.log('ℹ️ Committee review not found (404) - committee head has not sent to council yet');
      }
      setCommitteeReview(null);
    } finally {
      setLoadingDecision(false);
    }
  }, [case_id]);

  useEffect(() => {
    if (!case_id) {
      setError('No case ID provided. Cannot fetch case details.');
      setLoading(false);
      return;
    }
    fetchCaseDetail();
  }, [case_id]);

  // Fetch statuses with agenda (only for committee head)
  useEffect(() => {
    const fetchStatusesWithAgenda = async () => {
      // Only fetch if user is committee head
      if (!canAttachHeadFiles) {
        return;
      }

      setLoadingStatuses(true);
      try {
        // Fetch all statuses with agenda using the /status-with-agenda endpoint
        const fetchedStatuses = await StatusWithAgendaService.getAllStatusesWithAgendas();
        console.log('📋 Raw fetched statuses with agenda:', fetchedStatuses);

        // Extract statuses list - handle different response structures
        let statusesList = [];
        if (Array.isArray(fetchedStatuses)) {
          statusesList = fetchedStatuses;
        } else if (fetchedStatuses && typeof fetchedStatuses === 'object') {
          statusesList = fetchedStatuses.data || fetchedStatuses.statuses || fetchedStatuses.result || [];
        }

        console.log('📋 Processed statuses with agenda list:', statusesList);
        setStatuses(statusesList);
      } catch (err) {
        console.error('❌ Error fetching statuses with agenda:', err);
        setSnackMessage('Failed to load statuses with agenda');
        setSnackSeverity('warning');
        setSnackOpen(true);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchStatusesWithAgenda();
  }, [canAttachHeadFiles]);

  // Debug: Log when committeeReview state changes
  useEffect(() => {
    console.log('🔍 Committee Review state updated:', committeeReview);
    console.log('🔍 Committee Review exists:', !!committeeReview);
    if (committeeReview) {
      console.log('🔍 Committee Review details:', committeeReview);
    }
  }, [committeeReview]);

  // Fetch committee review when permissions are set
  useEffect(() => {
    // Show committee review for:
    // - committee head (canAttachHeadFiles)
    // - experts (canAttachExpertFiles)
    // - users with read permission (canViewAllFiles)
    const canSeeReview = canAttachHeadFiles || canAttachExpertFiles || canViewAllFiles;

    if (case_id && canSeeReview && !loading) {
      console.log(
        '🔄 Fetching committee review - case_id:',
        case_id,
        'canAttachHeadFiles:',
        canAttachHeadFiles,
        'canAttachExpertFiles:',
        canAttachExpertFiles,
        'canViewAllFiles:',
        canViewAllFiles,
        'loading:',
        loading
      );
      fetchCommitteeReview();
    } else {
      console.log(
        '⏸️ Skipping committee review fetch - case_id:',
        case_id,
        'canAttachHeadFiles:',
        canAttachHeadFiles,
        'canAttachExpertFiles:',
        canAttachExpertFiles,
        'canViewAllFiles:',
        canViewAllFiles,
        'loading:',
        loading
      );
    }
  }, [case_id, canAttachHeadFiles, canAttachExpertFiles, canViewAllFiles, loading, fetchCommitteeReview]);

  // No filtering needed - show all statuses with agenda

  const handleUploadFiles = async (fileType = 'expert', overrides = {}) => {
    const descriptionOverride = overrides.description ?? fileDescription;
    const decisionOverride = overrides.decisionId ?? selectedAgendaWithStatus;
    if (uploadedFiles.length === 0) {
      setSnackMessage('Please select files to upload');
      setSnackSeverity('warning');
      setSnackOpen(true);
      return;
    }

    if (fileType === 'committee' && !canAttachHeadFiles) {
      setSnackMessage("You don't have permission to attach committee files");
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    if (fileType === 'expert' && !canAttachExpertFiles) {
      setSnackMessage("You don't have permission to attach expert files");
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    // For committee head, validate status with agenda is selected
    if (fileType === 'committee') {
      if (!decisionOverride) {
        setSnackMessage('Please select a Decision');
        setSnackSeverity('warning');
        setSnackOpen(true);
        return;
      }
    }

    setUploadLoading(true);
    try {
      // Step 1: Upload files
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('files', file.file);
      });

      const userRole = getUserRoleType();
      let descriptionWithType = '';
      if (fileType === 'committee') {
        descriptionWithType = `[COMMITTEE_HEAD] ${descriptionOverride || `Committee head files uploaded by ${currentUser?.full_name}`}`;
      } else {
        descriptionWithType = `[EXPERT] ${descriptionOverride || `Expert files uploaded by ${currentUser?.full_name}`}`;
      }
      descriptionWithType += ` [${userRole.toUpperCase()}]`;

      if (descriptionWithType) {
        formData.append('description', descriptionWithType);
      }

      const uploadResponse = await informExpertService.attachFilesToSelectedCase(case_id, formData);

      // Step 2: If committee head, also send agenda decision
      if (fileType === 'committee' && decisionOverride) {
        try {
          const decisionPayload = {
            interim_decision_id: decisionOverride,
            comment: descriptionOverride || null
          };

          await informExpertService.sendAgendaDecission(case_id, decisionPayload);
          setSnackMessage('Files uploaded and agenda decision submitted successfully');
          setSnackSeverity('success');
        } catch (decisionErr) {
          console.error('Error sending agenda decision:', decisionErr);
          // Still show success for file upload, but warn about decision
          const decisionErrMsg = decisionErr.response?.data?.message || decisionErr.message || 'Failed to submit agenda decision';
          setSnackMessage(`Files uploaded successfully, but failed to submit agenda decision: ${decisionErrMsg}`);
          setSnackSeverity('warning');
        }
      } else {
        setSnackMessage(uploadResponse?.message || `${fileType === 'committee' ? 'Committee' : 'Expert'} files uploaded successfully`);
        setSnackSeverity('success');
      }

      setSnackOpen(true);

      setUploadedFiles([]);
      setFileDescription('');
      setSelectedAgendaWithStatus('');
      setCommitteeDescription('');
      setCommitteeDecisionId('');
      await fetchCaseDetail();
      // Refresh committee review after submission
      if (fileType === 'committee' && canAttachHeadFiles) {
        await fetchCommitteeReview();
      }
    } catch (err) {
      console.error('Upload files error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to upload files';
      setSnackMessage(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSelectCase = async () => {
    if (!case_id) return;
    if (!canSelectCase) {
      setSnackMessage("You don't have permission to select cases");
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    setSelectLoading(true);
    try {
      const response = await informExpertService.selectCaseAndInformExperts(case_id);
      setSnackMessage(response?.message || 'Case selected and experts notified');
      setSnackSeverity('success');
      setSnackOpen(true);
      await fetchCaseDetail();
    } catch (err) {
      console.error('select case error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to select case';
      setSnackMessage(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setSelectLoading(false);
    }
  };

  const handleFileSelect = (eventOrFiles) => {
    let files = [];
    if (Array.isArray(eventOrFiles)) {
      files = eventOrFiles;
    } else if (eventOrFiles?.target?.files) {
      files = Array.from(eventOrFiles.target.files);
    }

    if (files.length === 0) return;

    if (!canAttachHeadFiles && !canAttachExpertFiles) {
      setSnackMessage("You don't have permission to attach any files");
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    const newFiles = files.map((file, i) => ({
      id: `temp_${Date.now()}_${i}`,
      filename: file.name,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file,
      preview_url: URL.createObjectURL(file),
      uploadType: canAttachHeadFiles ? 'committee' : 'expert' // Mark files based on user role
    }));
    setUploadedFiles((p) => [...p, ...newFiles]);
    if (event.target) {
      event.target.value = '';
    }
    setSnackMessage('Files added');
    setSnackSeverity('success');
    setSnackOpen(true);
  };

  /**
   * Handles file selection for expert attachments (Investigation Files card).
   * Accepts array of files directly from InvestigationFilesCard.
   */
  const handleExpertFileSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!canAttachExpertFiles) {
      setSnackMessage("You don't have permission to attach expert files");
      setSnackSeverity('error');
      setSnackOpen(true);
      return;
    }

    const newFiles = selectedFiles.map((file, i) => ({
      id: `temp_${Date.now()}_${i}`,
      filename: file.name,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file,
      preview_url: URL.createObjectURL(file),
      uploadType: 'expert' // Mark files as expert uploads
    }));
    setUploadedFiles((p) => [...p, ...newFiles]);
    setSnackMessage('Files added');
    setSnackSeverity('success');
    setSnackOpen(true);
  };

  const handleRemoveUploadedFile = (id) => {
    setUploadedFiles((p) => {
      const toRemove = p.find((f) => f.id === id);
      if (toRemove?.preview_url) URL.revokeObjectURL(toRemove.preview_url);
      return p.filter((f) => f.id !== id);
    });
    setSnackMessage('File removed');
    setSnackSeverity('info');
    setSnackOpen(true);
  };

  const handleOpenAttachment = (item) => {
    setOpenDoc({
      id: item.id,
      file_url: item.preview_url || item.file_url,
      description: item.description || item.filename,
      file_status: item.file_status || 'pending'
    });
  };

  const getUserRoleType = () => {
    if (canSelectCase && canAttachHeadFiles && canInformExpert) return 'committee_head';
    if (canAttachExpertFiles) return 'expert';
    return 'member';
  };

  // Helper to check if a file is staged (has File object)
  const isStagedFile = (file) => {
    return file && file.file instanceof File;
  };

  // Helper to transform file to InvestigationFilesCard format
  const transformFileForDisplay = (file, idx) => ({
    ...file, // Preserve all original properties
    case_attachment_id: file.id || file.case_attachment_id || file.expert_attachment_id || idx,
    file_path: file.preview_url || file.file_url || file.file_path || file.document_path,
    file_name: file.filename || file.file_name || file.document_name,
    name: file.filename || file.file_name || file.document_name || file.name,
    file_status: file.file_status || file.document_status || file.status || 'pending',
    size: file.file_size || file.size || file.file?.size || 0,
    file: file.file,
    canDelete: isStagedFile(file) ? true : !file.uploaded_by || file.uploaded_by === currentUser?.user_id
  });

  // Helper to transform evidence for display
  const transformEvidenceForDisplay = (evidence, idx) => ({
    ...evidence,
    case_attachment_id: evidence.id || evidence.evidence_id || idx,
    file_path: evidence.file_url || evidence.file_path,
    file_name: evidence.file_name || evidence.name || `Evidence ${idx + 1}`,
    name: evidence.file_name || evidence.name || `Evidence ${idx + 1}`,
    status: evidence.file_status || evidence.status
  });
  // Check if expert has uploaded files (for committee head workflow)
  const hasExpertUploadedFiles = () => {
    // Check if there are any expert attachments from any expert user
    const hasAnyExpertFiles = expertAttachments.length > 0;

    console.log('🔍 Expert upload status check:', {
      totalExpertAttachments: expertAttachments.length,
      hasAnyExpertFiles
    });

    return hasAnyExpertFiles;
  };
  const shouldHideUploadSection = () => {
    // If committee head has already sent to council (agenda decision exists), hide upload section
    if (canAttachHeadFiles && committeeReview) {
      console.log('�� Committee head has already sent to council, hiding upload section');
      return true;
    }

    if (canAttachExpertFiles) {
      const userExpertAttachments = expertAttachments.filter((attachment) => attachment.uploaded_by === currentUser?.user_id);
      const hasUploadedExpertFiles = userExpertAttachments.length > 0;
      return hasUploadedExpertFiles;
    }

    if (canAttachHeadFiles) {
      // Check for committee head attachments - must have [COMMITTEE_HEAD] tag AND be uploaded by current user
      const userHeadAttachments = attachments.filter((attachment) => {
        const isUploadedByUser = attachment.uploaded_by === currentUser?.user_id;
        const hasCommitteeHeadTag = attachment.description?.includes('[COMMITTEE_HEAD]');
        return isUploadedByUser && hasCommitteeHeadTag;
      });
      const hasUploadedHeadFiles = userHeadAttachments.length > 0;

      // Committee Head can only upload AFTER expert has uploaded files
      const canHeadUpload = hasExpertUploadedFiles();

      console.log('👑 Head upload check:', {
        hasHeadPermission: canAttachHeadFiles,
        currentUserId: currentUser?.user_id,
        allAttachments: attachments.length,
        attachmentsWithUploadedBy: attachments.map((a) => ({
          id: a.id,
          uploaded_by: a.uploaded_by,
          description: a.description?.substring(0, 50),
          hasCommitteeHeadTag: a.description?.includes('[COMMITTEE_HEAD]')
        })),
        userHeadAttachments: userHeadAttachments.length,
        userHeadAttachmentIds: userHeadAttachments.map((a) => a.id),
        hasExpertUploaded: canHeadUpload,
        committeeReviewExists: !!committeeReview,
        committeeReview: committeeReview,
        shouldHide: hasUploadedHeadFiles || !canHeadUpload || !!committeeReview
      });

      return hasUploadedHeadFiles || !canHeadUpload || !!committeeReview;
    }

    return true;
  };

  const getUploadPermissionDescription = () => {
    if (canAttachHeadFiles) {
      const userHeadAttachments = attachments.filter(
        (attachment) =>
          attachment.uploaded_by === currentUser?.user_id && (attachment.description?.includes('[COMMITTEE_HEAD]') || canAttachHeadFiles)
      );
      const hasUploaded = userHeadAttachments.length > 0;
      const waitingForExpert = !hasExpertUploadedFiles();

      if (waitingForExpert && !hasUploaded) {
        return `Committee Head Files: Waiting for expert to upload files first`;
      }

      return `Committee Head Files: Can upload once ${hasUploaded ? '(✓ Already uploaded)' : ''}`;
    }

    if (canAttachExpertFiles) {
      const userExpertAttachments = expertAttachments.filter((attachment) => attachment.uploaded_by === currentUser?.user_id);
      const hasUploaded = userExpertAttachments.length > 0;
      return `Expert Files: Can upload once ${hasUploaded ? '(✓ Already uploaded)' : ''}`;
    }

    return 'No upload permissions';
  };

  const UploadButtonsSection = () => {
    const hasUploaded = shouldHideUploadSection();

    // Only show one button based on permission
    if (canAttachHeadFiles) {
      return (
        <Button
          variant="contained"
          onClick={() => handleUploadFiles('committee')}
          disabled={uploadLoading || uploadedFiles.length === 0 || hasUploaded || !selectedAgendaWithStatus}
          startIcon={<UploadIcon />}
          sx={{ textTransform: 'none' }}
        >
          {uploadLoading ? 'Uploading...' : `Send to council`}
        </Button>
      );
    }

    if (canAttachExpertFiles) {
      return (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleUploadFiles('expert')}
          disabled={uploadLoading || uploadedFiles.length === 0 || hasUploaded}
          startIcon={<UploadIcon />}
          sx={{ textTransform: 'none' }}
        >
          {uploadLoading ? 'Uploading...' : `Send to Committee`}
        </Button>
      );
    }

    // Fallback - should not happen since canUploadAnyFiles is checked
    return null;
  };
  const getVisibleAttachments = () => {
    const userRole = getUserRoleType();
    if (userRole === 'committee_head') {
      return [...attachments, ...expertAttachments];
    }
    if (userRole === 'expert') {
      const nonHeadCaseAttachments = attachments.filter(
        (attachment) => !canAttachHeadFiles || attachment.uploaded_by !== currentUser?.user_id
      );
      const myExpertAttachments = expertAttachments.filter((attachment) => attachment.uploaded_by === currentUser?.user_id);
      return [...nonHeadCaseAttachments, ...myExpertAttachments];
    }
    const nonHeadCaseAttachments = attachments.filter(
      (attachment) => !canAttachHeadFiles || attachment.uploaded_by !== currentUser?.user_id
    );
    return nonHeadCaseAttachments;
  };

  /**
   * Returns attachments for the "Organized Document" card.
   * Logic:
   * - If committeeReview exists AND user is committee head: return committee head files only
   * - Otherwise: return non-committee-head case attachments
   * - Apply role-based visibility filtering
   */
  const getOrganizedDocumentAttachments = () => {
    // "File Organizer" files = Original Case Attachments (excluding Committee Head specifically tagged files)
    const nonCommitteeHeadAttachments = attachments.filter((att) => !att.description?.includes('[COMMITTEE_HEAD]'));

    // Apply role-based visibility
    const userRole = getUserRoleType();
    let visibleAttachments = nonCommitteeHeadAttachments;

    if (userRole === 'expert' || userRole === 'member') {
      // Experts/Members don't see things they shouldn't (though nonCommitteeHeadAttachments is likely what they interpret as "File Organizer")
      // For now, keep the filter broad: Expert shouldn't see files they uploaded as "Committee Head"? (Impossible scenario usually)
      // The original logic filtered by uploaded_by !== currentUser.user_id if !canAttachHeadFiles
      visibleAttachments = nonCommitteeHeadAttachments.filter(
        (attachment) => !canAttachHeadFiles || attachment.uploaded_by !== currentUser?.user_id
      );
    }

    return visibleAttachments.map((file) => ({
      ...transformFileForDisplay(file),
      canDelete: false // Enforce: Committee Head (and others) cannot delete files from the "File Organizer"
    }));
  };

  /**
   * Returns expert attachments for the "Investigation Files" card.
   * Logic:
   * - Committee head: sees all expert attachments (only after expert uploads)
   * - Expert: sees only their own expert attachments
   * - Member: doesn't see expert attachments (returns empty array)
   */
  const getInvestigationFilesAttachments = () => {
    const userRole = getUserRoleType();

    if (userRole === 'expert') {
      // Expert sees only their own expert attachments
      const myExpertAttachments = expertAttachments.filter((attachment) => attachment.uploaded_by === currentUser?.user_id);
      return myExpertAttachments.map(transformFileForDisplay);
    } else if (userRole === 'committee_head') {
      // Committee head sees all expert attachments (but only after expert has uploaded)
      // This is handled by visibility logic in shouldShowInvestigationFiles()
      return expertAttachments.map(transformFileForDisplay);
    }

    // Member doesn't see expert attachments
    return [];
  };

  /**
   * Determines if the Investigation Files card should be displayed.
   * Logic:
   * - Expert: always show (they need to see their files section)
   * - Committee head: only show after expert has uploaded files (return trip)
   * - Member: never show
   */
  const shouldShowInvestigationFiles = () => {
    if (canAttachExpertFiles) {
      // Expert always sees their investigation files section
      return true;
    }

    if (canAttachHeadFiles) {
      // Committee head only sees investigation files after expert uploads (return trip)
      return hasExpertUploadedFiles();
    }

    // Members don't see investigation files
    return false;
  };

  const canUploadAnyFiles = canAttachHeadFiles || canAttachExpertFiles;
  const stagedCommitteeFiles = uploadedFiles.filter((f) => f.uploadType === 'committee' && isStagedFile(f));

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" align="center" mt={5}>
        {error}
      </Typography>
    );

  if (!caseData)
    return (
      <Typography align="center" mt={5}>
        Case not found
      </Typography>
    );

  const { case_number, createdAt, committee_priority, status } = caseData;
  // Separate case status and customer status
  const caseStatus = status || null;
  const customerStatus = complaint?.status || null;
  const isSelected = committee_priority === 'selected_for_meeting';
  const isCommitteeDecided = status === 'committe decided';
  console.log({
    isSelected,
    committee_priority,
    complaint_status: complaint.status,
    status
  });
  const hasCommitteePriority = !!committee_priority;
  const isDecisionSubmitted = !!committeeReview;
  const visibleAttachments = getVisibleAttachments();

  // Field computation logic
  const judgeFields = (() => {
    const fields = [];
    if (hasValue(case_id)) {
      const complaintId = case_id?.substring(0, 8).toUpperCase();
      fields.push({ label: 'Report ID', value: complaintId, color: theme.palette.primary.main });
    }
    if (hasValue(complaint?.judge_name)) {
      fields.push({ label: 'Judge Name', value: complaint.judge_name });
    }
    if (hasValue(complaint?.court_office)) {
      fields.push({ label: 'Court Office', value: complaint.court_office });
    }
    if (hasValue(complaint?.file_number)) {
      fields.push({ label: 'Case File Number', value: complaint.file_number });
    }
    return fields;
  })();

  // Prepare sections for ComplaintContentCard
  const sections = (() => {
    const detailedDescription = complaint?.issues?.length ? complaint.issues.map((i) => i.description).join('\n\n') : null;
    return [{ title: 'Detailed Description', content: detailedDescription }].filter((section) => section.content);
  })();

  // Prepare witnesses
  const preparedWitnesses =
    complaint?.witnesses?.map((w) => ({
      name: w.witness_name,
      phone: w.witness_phone_number || 'N/A'
    })) || [];

  // Prepare evidence attachments
  const evidenceAttachments = evidencesList.map((e, i) => ({
    ...e,
    name: e.file_name || e.name || `Evidence ${i + 1}`,
    status: e.file_status || e.status
  }));

  // Status label computation
  const statusLabel = (() => {
    const statusToMap = caseStatus || customerStatus;
    if (!statusToMap) return null;
    const meta = getStatusMeta(theme, statusToMap);
    return meta.label;
  })();
  const fadeVariant = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
  const typographyStyles = { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#041f36' };
  const canEditOrganizedDocs = canUploadAnyFiles && !shouldHideUploadSection() && getUserRoleType() !== 'expert';

  return (
    <>
      <Box
        sx={{
          py: { xs: 2, md: 2 },
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
                {/* <Box
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
                </Box> */}
                <Typography
                  variant="h4"
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: theme.palette.primary.main, fontSize: '22px' }}
                >
                  Department Assigned Case
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '14px',
                  color: '#A3AED0'
                }}
              >
                {isSelected ? 'Case selected for committee meeting' : 'Review and manage assigned case details'}
              </Typography>
            </Box>

            {/* Header Actions */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {canAttachHeadFiles && isSelected && hasCommitteePriority && !isDecisionSubmitted && (
                <Tooltip
                  title={
                    !hasExpertUploadedFiles()
                      ? 'Waiting for expert to upload files first'
                      : stagedCommitteeFiles.length === 0
                        ? 'Please add files before submitting'
                        : ''
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      onClick={() => setShowCommitteeSubmitModal(true)}
                      disabled={!hasExpertUploadedFiles() || stagedCommitteeFiles.length === 0}
                      startIcon={<UploadIcon />}
                      sx={{
                        px: 2.5,
                        py: 0.5,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        borderRadius: 1,
                        fontWeight: 600,
                        minHeight: '36.5px',
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.main, opacity: 0.85 },
                        '&:disabled': { backgroundColor: theme.palette.primary.main, opacity: 0.5 }
                      }}
                    >
                      Send to council
                    </Button>
                  </span>
                </Tooltip>
              )}
              {canSelectCase && !isSelected && !isCommitteeDecided && (
                <>
                  {/* Assign Case Type Button */}
                  <Button
                    variant="contained"
                    onClick={() => setShowCaseTypeModal(true)}
                    disabled={selectLoading || assignTypeLoading}
                    startIcon={<FaPencilAlt />}
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      minWidth: 100,
                      backgroundColor: '#007BFF99',
                      minHeight: '36.5px'
                    }}
                  >
                    {caseData?.caseType ? 'Change Case Type' : 'Select Case Type'}
                  </Button>

                  {/* Select Case Button - Only enabled when case type is assigned */}
                  <Button
                    variant="contained"
                    onClick={handleSelectCase}
                    disabled={selectLoading || !caseData?.caseType || isSelected}
                    startIcon={selectLoading ? <CircularProgress size={16} /> : <FaCalendarAlt />}
                    sx={{
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 1,
                      fontWeight: 600,
                      minWidth: 100,
                      minHeight: '36.5px'
                    }}
                  >
                    {selectLoading ? 'Selecting...' : 'Schedule Meeting'}
                  </Button>
                </>
              )}
              {/* Submit Button for Experts */}
              {canAttachExpertFiles && !shouldHideUploadSection() && (
                <Tooltip
                  title={
                    uploadedFiles.filter((f) => f.uploadType === 'expert' && isStagedFile(f)).length === 0
                      ? 'Please add files before submitting'
                      : ''
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      onClick={() => setShowExpertSubmitModal(true)}
                      disabled={uploadedFiles.filter((f) => f.uploadType === 'expert' && isStagedFile(f)).length === 0}
                      startIcon={<UploadIcon />}
                      sx={{
                        px: 2.5,
                        py: 0.5,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        borderRadius: 1,
                        fontWeight: 600,
                        minHeight: '36.5px',
                        backgroundColor: theme.palette.statusButtons.accept,
                        '&:hover': { backgroundColor: theme.palette.statusButtons.accept, opacity: 0.8 },
                        '&:disabled': { backgroundColor: theme.palette.statusButtons.accept, opacity: 0.5 }
                      }}
                    >
                      Submit
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={5}>
          {/* LEFT COLUMN - CaseInfoCard Component */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column">
            <InfoCardWrapper grow={true}>
              <CaseInfoSection
                judgeInfo={{
                  caseStatus: caseStatus,
                  complaintId: case_id,
                  judgeName: complaint?.judge_name,
                  courtOffice: complaint?.court_office,
                  caseFileNumber: complaint?.file_number
                }}
                fields={judgeFields}
                caseStatusLabel={statusLabel}
                showComplainantStatus={false}
              />
              {preparedWitnesses.length > 0 && <WitnessSection witnesses={preparedWitnesses} />}
              <EvidenceAttachmentsSection attachments={evidenceAttachments} showEvidenceStatus={false} onViewAttachment={handleOpenDoc} />
            </InfoCardWrapper>
          </Grid>

          {/* RIGHT COLUMN - CaseContentCard */}
          <Grid item xs={12} md={6} display="flex" flexDirection="column">
            <CaseContentCardWrapper>
              <ComplaintContentCard sections={sections} decisionProps={{ hasRecommendation: false }} renderDecision={false} />
              <CaseTypeCommitteeSection caseType={caseData?.caseType} assignedCommittee={assignedCommittee} />
              <InvestigationFilesCard
                title="Organized Document"
                files={
                  canAttachHeadFiles && hasExpertUploadedFiles()
                    ? []
                    : uploadedFiles.filter((f) => f.uploadType === 'committee' && isStagedFile(f))
                }
                attachments={getOrganizedDocumentAttachments()}
                canEdit={canEditOrganizedDocs}
                onSelectFiles={handleFileSelect}
                onViewFile={(file) => {
                  // Organized document files are case attachments (may include committee head files)
                  // Check if it's a text-only attachment (no file_path)
                  if (file.file_path || file.preview_url) {
                    handleOpenCaseAttachment(file);
                  } else if (file.description) {
                    // Text-only case attachment
                    handleOpenCaseTextAttachment(file);
                  } else {
                    handleOpenCaseAttachment(file);
                  }
                }}
                onRemoveFile={(idx, file) => {
                  const fileId = file?.id ?? idx;
                  const fileToRemove = uploadedFiles.find((f, index) => f.id === fileId || index === idx);
                  if (fileToRemove) {
                    handleRemoveUploadedFile(fileToRemove.id);
                  }
                }}
                onStageDelete={(attachmentId) => {
                  const fileToRemove = uploadedFiles.find(
                    (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                  );
                  if (fileToRemove && isStagedFile(fileToRemove)) {
                    handleRemoveUploadedFile(fileToRemove.id);
                  }
                }}
                onStageReplace={(attachmentId, newFile) => {
                  const fileToReplace = uploadedFiles.find(
                    (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                  );
                  if (fileToReplace && isStagedFile(fileToReplace)) {
                    setUploadedFiles((prev) => {
                      const updated = prev.map((file) => {
                        if (file.id === fileToReplace.id) {
                          if (file.preview_url && file.preview_url.startsWith('blob:')) {
                            URL.revokeObjectURL(file.preview_url);
                          }
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
                  }
                }}
                hideUploadActions={
                  canAttachExpertFiles ||
                  !canUploadAnyFiles ||
                  shouldHideUploadSection() ||
                  (canAttachHeadFiles && hasExpertUploadedFiles())
                }
                showUploadButton={false}
                isBulkUploading={false}
                stagedDeletes={new Set()}
                stagedReplaces={new Map()}
                selectedAttachments={new Set()}
                onUnstage={() => {}}
                onToggleSelection={() => {}}
                onSelectAll={() => {}}
                onBulkStageDelete={() => {}}
                onSaveChanges={() => {}}
                onCancelChanges={() => {}}
              />

              {shouldShowInvestigationFiles() && (
                <InvestigationFilesCard
                  title="Investigation Files"
                  files={uploadedFiles.filter((f) => f.uploadType === 'expert' && isStagedFile(f))}
                  attachments={getInvestigationFilesAttachments()}
                  canEdit={canAttachExpertFiles && !shouldHideUploadSection()}
                  onSelectFiles={handleExpertFileSelect}
                  onViewFile={(file) => {
                    // Expert attachments may have document_path or preview_url
                    if (file.file_path || file.document_path || file.preview_url) {
                      handleOpenExpertAttachment(file);
                    } else if (file.description && !file.file_path && !file.document_path && !file.preview_url) {
                      // Text-only expert attachment
                      handleOpenExpertAttachment(file);
                    } else {
                      handleOpenExpertAttachment(file);
                    }
                  }}
                  onRemoveFile={(_idx, file) => {
                    // Only allow removal of staged files (expert files are server-persisted)
                    // Use the passed file object directly if available, otherwise fallback (though we expect file now)
                    const fileId = file?.id || _idx; // Fallback is arguably wrong if _idx is index not ID, but intended usage is ID.
                    // Fallback logic or if we just passed an ID (not likely with new change but safe)
                    const fileToRemove = uploadedFiles.find((f) => f.id === fileId);
                    if (fileToRemove && isStagedFile(fileToRemove)) {
                      handleRemoveUploadedFile(fileId);
                    }
                  }}
                  onStageDelete={(attachmentId) => {
                    // Handle staged file deletion
                    const fileToRemove = uploadedFiles.find(
                      (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                    );
                    if (fileToRemove && isStagedFile(fileToRemove)) {
                      handleRemoveUploadedFile(fileToRemove.id);
                    }
                  }}
                  onStageReplace={(attachmentId, newFile) => {
                    // Handle staged file replacement
                    const fileToReplace = uploadedFiles.find(
                      (file) => file.id === attachmentId || file.id?.toString() === attachmentId?.toString()
                    );
                    if (fileToReplace && isStagedFile(fileToReplace)) {
                      setUploadedFiles((prev) => {
                        const updated = prev.map((file) => {
                          if (file.id === fileToReplace.id) {
                            if (file.preview_url && file.preview_url.startsWith('blob:')) {
                              URL.revokeObjectURL(file.preview_url);
                            }
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
                    }
                  }}
                  hideUploadActions={!canAttachExpertFiles}
                  showUploadButton={false}
                  isBulkUploading={false}
                  stagedDeletes={new Set()}
                  stagedReplaces={new Map()}
                  selectedAttachments={new Set()}
                  onUnstage={() => {}}
                  onToggleSelection={() => {}}
                  onSelectAll={() => {}}
                  onBulkStageDelete={() => {}}
                  onSaveChanges={() => {}}
                  onCancelChanges={() => {}}
                  // onViewInvestigationDoc removed as it's redundant/incorrect
                />
              )}

              {/* Committee Response Section - Show on Return Trip (Head + Expert Uploaded + Not Sent) */}
              {canAttachHeadFiles && hasExpertUploadedFiles() && !committeeReview && (
                <Box sx={{ mt: 2 }}>
                  <InvestigationFilesCard
                    title="Committee Additional Files"
                    files={stagedCommitteeFiles}
                    attachments={[]} // Assuming we only show new uploads here. Or we could show committeeHeadFileAttachments if we wanted.
                    canEdit={true}
                    onSelectFiles={handleFileSelect}
                    onRemoveFile={(idx, file) => {
                      const fileId = file?.id || idx;
                      // Ensure we look up by ID if possible
                      const fileToRemove = uploadedFiles.find((f, index) => f.id === fileId || index === idx);
                      if (fileToRemove) handleRemoveUploadedFile(fileToRemove.id);
                    }}
                    hideUploadActions={false}
                    showUploadButton={false}
                    isBulkUploading={false}
                    stagedDeletes={new Set()}
                    stagedReplaces={new Map()}
                    selectedAttachments={new Set()}
                    onUnstage={() => {}}
                    onToggleSelection={() => {}}
                    onSelectAll={() => {}}
                    onBulkStageDelete={() => {}}
                    onSaveChanges={() => {}}
                    onCancelChanges={() => {}}
                    onViewFile={handleOpenCaseAttachment}
                  />
                </Box>
              )}

              {/* Committee Review Section - Show after sending to council */}
              {committeeReview && (
                <Box sx={{ mt: 2 }}>
                  {/* 1. Files First - Using InvestigationFilesCard for consistent look */}
                  <InvestigationFilesCard
                    title="Committee Head Files"
                    files={[]}
                    attachments={(() => {
                      // Gather all Committee Head files
                      const headFileAttachments = attachments.filter(
                        (att) => att.description?.includes('[COMMITTEE_HEAD]') && (att.file_path || att.preview_url)
                      );
                      const headTextAttachments = attachments.filter(
                        (att) =>
                          att.description?.includes('[COMMITTEE_HEAD]') &&
                          att.description &&
                          att.description !== null &&
                          att.description !== '' &&
                          !att.file_path &&
                          !att.preview_url
                      );
                      const headExpertAttachments = expertAttachments.filter((att) => att.description?.includes('[COMMITTEE_HEAD]'));
                      // Transform for display
                      const fileAtts = headFileAttachments.map(transformFileForDisplay);
                      const textAtts = headTextAttachments.map(transformFileForDisplay);
                      const expertAtts = headExpertAttachments.map(transformFileForDisplay);

                      return [...fileAtts, ...textAtts, ...expertAtts];
                    })()}
                    canEdit={false} // Read-only
                    hideUploadActions={true}
                    onViewFile={(file) => {
                      if (file.expert_attachment_id) handleOpenExpertAttachment(file);
                      else if (file.file_path || file.preview_url) handleOpenCaseAttachment(file);
                      else handleOpenCaseTextAttachment(file);
                    }}
                  />

                  {/* 2. Decision Details Card */}
                  <Card sx={{ mt: 2, borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#041f36', fontSize: '16px', mb: 1 }}>
                        Committee Decision
                      </Typography>
                      <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.12)' }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '14px', mb: 0.5 }}>
                          Decision Type
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{committeeReview.statusAgenda?.name || 'N/A'}</Typography>
                          {committeeReview.updated_once && <Chip label="Final" size="small" color="success" variant="outlined" />}
                        </Box>
                        {committeeReview.comment && (
                          <Typography
                            sx={{
                              mt: 0.5,
                              fontSize: '13px',
                              color: 'text.secondary',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {committeeReview.comment}
                          </Typography>
                        )}
                      </Box>

                      {(committeeReview.reviewed_at || committeeReview.created_at) && (
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Submitted on: {new Date(committeeReview.reviewed_at || committeeReview.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </CaseContentCardWrapper>
          </Grid>
        </Grid>
        {/* Department / Committee */}

        {/* Case Type Assignment Modal */}
        <Modal
          open={showCaseTypeModal}
          onClose={() => setShowCaseTypeModal(false)}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            sx={{
              width: { xs: '95%', sm: 400 },
              bgcolor: '#fff',
              borderRadius: 4,
              p: 3
            }}
          >
            <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              Assign Case Type
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="case-type-label">Case Type</InputLabel>
              <Select
                labelId="case-type-label"
                value={selectedCaseType}
                label="Case Type"
                onChange={(e) => setSelectedCaseType(e.target.value)}
              >
                {caseTypes.length === 0 ? (
                  <MenuItem disabled>Loading case types...</MenuItem>
                ) : (
                  caseTypes.map((type) => (
                    <MenuItem key={type.case_type_id} value={type.case_type_id}>
                      {type.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCaseTypeModal(false)} disabled={assignTypeLoading} sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAssignCaseType}
                disabled={assignTypeLoading || !selectedCaseType}
                sx={{ textTransform: 'none' }}
              >
                {assignTypeLoading ? 'Assigning...' : 'Assign Type'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Committee Submit Modal */}
        <Modal
          open={showCommitteeSubmitModal}
          onClose={() => {
            setShowCommitteeSubmitModal(false);
            setCommitteeDescription('');
            setCommitteeDecisionId('');
          }}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            sx={{
              width: { xs: '95%', sm: 420 },
              bgcolor: '#fff',
              borderRadius: 4,
              p: 3
            }}
          >
            <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              Send to Council
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="committee-decision-label">Decision</InputLabel>
              <Select
                labelId="committee-decision-label"
                value={committeeDecisionId || ''}
                label="Decision"
                onChange={(e) => setCommitteeDecisionId(e.target.value)}
                disabled={loadingStatuses}
              >
                {loadingStatuses ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading...
                  </MenuItem>
                ) : !statuses || statuses.length === 0 ? (
                  <MenuItem disabled>No statuses with agenda available</MenuItem>
                ) : (
                  statuses.map((status) => (
                    <MenuItem key={status.status_id} value={status.status_id}>
                      {status.name || 'Unnamed Status'}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={committeeDescription || ''}
              onChange={(e) => setCommitteeDescription(e.target.value)}
              placeholder="Add description (optional)"
              label="Description (Optional)"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowCommitteeSubmitModal(false);
                  setCommitteeDescription('');
                  setCommitteeDecisionId('');
                }}
                disabled={uploadLoading}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await handleUploadFiles('committee', { description: committeeDescription, decisionId: committeeDecisionId });
                  setShowCommitteeSubmitModal(false);
                  setCommitteeDescription('');
                  setCommitteeDecisionId('');
                }}
                disabled={uploadLoading || !committeeDecisionId || !hasExpertUploadedFiles() || stagedCommitteeFiles.length === 0}
                startIcon={<UploadIcon />}
                sx={{
                  textTransform: 'none',
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.main, opacity: 0.85 },
                  '&:disabled': { backgroundColor: theme.palette.primary.main, opacity: 0.5 }
                }}
              >
                {uploadLoading ? 'Sending...' : 'Send to Council'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Expert Submit Modal */}
        <Modal
          open={showExpertSubmitModal}
          onClose={() => {
            setShowExpertSubmitModal(false);
            setExpertDescription('');
          }}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            sx={{
              width: { xs: '95%', sm: 400 },
              bgcolor: '#fff',
              borderRadius: 4,
              p: 3
            }}
          >
            <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              Send to Committee
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={4}
              value={expertDescription || ''}
              onChange={(e) => setExpertDescription(e.target.value)}
              placeholder="Add description (optional)"
              label="Description"
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowExpertSubmitModal(false);
                  setExpertDescription('');
                }}
                disabled={uploadLoading}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={async () => {
                  setFileDescription(expertDescription);
                  await handleUploadFiles('expert');
                  setShowExpertSubmitModal(false);
                  setExpertDescription('');
                }}
                disabled={uploadLoading || uploadedFiles.filter((f) => f.uploadType === 'expert' && isStagedFile(f)).length === 0}
                sx={{
                  textTransform: 'none',
                  backgroundColor: theme.palette.statusButtons.accept,
                  '&:hover': { backgroundColor: theme.palette.statusButtons.accept, opacity: 0.8 },
                  '&:disabled': { backgroundColor: theme.palette.statusButtons.accept, opacity: 0.5 }
                }}
              >
                {uploadLoading ? 'Sending...' : 'Send to Committee'}
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Issues Modal */}
        <Modal
          open={openIssuesModal}
          onClose={handleCloseIssues}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            sx={{
              width: { xs: '95%', sm: '85%', md: '70%' },
              maxWidth: 800,
              bgcolor: '#fff',
              borderRadius: 4,
              p: { xs: 3, sm: 4 },
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              Complaint Issues
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {complaint?.issues?.length ? (
              <List>
                {complaint.issues.map((issue, index) => (
                  <ListItem
                    key={issue.issue_id || index}
                    sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Issue #{index + 1}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{issue.description}</Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" align="center">
                No issues found
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button variant="contained" onClick={handleCloseIssues} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Text Evidence Modal */}
        <AnimatePresence>
          {openTextEvidenceModal && (
            <Modal open onClose={handleCloseTextEvidence} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                sx={{
                  width: { xs: '95%', sm: '85%', md: '70%' },
                  maxWidth: 900,
                  bgcolor: '#fff',
                  borderRadius: 4,
                  p: { xs: 3, sm: 4 },
                  maxHeight: '92vh',
                  overflow: 'auto'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" align="center" sx={{ fontWeight: 700, flex: 1 }}>
                    Text Evidence
                  </Typography>
                  {evidencesList?.filter((doc) => !doc.file_url).length > 0 &&
                    evidencesList.filter((doc) => !doc.file_url)[0]?.file_status && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {evidencesList.filter((doc) => !doc.file_url)[0].file_status === 'verified' && (
                          <Tooltip title="Verified" arrow>
                            <CheckCircleIcon sx={{ color: 'green' }} />
                          </Tooltip>
                        )}
                        {evidencesList.filter((doc) => !doc.file_url)[0].file_status === 'rejected' && (
                          <Tooltip title="Rejected" arrow>
                            <CancelIcon sx={{ color: 'red' }} />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                </Box>
                {evidencesList?.filter((doc) => !doc.file_url).length > 0 ? (
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: { xs: 200, md: 300 },
                      border: '1px solid #ddd',
                      borderRadius: 2,
                      p: 3,
                      backgroundColor: '#f8f9fa',
                      mb: 3
                    }}
                  >
                    <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {evidencesList.filter((doc) => !doc.file_url)[0]?.description || 'No description'}
                    </Typography>
                  </Box>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                    No text evidence found
                  </Typography>
                )}
                <Typography align="center" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  Review the evidence carefully.
                </Typography>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Case Text Attachment Modal */}
        <InvestigationDocumentModal openDoc={currentCaseTextAttachment} onClose={handleCloseCaseTextAttachment} />

        {/* Document Preview Modal */}
        {openDoc && openDoc.file_url && <CommonPreviewModal file={openDoc} onClose={handleCloseDoc} />}
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
