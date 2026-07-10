import { useLocation, useNavigate } from 'react-router-dom';
import caseReviewService from '../../../service/caseReview.service';
import letterService from '../../../service/letter.service';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Snackbar,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { FaLessThan } from 'react-icons/fa';
import JoditEditor from 'jodit-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InfoCardWrapper from '../components/InfoCardWrapper';
import ComplainantSection from '../components/sections/ComplainantSection';
import CaseInfoSection from '../components/sections/CaseInfoSection';
import { hasValue, isAnonymous } from '../components/utils/caseInfoHelpers';
import { useTheme } from '@mui/material/styles';
import { getStatusColor } from '../../../utils/statusColors';

// Import letter templates
import { getTemplates } from '../../../templates/letterTemplates';

// Format date helper
const formatDate = (date, fallback = 'N/A') => {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString('am-ET', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getApplicantName = (applicant) => {
  if (!applicant) return '';
  if (applicant.full_name) return applicant.full_name;
  const nameParts = [
    applicant.first_name,
    applicant.middle_name,
    applicant.last_name,
    applicant.firstName,
    applicant.lastName
  ].filter(Boolean);
  if (nameParts.length > 0) {
    return nameParts.filter((value, index) => nameParts.indexOf(value) === index).join(' ');
  }
  return applicant.name || '';
};

const getApplicantPhone = (applicant) =>
  applicant?.phone_number || applicant?.phone_no || applicant?.phone || applicant?.mobile || '';

const getApplicantEmail = (applicant) => applicant?.email || applicant?.email_address || applicant?.contact_email || '';

const resolveCaseNumber = (caseData) =>
  caseData?.case_number || caseData?.case?.case_number || caseData?.complaint?.case_number;

const resolveCaseType = (caseData) =>
  caseData?.case_type || caseData?.case?.case_type || caseData?.complaint?.case_type;

const resolveCaseStatus = (caseData) =>
  caseData?.status || caseData?.case_status || caseData?.case?.status || caseData?.complaint?.status;

const resolveComplaintDate = (complaint, fallbackDate) =>
  complaint?.created_at || complaint?.createdAt || fallbackDate || complaint?.submitted_at;

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

// A4 dimensions in pixels (at 96 DPI: 794 x 1123)
const A4_WIDTH = 850;
const A4_MIN_HEIGHT = 1000;

const LetterGenerationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const { t } = useTranslation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [letterContent, setLetterContent] = useState('');
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Template selection
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Saved letters state - keyed by letter_type
  const [savedLettersMap, setSavedLettersMap] = useState({});
  const [currentSavedLetter, setCurrentSavedLetter] = useState(null);

  const caseId = location.state?.caseId;
  const decisionId = location.state?.decisionId;

  // Jodit Editor config - A4 height
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: A4_MIN_HEIGHT,
      width: A4_WIDTH,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      toolbarSticky: false,
      statusBar: false,
      buttons: [
        'bold',
        'italic',
        'underline',
        '|',
        'fontsize',
        'font',
        '|',
        'align',
        '|',
        'ul',
        'ol',
        '|',
        'indent',
        'outdent',
        '|',
        'undo',
        'redo'
      ],
      style: {
        fontFamily: '"Nyala", "Times New Roman", Times, serif',
        fontSize: '14px'
      }
    }),
    []
  );

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch case data and any saved letters
  const fetchData = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await caseReviewService.getCaseDetailForDecision(caseId);
      setData(response);

      const currentDecisionId = response?.decision?.decision_id || decisionId;
      const decisionType = response?.decision?.status?.decision_type;

      // Get templates filtered by decision type
      const templates = getTemplates({ decisionType });
      setAvailableTemplates(templates);

      // Try to load saved letters for this decision
      let lettersMap = {};
      if (currentDecisionId) {
        try {
          const savedLettersResponse = await letterService.getLetters(currentDecisionId);
          const savedLetters = savedLettersResponse.letters || [];

          // Build a map of letter_type -> saved letter
          savedLetters.forEach((letter) => {
            lettersMap[letter.letter_type] = letter;
          });
          setSavedLettersMap(lettersMap);

          if (savedLetters.length > 0) {
            // Load the most recent saved letter
            const latestLetter = savedLetters[0];
            setCurrentSavedLetter(latestLetter);
            setLetterContent(latestLetter.letter_content);

            // Find matching template
            const matchingTemplate = templates.find((t) => t.letterType === latestLetter.letter_type);
            if (matchingTemplate) {
              setSelectedTemplate(matchingTemplate);
            }
            setIsEditing(false); // Start in preview mode if letter exists
          } else if (templates.length > 0) {
            // No saved letter, load first template
            setSelectedTemplate(templates[0]);
            loadTemplateContent(templates[0], response);
          }
        } catch (err) {
          // No saved letters, use default template
          if (templates.length > 0) {
            setSelectedTemplate(templates[0]);
            loadTemplateContent(templates[0], response);
          }
        }
      } else if (templates.length > 0) {
        setSelectedTemplate(templates[0]);
        loadTemplateContent(templates[0], response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Unable to load case details. Please refresh the page.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [caseId, decisionId]);

  // Load template content with case data
  const loadTemplateContent = (template, caseData) => {
    if (!template || !caseData) return;

    const complaint = caseData.complaint;
    const applicant = caseData?.applicant || complaint?.applicant;
    const decision = caseData?.decision;
    const applicantName = getApplicantName(applicant) || t('letterGeneration.applicantFallback');

    const content = template.getContent({
      caseNumber: resolveCaseNumber(caseData) || caseData?.case_number,
      applicantName,
      applicantAddress: applicant?.address || '',
      decisionDate: decision?.created_at,
      decisionStatus: decision?.status?.name || '',
      referenceNumber: decision?.letterRef?.reference_number || 'TBD'
    });
    setLetterContent(content);
    setCurrentSavedLetter(null); // Clear saved letter when loading fresh template
  };

  // Handle template selection change
  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    const template = availableTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);

      // Check if there's already a saved letter for this letter type
      const existingSavedLetter = savedLettersMap[template.letterType];
      if (existingSavedLetter) {
        // Load the existing saved letter
        setLetterContent(existingSavedLetter.letter_content);
        setCurrentSavedLetter(existingSavedLetter);
        setIsEditing(false); // Start in preview mode for existing letters
      } else {
        // Load fresh template
        loadTemplateContent(template, data);
        setIsEditing(true);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => {
    navigate('/letter_generation');
  };

  // Save letter to database
  const handleSaveDraft = async () => {
    if (!selectedTemplate || !data?.decision?.decision_id) {
      setSnackbar({
        open: true,
        message: t('letterGeneration.decisionRequired'),
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const currentDecisionId = data.decision.decision_id;

      if (currentSavedLetter) {
        // Update existing letter
        const response = await letterService.updateLetter(currentSavedLetter.decision_letter_id, letterContent);
        const updatedLetter = response.letter;
        setCurrentSavedLetter(updatedLetter);
        // Update the map
        setSavedLettersMap((prev) => ({
          ...prev,
          [selectedTemplate.letterType]: updatedLetter
        }));
        setSnackbar({
          open: true,
          message: t('letterGeneration.letterUpdated'),
          severity: 'success'
        });
      } else {
        // Create new letter
        const response = await letterService.createLetter(currentDecisionId, selectedTemplate.letterType, letterContent);
        const newLetter = response.letter;
        setCurrentSavedLetter(newLetter);
        // Update the map so switching templates will find this letter
        setSavedLettersMap((prev) => ({
          ...prev,
          [selectedTemplate.letterType]: newLetter
        }));
        setSnackbar({
          open: true,
          message: t('letterGeneration.letterSaved'),
          severity: 'success'
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      setSnackbar({
        open: true,
        message: t('letterGeneration.letterSaveFailed'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;

    setSaving(true);
    try {
      const target = previewRef.current;
      const captureWidth = target.scrollWidth;
      const captureHeight = target.scrollHeight;

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidthMm = pdfWidth;
      const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        const pageHeightMm = pdfHeight;
        const pageHeightPx = (canvas.width * pdfHeight) / pdfWidth;
        const pagesNeeded = Math.ceil(canvas.height / pageHeightPx);

        for (let i = 0; i < pagesNeeded; i++) {
          if (i > 0) pdf.addPage();

          const sourceY = pageHeightPx * i;
          const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          pageCtx.drawImage(canvas, 0, -sourceY, canvas.width, canvas.height);

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 1.0);
          const displayHeightMm = (sourceHeight * pdfWidth) / canvas.width;
          pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidthMm, displayHeightMm);
        }
      }

      pdf.save(`letter_case_${data?.case_number || 'unknown'}.pdf`);

      setSnackbar({
        open: true,
        message: t('letterGeneration.pdfDownloaded'),
        severity: 'success'
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      setSnackbar({
        open: true,
        message: t('letterGeneration.pdfFailed'),
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/${url.replace(/\\/g, '/')}`;
  };

  // Extract data
  const complaint = data?.complaint;
  const applicant = data?.applicant || complaint?.applicant;
  const decision = data?.decision;
  const attachments = data?.attachments || [];

  const caseNumberValue = resolveCaseNumber(data);
  const caseStatusValue = resolveCaseStatus(data);
  const caseTypeValue = resolveCaseType(data);
  const complaintDateValue = resolveComplaintDate(complaint, data?.created_at);
  const applicantNameValue = getApplicantName(applicant);
  const applicantPhoneValue = getApplicantPhone(applicant);
  const applicantEmailValue = getApplicantEmail(applicant);
  const hasApplicantDetails = Boolean(applicantNameValue || applicantPhoneValue || applicantEmailValue);
  const formattedComplaintDate = formatDate(complaintDateValue, t('letterGeneration.notAvailable'));
  const complaintStatusLabel = toTitleCase(complaint?.status);
  const caseStatusLabel = toTitleCase(caseStatusValue);
  const complaintStatusChipColor = getStatusChipColor(complaint?.status);
  const caseStatusChipColor = getStatusChipColor(caseStatusValue);

  // Field computation logic
  const isAnonymousComplainant = applicant && isAnonymous(applicantNameValue);

  const complainantFields = (() => {
    const fields = [];
    if (hasApplicantDetails && applicant) {
      if (!isAnonymousComplainant && hasValue(applicantNameValue)) {
        fields.push({ label: 'Name', value: applicantNameValue });
      }
      if (hasValue(applicantPhoneValue)) {
        fields.push({ label: 'Phone', value: applicantPhoneValue });
      }
    }
    return fields;
  })();

  const judgeFields = (() => {
    const fields = [];
    if (hasValue(complaint?.complaint_id)) {
      const complaintId = complaint.complaint_id?.substring(0, 8).toUpperCase();
      fields.push({ label: 'Report ID', value: complaintId, color: theme.palette.primary.main });
    }
    if (hasValue(complaint?.judge_name)) {
      fields.push({ label: 'Judge Name', value: complaint.judge_name });
    }
    if (hasValue(complaint?.court_office)) {
      fields.push({ label: 'Court Office', value: complaint.court_office });
    }
    if (hasValue(caseNumberValue)) {
      fields.push({ label: 'Case File Number', value: caseNumberValue });
    }
    if (hasValue(caseTypeValue)) {
      fields.push({ label: 'Case Type', value: caseTypeValue });
    }
    return fields;
  })();
  const caseStatusColor = getStatusColor(theme, caseStatusValue);
  const infoCardAttachments = attachments?.map((att, idx) => ({
    name: att.file_name || t('letterGeneration.attachmentFallback', { index: idx + 1 }),
    size: '',
    file_path: att.file_path
  })) || [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // No caseId provided
  if (!caseId) {
    return (
      <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', p: 3 }}>
        <Typography
          sx={{ color: '#1E516A', fontWeight: 600, cursor: 'pointer', fontSize: '20px', mb: 3 }}
          onClick={() => navigate('/letter_generation')}
        >
          {t('letterGeneration.backToGenerator')}
        </Typography>
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 60, color: '#1E516A', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('letterGeneration.noCaseTitle')}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('letterGeneration.noCaseDescription')}
            </Typography>
            <Button variant="contained" onClick={() => navigate('/letter_generation')}>
              {t('letterGeneration.goToGenerator')}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!data) {
    return (
      <Typography align="center" mt={5}>
        {t('letterGeneration.noDataFound')}
      </Typography>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
              <FaLessThan style={{ color: '#143481' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#215167', fontSize: '22px' }}>
              {t('letterGeneration.title', 'Letter Generation')}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontSize: '14px', color: '#A3AED0' }}>
            {t('letterGeneration.subtitle', 'Generate official letters for decided cases.')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentSavedLetter && (
              <Chip label={t('letterGeneration.savedChip')} color="success" size="small" />
            )}
            {/* <Typography variant="body2" color="text.secondary">
              {isEditing ? t('letterGeneration.editingStateLabel') : t('letterGeneration.previewStateLabel')}
            </Typography> */}
          </Box>
          {isEditing ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              disabled={saving || availableTemplates.length === 0}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 1,
              }}
            >
              {saving
                ? t('letterGeneration.saving')
                : currentSavedLetter
                  ? t('letterGeneration.updateButton')
                  : t('letterGeneration.saveDraftButton')}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                disabled={availableTemplates.length === 0}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1 }}
              >
                {t('letterGeneration.editLetter')}
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handleDownloadPDF}
                disabled={saving || !letterContent}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1,
                  backgroundColor: '#0d6f4e',
                  '&:hover': { backgroundColor: '#0a5a3e' }
                }}
              >
                {t('letterGeneration.downloadPdf')}
              </Button>
            </>
          )}
          {/* <Button
            variant="text"
            onClick={handleBack}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#1E516A' }}
          >
            {t('letterGeneration.backToGenerator')}
          </Button> */}
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Left Column - Info Card (reuse shared component) */}
        <Grid item xs={12} lg={5} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <InfoCardWrapper grow={false}>
            {hasApplicantDetails && (
              <ComplainantSection
                complainantInfo={{
                  name: applicantNameValue,
                  id: complaint?.complaint_id,
                  email: applicantEmailValue || '-',
                  phone: applicantPhoneValue || '-',
                  status: complaintStatusLabel
                }}
                fields={complainantFields}
              />
            )}
            <CaseInfoSection
              judgeInfo={{
                complaintId: complaint?.complaint_id,
                judgeName: complaint?.judge_name,
                courtOffice: complaint?.court_office,
                caseFileNumber: caseNumberValue,
                caseType: caseTypeValue
              }}
              fields={judgeFields}
              caseStatusLabel={hasApplicantDetails ? null : caseStatusLabel}
              showComplainantStatus={hasApplicantDetails}
            />
          </InfoCardWrapper>

          {/* Decision Card */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              maxWidth: '48rem',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              backgroundColor: 'white',
              p: '24px'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: '16px',
                  color: '#215167'
                }}
              >
                {t('letterGeneration.decisionTitle', 'Decision')}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                  fontSize: '14px',
                  color: '#64748b'
                }}
              >
                {formatDate(decision?.created_at, '—')}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: '15px',
                color: '#041f36'
              }}
            >
              {decision?.status?.name || t('letterGeneration.decisionUnknown', 'Decision not available')}
            </Typography>
          </Box>

          {/* Letter Template Selector Card */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              width: '100%',
              maxWidth: '48rem',
              borderRadius: '12px',
              border: '1px solid #E0E0E0',
              backgroundColor: 'white',
              p: '24px'
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                fontSize: '16px',
                color: '#215167'
              }}
            >
              {t('letterGeneration.letterTemplate', 'Letter Template')}
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>{t('letterGeneration.letterType')}</InputLabel>
              <Select
                value={selectedTemplate?.id || ''}
                label={t('letterGeneration.letterType')}
                onChange={handleTemplateChange}
                disabled={availableTemplates.length === 0}
                sx={{
                  backgroundColor: '#F7F7FF',
                  borderRadius: 1,
                  '& .MuiSelect-select': { py: 1.1 },
                  '& fieldset': { borderColor: '#E0E0E0' },
                  '&:hover fieldset': { borderColor: '#B0B0C0' },
                  '&.Mui-focused fieldset': { borderColor: '#2E3180' }
                }}
              >
                {availableTemplates.length === 0 ? (
                  <MenuItem value="" disabled>
                    {t('letterGeneration.noTemplatesForDecisionType')}
                  </MenuItem>
                ) : (
                  availableTemplates.map((template) => {
                    const isSaved = Boolean(savedLettersMap[template.letterType]);
                    return (
                      <MenuItem key={template.id} value={template.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: isSaved ? 600 : 500,
                            }}
                          >
                            {template.title}
                          </Typography>
                          {isSaved && (
                            <CheckCircleIcon fontSize="small" sx={{ color: '#49C178' }} />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>
          </Box>
        </Grid>

        {/* Right Column - Template Selection & Editor/Preview (A4 size) */}
        <Grid item xs={12} lg={7}>
          {availableTemplates.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', minHeight: A4_MIN_HEIGHT }}>
              <Typography color="text.secondary">{t('letterGeneration.noTemplatesConfigured')}</Typography>
            </Box>
          ) : isEditing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto' }}>
              <JoditEditor
                ref={editorRef}
                value={letterContent}
                config={editorConfig}
                onBlur={(newContent) => setLetterContent(newContent)}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto' }}>
              <Paper
                ref={previewRef}
                elevation={1}
                sx={{
                  width: `${A4_WIDTH}px`,
                  minHeight: `${A4_MIN_HEIGHT}px`,
                  p: 3,
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  overflow: 'visible'
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: letterContent }} />
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Attachments Modal */}
      <Dialog open={attachmentModalOpen} onClose={() => setAttachmentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('letterGeneration.attachmentsTitle')}</Typography>
            <IconButton onClick={() => setAttachmentModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {attachments.length === 0 ? (
            <Typography color="text.secondary" align="center" py={3}>
              {t('letterGeneration.noAttachments')}
            </Typography>
          ) : (
            <List>
              {attachments.map((attachment, index) => (
                <ListItem
                  key={attachment.attachment_id || index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => window.open(getFullFileUrl(attachment.file_path), '_blank')}>
                      <VisibilityIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={attachment.file_name || t('letterGeneration.attachmentFallback', { index: index + 1 })}
                    secondary={attachment.upload_type || t('letterGeneration.document')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentModalOpen(false)}>{t('letterGeneration.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LetterGenerationPage;
