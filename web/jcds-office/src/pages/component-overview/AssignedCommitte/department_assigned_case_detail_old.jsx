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
import informExpertService from '../../../service/informExpert.service';
import StatusWithAgendaService from '../../../service/status.service';
import DisciplinaryDetailLeftCard from '../component/disciplinary-detail';

export default function DepartmentAssignedCaseDetail() {
  const [openDoc, setOpenDoc] = useState(null);
  const [openIssuesModal, setOpenIssuesModal] = useState(false);
  const [openTextEvidenceModal, setOpenTextEvidenceModal] = useState(false);
  const [openCaseTextAttachmentModal, setOpenCaseTextAttachmentModal] = useState(false);
  const [currentCaseTextAttachment, setCurrentCaseTextAttachment] = useState(null);
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
    if (att && (att.document_path || att.preview_url)) {
      setOpenDoc({
        id: att.id || att.expert_attachment_id,
        filename: att.filename || att.document_name || 'Expert Attachment',
        file_url: att.preview_url || att.document_path,
        preview_url: att.preview_url || att.document_path,
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

  const handleUploadFiles = async (fileType = 'expert') => {
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
      if (!selectedAgendaWithStatus) {
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
        descriptionWithType = `[COMMITTEE_HEAD] ${fileDescription || `Committee head files uploaded by ${currentUser?.full_name}`}`;
      } else {
        descriptionWithType = `[EXPERT] ${fileDescription || `Expert files uploaded by ${currentUser?.full_name}`}`;
      }
      descriptionWithType += ` [${userRole.toUpperCase()}]`;

      if (descriptionWithType) {
        formData.append('description', descriptionWithType);
      }

      const uploadResponse = await informExpertService.attachFilesToSelectedCase(case_id, formData);

      // Step 2: If committee head, also send agenda decision
      if (fileType === 'committee' && selectedAgendaWithStatus) {
        try {
          const decisionPayload = {
            interim_decision_id: selectedAgendaWithStatus,
            comment: fileDescription || null
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

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
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
      preview_url: URL.createObjectURL(file)
    }));
    setUploadedFiles((p) => [...p, ...newFiles]);
    event.target.value = '';
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

  const canUploadAnyFiles = canAttachHeadFiles || canAttachExpertFiles;

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
  const hasCommitteePriority = !!committee_priority;
  const visibleAttachments = getVisibleAttachments();
  const fadeVariant = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
  const typographyStyles = { fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#041f36' };

  return (
    <>
      <Box sx={{ padding: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <Button sx={{ mb: 3, color: '#1976d2', textTransform: 'none' }} onClick={() => navigate(-1)}>
          {'< Back to List'}
        </Button>

        <Grid container spacing={5}>
          {/* LEFT COLUMN - Reused DisciplinaryDetailLeftCard Component */}
          <Grid item xs={12} md={6}>
            <AnimatePresence>
              <motion.div initial="hidden" animate="visible" variants={fadeVariant}>
                <DisciplinaryDetailLeftCard
                  applicant={complaint?.applicant}
                  judgeName={complaint?.judge_name}
                  courtOffice={complaint?.court_office}
                  fileNumber={complaint?.file_number}
                  caseStatus={caseStatus}
                  customerStatus={customerStatus}
                  issues={complaint?.issues}
                  evidencesList={evidencesList}
                  onOpenIssues={handleOpenIssues}
                  onOpenTextEvidence={handleOpenTextEvidence}
                  onOpenDoc={handleOpenDoc}
                />
              </motion.div>
              {/* Add this section where you want to show the case type assignment and selection */}
              {/* {canSelectCase && !isSelected && ( */}
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                <Typography variant="h6" sx={{ mb: 1, color: '#0369a1' }} gutterBottom>
                  Case Selection
                </Typography>

                {/* Show current case type if assigned */}
                {caseData?.caseType && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Current Case Type:
                    </Typography>
                    <Chip label={caseData.caseType.name} color="primary" size="small" />
                  </Box>
                )}
                {!isSelected && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {/* Assign Case Type Button */}
                    <Button
                      variant="outlined"
                      onClick={() => setShowCaseTypeModal(true)}
                      disabled={selectLoading}
                      startIcon={<CheckCircleIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      {caseData?.caseType ? 'Change Case Type' : 'Assign Case Type'}
                    </Button>

                    {/* Select Case Button - Only enabled when case type is assigned */}
                    <Button
                      variant="contained"
                      onClick={handleSelectCase}
                      disabled={selectLoading || !caseData?.caseType}
                      startIcon={selectLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      {selectLoading ? 'Selecting...' : 'Select Case for Meeting'}
                    </Button>
                  </Box>
                )}
                {/* Warning message if case type not assigned */}
                {!caseData?.caseType && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'warning.main', fontStyle: 'italic' }}>
                    * Case type must be assigned before selecting the case
                  </Typography>
                )}
                {isSelected && (
                  <Box sx={{ mt: 3, p: 2, backgroundColor: '#d1fae5', borderRadius: 2, border: '1px solid #a7f3d0' }}>
                    <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                      Case already selected for meeting
                    </Typography>
                    {caseData?.assigned_expert_ref && (
                      <Typography variant="body2" sx={{ color: '#047857', mt: 0.5 }}>
                        Expert assigned: {caseData.assigned_expert_ref.full_name}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              {/* )} */}
            </AnimatePresence>
            <AnimatePresence>
              <motion.div initial="hidden" animate="visible" variants={fadeVariant}>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ ...typographyStyles }} gutterBottom>
                      Department / Committee
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {assignedCommittee ? (
                      <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, mb: 1.5 }}>
                          <Typography fontWeight={600} color="text.secondary">
                            Assigned To:
                          </Typography>
                          <Typography fontWeight={600} color="text.primary">
                            {assignedCommittee.name}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                          <Typography
                            sx={{
                              backgroundColor: 'rgba(46,204,113,0.1)',
                              color: '#27ae60',
                              px: 2.5,
                              py: 1,
                              borderRadius: 2
                            }}
                          >
                            Assigned
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                        <Typography color="text.secondary">Not assigned to a department yet</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </Grid>

          {/* RIGHT COLUMN - Case Attachments and Expert Attachments Card */}
          <Grid item xs={12} md={6}>
            <AnimatePresence>
              <motion.div initial="hidden" animate="visible" variants={fadeVariant}>
                <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                  <CardContent sx={{ p: 2.0 }}>
                    {/* Case Attachments Section - Exclude committee head files */}
                    {(() => {
                      // Filter out committee head files (they'll be shown separately)
                      const nonCommitteeHeadAttachments = attachments.filter((att) => !att.description?.includes('[COMMITTEE_HEAD]'));

                      const caseFileAttachments = nonCommitteeHeadAttachments.filter((att) => att.file_path || att.preview_url);
                      const caseTextAttachments = nonCommitteeHeadAttachments.filter(
                        (att) => att.description && att.description !== null && att.description !== '' && !att.file_path && !att.preview_url
                      );

                      return (caseFileAttachments.length > 0 || caseTextAttachments.length > 0) && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="h6" sx={{ ...typographyStyles }} gutterBottom>
                                Case Attachments
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  ...fadeVariant,
                                  color: 'text.secondary',
                                  fontStyle: 'normal',
                                  fontSize: '0.85rem',
                                  mt: -0.5,
                                }}
                                gutterBottom
                              >
                                Organized files from Judiciary Investigation Director
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                  borderRadius: 1,
                                  px: 1.5,
                                  py: 0.5,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: 0.3 }}
                                >
                                  Case Number:
                                </Typography>
                                {case_number && (
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      color: 'primary.main',
                                      fontWeight: 700,
                                      fontSize: '1rem',
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    {case_number}
                                  </Typography>
                                )}

                              </Box>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                  borderRadius: 1,
                                  px: 1.5,
                                  py: 0.5,
                                }}
                              >
                                <Typography variant="body2">
                                  Assigned to: {caseData.assigned_committee_ref?.name || 'Not assigned'}
                                </Typography>

                              </Box>
                            </Box>

                          </Box>
                          <Divider sx={{ mb: 1 }} />
                          <List sx={{ mb: 1 }}>
                            {/* File Attachments */}
                            {caseFileAttachments.length > 0 ? (
                              caseFileAttachments.map((att) => (
                                <ListItem
                                  key={att.id || att.case_attachment_id}
                                  button
                                  onClick={() => handleOpenCaseAttachment(att)}
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
                                    primary={att.filename || att.file_name || "File Attachment"}
                                    secondary={att.description || "No Description"}
                                    sx={{ wordBreak: "break-word" }}
                                  />
                                  <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                                    <AttachFileIcon sx={{ color: "#1976d2", mr: 1 }} />
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
                              ))
                            ) : null}
                            
                            {/* Text Attachments */}
                            {caseTextAttachments.length > 0 ? (
                              caseTextAttachments.map((att, index) => (
                                <ListItem
                                  key={att.id || att.expert_attachment_id}
                                  button
                                  onClick={() => handleOpenExpertAttachment(att)}
                                  sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    backgroundColor: '#f8f9fa',
                                    '&:hover': { backgroundColor: '#e9ecef' },
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1
                                  }}
                                >
                                  <ListItemText
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                    primary={att.filename || att.document_name || 'Expert Attachment'}
                                    sx={{ wordBreak: 'break-word' }}
                                  />
                                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                    <AttachFileIcon sx={{ color: '#ff9800', mr: 1 }} />
                                    {att.file_status === 'approved' || att.document_status === 'approved' ? (
                                      <Tooltip title="Approved" arrow>
                                        <CheckCircleIcon sx={{ color: 'green' }} />
                                      </Tooltip>
                                    ) : null}
                                    {att.file_status === 'rejected' || att.document_status === 'rejected' ? (
                                      <Tooltip title="Rejected" arrow>
                                        <CancelIcon sx={{ color: 'red' }} />
                                      </Tooltip>
                                    ) : null}
                                  </Box>
                                </ListItem>
                              ))
                            ) : null}
                            </List>
                          </>
                        );
                    })()}

                    {/* Committee Head Summary - Show after sending to council */}
                    {canAttachHeadFiles && committeeReview && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        {/* <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                          <Typography variant="h6" sx={{ ...typographyStyles, mb: 1, color: '#1565c0' }} gutterBottom>
                            ✓ Committee Head Submission Complete
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            You have successfully sent this case to council. Below are the files you uploaded and the decision you made.
                          </Typography>
                        </Box> */}

                        {/* Committee Head Uploaded Files */}
                        {(() => {
                          // Filter committee head files from case attachments
                          const committeeHeadFileAttachments = attachments.filter(
                            (att) => att.description?.includes('[COMMITTEE_HEAD]') && (att.file_path || att.preview_url)
                          );
                          const committeeHeadTextAttachments = attachments.filter(
                            (att) =>
                              att.description?.includes('[COMMITTEE_HEAD]') &&
                              att.description &&
                              att.description !== null &&
                              att.description !== '' &&
                              !att.file_path &&
                              !att.preview_url
                          );

                          // Filter committee head expert attachments
                          const committeeHeadExpertAttachments = expertAttachments.filter((att) =>
                            att.description?.includes('[COMMITTEE_HEAD]')
                          );

                          return (
                            (committeeHeadFileAttachments.length > 0 ||
                              committeeHeadTextAttachments.length > 0 ||
                              committeeHeadExpertAttachments.length > 0) && (
                              <>
                                <Typography variant="h6" sx={{ ...typographyStyles, mb: 1 }} gutterBottom>
                                  Committee Head Files
                                </Typography>
                                <Divider sx={{ mb: 1 }} />
                                <List sx={{ mb: 1 }}>
                                  {/* Committee Head File Attachments */}
                                  {committeeHeadFileAttachments.map((att) => (
                                    <ListItem
                                      key={att.id || att.case_attachment_id}
                                      button
                                      onClick={() => handleOpenCaseAttachment(att)}
                                      sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        backgroundColor: '#e3f2fd',
                                        '&:hover': { backgroundColor: '#bbdefb' },
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1
                                      }}
                                    >
                                      <ListItemText
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                        primary={att.filename || att.file_name || 'Committee Head File'}
                                        sx={{ wordBreak: 'break-word' }}
                                      />
                                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        <AttachFileIcon sx={{ color: '#1565c0', mr: 1 }} />
                                        {att.file_status === 'approved' && (
                                          <Tooltip title="Approved" arrow>
                                            <CheckCircleIcon sx={{ color: 'green' }} />
                                          </Tooltip>
                                        )}
                                        {att.file_status === 'rejected' && (
                                          <Tooltip title="Rejected" arrow>
                                            <CancelIcon sx={{ color: 'red' }} />
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
                                      onClick={() => handleOpenCaseTextAttachment(att)}
                                      sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        backgroundColor: '#e3f2fd',
                                        '&:hover': { backgroundColor: '#bbdefb' },
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1
                                      }}
                                    >
                                      <ListItemText
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                        primary="Committee Head Text Attachment"
                                        secondary={
                                          att.description?.replace('[COMMITTEE_HEAD]', '').trim()
                                            ? att.description.replace('[COMMITTEE_HEAD]', '').trim().length > 50
                                              ? att.description.replace('[COMMITTEE_HEAD]', '').trim().substring(0, 50) + '...'
                                              : att.description.replace('[COMMITTEE_HEAD]', '').trim()
                                            : 'No Description'
                                        }
                                        sx={{ wordBreak: 'break-word' }}
                                      />
                                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {att.file_status === 'approved' && (
                                          <Tooltip title="Approved" arrow>
                                            <CheckCircleIcon sx={{ color: 'green' }} />
                                          </Tooltip>
                                        )}
                                        {att.file_status === 'rejected' && (
                                          <Tooltip title="Rejected" arrow>
                                            <CancelIcon sx={{ color: 'red' }} />
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
                                      onClick={() => handleOpenExpertAttachment(att)}
                                      sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        backgroundColor: '#e3f2fd',
                                        '&:hover': { backgroundColor: '#bbdefb' },
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 1
                                      }}
                                    >
                                      <ListItemText
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                        primary={att.filename || att.document_name || 'Committee Head File'}
                                        sx={{ wordBreak: 'break-word' }}
                                      />
                                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        <AttachFileIcon sx={{ color: '#1565c0', mr: 1 }} />
                                        {att.file_status === 'approved' || att.document_status === 'approved' ? (
                                          <Tooltip title="Approved" arrow>
                                            <CheckCircleIcon sx={{ color: 'green' }} />
                                          </Tooltip>
                                        ) : null}
                                        {att.file_status === 'rejected' || att.document_status === 'rejected' ? (
                                          <Tooltip title="Rejected" arrow>
                                            <CancelIcon sx={{ color: 'red' }} />
                                          </Tooltip>
                                        ) : null}
                                      </Box>
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            )
                          );
                        })()}
                      </>
                    )}

                    {/* Committee Review Section - Show after sending to council */}
                    {committeeReview && (
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
                            backgroundColor: '#f8f9fa',
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
                                {committeeReview.updated_once && <Chip label="Final" size="small" color="success" variant="outlined" />}
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
                          {(() => {
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

                            if (
                              committeeHeadFileAttachments.length === 0 &&
                              committeeHeadTextAttachments.length === 0 &&
                              committeeHeadExpertAttachments.length === 0
                            ) {
                              return null;
                            }

                            return (
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
                                      onClick={() => handleOpenCaseAttachment(att)}
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
                                      onClick={() => handleOpenCaseTextAttachment(att)}
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
                                      onClick={() => handleOpenExpertAttachment(att)}
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
                            );
                          })()}
                        </Paper>
                      </>
                    )}

                    {/* File Upload Section */}
                    {isSelected && hasCommitteePriority && canUploadAnyFiles && !shouldHideUploadSection() && !(canAttachHeadFiles && committeeReview) && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ border: '1px dashed #ddd', borderRadius: 2, p: 2, backgroundColor: '#fafafa' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            {/* Upload Files */}
                            {canAttachHeadFiles && (
                              <Chip label="Committee Case Reviewed File" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                            {canAttachExpertFiles && <Chip label="Expert Files" size="small" color="secondary" sx={{ ml: 1 }} />}
                          </Typography>

                          {/* Upload File Button - Show First */}
                          <input type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} id="file-upload" />
                          <label htmlFor="file-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<UploadIcon />}
                              sx={{ textTransform: 'none', mb: 2 }}
                              disabled={shouldHideUploadSection()}
                            >
                              {shouldHideUploadSection() ? 'Already Uploaded' : 'Upload File'}
                            </Button>
                          </label>

                          {/* Show File Description and Decision only after files are uploaded */}
                          {uploadedFiles && uploadedFiles.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Selected Files ({uploadedFiles.length}):
                              </Typography>
                              {uploadedFiles.map((f) => (
                                <Paper
                                  key={f.id}
                                  sx={{
                                    p: 1.5,
                                    mb: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#f8f9fa'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <AttachFileIcon />
                                    <Typography sx={{ fontWeight: 500 }}>{f.filename}</Typography>
                                    <Chip label={f.file_type} size="small" variant="outlined" sx={{ ml: 1 }} />
                                  </Box>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveUploadedFile(f.id)}
                                    disabled={shouldHideUploadSection()}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Paper>
                              ))}

                              {/* File Description - Show after files are uploaded */}
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={fileDescription || ''}
                                onChange={(e) => setFileDescription(e.target.value)}
                                placeholder="Add description (optional)"
                                label=" Description"
                                sx={{ mb: 2, mt: 2 }}
                              />

                              {/* Status with Agenda Dropdown - Only for Committee Head - Show after files are uploaded */}
                              {canAttachHeadFiles && (
                                <Box sx={{ mb: 2 }}>
                                  <FormControl fullWidth>
                                    <InputLabel id="status-agenda-label">Decision</InputLabel>
                                    <Select
                                      labelId="status-agenda-label"
                                      id="status-agenda-select"
                                      value={selectedAgendaWithStatus || ''}
                                      label="Decision"
                                      onChange={(e) => setSelectedAgendaWithStatus(e.target.value)}
                                      disabled={loadingStatuses || shouldHideUploadSection()}
                                    >
                                      {loadingStatuses ? (
                                        <MenuItem disabled>
                                          <CircularProgress size={20} sx={{ mr: 1 }} />
                                          Loading...
                                        </MenuItem>
                                      ) : !statuses || statuses.length === 0 ? (
                                        <MenuItem disabled>
                                          {statuses === undefined
                                            ? 'Loading...'
                                            : `No statuses with agenda available (${statuses?.length || 0} found)`}
                                        </MenuItem>
                                      ) : (
                                        statuses.map((status) => (
                                          <MenuItem key={status.status_id} value={status.status_id}>
                                            {status.name || 'Unnamed Status'}
                                          </MenuItem>
                                        ))
                                      )}
                                    </Select>
                                  </FormControl>
                                </Box>
                              )}

                              {UploadButtonsSection && <UploadButtonsSection />}
                            </Box>
                          )}
                        </Box>
                      </>
                    )}

                    {/* Show message when user has already uploaded files OR sent to council */}
                    {isSelected && hasCommitteePriority && canUploadAnyFiles && (shouldHideUploadSection() || (canAttachHeadFiles && committeeReview)) && (
                      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f0f9ff', borderRadius: 2, mt: 2 }}>
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" color="success.main" gutterBottom>
                          {canAttachHeadFiles && committeeReview && 'Sent to Council'}
                          {canAttachHeadFiles && !committeeReview && hasExpertUploadedFiles() && 'Files Already Uploaded'}
                          {canAttachHeadFiles && !committeeReview && !hasExpertUploadedFiles() && 'Upload Not Available Yet'}
                          {canAttachExpertFiles && 'Files Already Uploaded'}
                        </Typography>
                        <Typography color="text.secondary">
                          {canAttachHeadFiles &&
                            committeeReview &&
                            'Committee head has already sent the case to council. Review the decision below.'}
                          {canAttachHeadFiles &&
                            !committeeReview &&
                            hasExpertUploadedFiles() &&
                            'Committee head files can be uploaded after expert submits their files.'}
                          {canAttachHeadFiles &&
                            !committeeReview &&
                            !hasExpertUploadedFiles() &&
                            'Committee head files can be uploaded after expert submits their files.'}
                          {canAttachExpertFiles && 'No further uploads are allowed.'}
                        </Typography>
                      </Box>
                    )}
                    {/* Message for users without upload permission */}
                    {/* {isSelected && !canUploadAnyFiles && (
                      <Box sx={{ textAlign: 'center', py: 2, mt: 2 }}>
                        <Typography color="text.secondary">
                          You don't have permission to upload files. Contact administrator for attach_head_file or attach_expert_file
                          permissions.
                        </Typography>
                      </Box>
                    )} */}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
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
        <AnimatePresence>
          {openCaseTextAttachmentModal && currentCaseTextAttachment && (
            <Modal
              open
              onClose={handleCloseCaseTextAttachment}
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
                    Case Text Attachment
                  </Typography>
                  {currentCaseTextAttachment?.file_status && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {currentCaseTextAttachment.file_status === 'approved' && (
                        <Tooltip title="Approved" arrow>
                          <CheckCircleIcon sx={{ color: 'green' }} />
                        </Tooltip>
                      )}
                      {currentCaseTextAttachment.file_status === 'rejected' && (
                        <Tooltip title="Rejected" arrow>
                          <CancelIcon sx={{ color: 'red' }} />
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>
                {currentCaseTextAttachment?.description ? (
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
                      {currentCaseTextAttachment.description}
                    </Typography>
                  </Box>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                    No description found
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button variant="contained" onClick={handleCloseCaseTextAttachment} sx={{ textTransform: 'none' }}>
                    Close
                  </Button>
                </Box>
              </Box>
            </Modal>
          )}
        </AnimatePresence>

        {/* Document Modal */}
        <AnimatePresence>
          {openDoc && (
            <Modal open onClose={handleCloseDoc} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5 }}>
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
                <Typography variant="h6" align="center" sx={{ fontWeight: 700, mb: 1 }}>
                  {(() => {
                    // Don't show description for expert attachments or committee head files
                    const isExpertOrCommitteeHead =
                      openDoc.description?.includes('[EXPERT]') || openDoc.description?.includes('[COMMITTEE_HEAD]');
                    return isExpertOrCommitteeHead
                      ? openDoc.filename || 'Document Preview'
                      : openDoc.description || openDoc.filename || 'Document Preview';
                  })()}
                </Typography>
                {openDoc.file_url ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 300, md: 500 },
                      border: '1px solid #ddd',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 3
                    }}
                  >
                    {(() => {
                      const fileUrl = openDoc.file_url;
                      const fullUrl = fileUrl.startsWith('http') || fileUrl.startsWith('blob:') ? fileUrl : getFullFileUrl(fileUrl);

                      if (fileUrl.startsWith('blob:')) {
                        return <iframe src={fullUrl} title="doc" width="100%" height="100%" style={{ border: 'none' }} />;
                      } else if (fileUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
                        return (
                          <img
                            src={fullUrl}
                            alt="doc"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        );
                      } else {
                        return <iframe src={fullUrl} title="doc" width="100%" height="100%" style={{ border: 'none' }} />;
                      }
                    })()}
                  </Box>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
                    No file available
                  </Typography>
                )}
                <Typography align="center" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  Review the document carefully.
                </Typography>
              </Box>
            </Modal>
          )}
        </AnimatePresence>
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