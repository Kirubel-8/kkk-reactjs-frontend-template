import { useLocation, useNavigate } from 'react-router-dom';
import disciplinaryService from '../../../service/disciplinary.service';
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
import JoditEditor from 'jodit-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import letter templates
import { getTemplates, getTemplateById } from '../../../templates/letterTemplates';

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

// A4 dimensions in pixels (at 96 DPI: 794 x 1123)
const A4_WIDTH = 794;
const A4_MIN_HEIGHT = 1000;

const DisciplinaryLetterGenerationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  // Disciplinary decision might be nested in case object
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
      // Use getAssignedDisciplinaryRequestById which returns full details including Case/Decision
      const response = await disciplinaryService.getAssignedDisciplinaryRequestById(caseId);
      // Handle response structure - service returns response.data, but API might wrap it again
      const responseData = response?.data || response;
      setData(responseData);

      // Extract decision and its decision_type
      const currentDecisionId = responseData?.case?.decision?.decision_id || decisionId;
      const decisionStatus = responseData?.case?.decision?.status;
      const decisionType = decisionStatus?.decision_type; // e.g., 'complaint closed', 'forward to committee'

      // Get templates filtered by caseType='discipline' and the decision's decision_type
      const templates = getTemplates({ 
        caseType: 'discipline', 
        decisionType: decisionType 
      });
      console.log('Available templates for decision_type:', decisionType, templates);
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

    const applicant = caseData?.applicant || caseData?.case?.disciplinary_complaint?.applicant;
    const decision = caseData?.case?.decision;
    const applicantName = getApplicantName(applicant) || t('letterGeneration.applicantFallback');
    // The person being accused is always the judge
    const judgeName = caseData?.judge_name || caseData?.case?.disciplinary_complaint?.judge_name || 'ዳኛ';

    // Build params based on letterType (different recipients need different data)
    const baseParams = {
      caseNumber: caseData?.file_number || caseData?.case?.case_number || caseData?.case?.disciplinary_complaint?.file_number || 'N/A',
      decisionDate: decision?.created_at,
      decisionStatus: decision?.status?.name || caseData?.status || caseData?.case?.status || '',
      referenceNumber: decision?.letterRef?.reference_number || 'TBD',
    };

    let templateParams = { ...baseParams };

    switch (template.letterType) {
      case 'judge_letter':
        // For judge letters - the person being accused is the judge, so use judge's name
        templateParams = {
          ...baseParams,
          applicantName: judgeName,
        };
        break;
      case 'complainant_letter':
        // For complainant/applicant letters
        templateParams = {
          ...baseParams,
          applicantName,
          applicantAddress: applicant?.address || applicant?.woreda || '',
        };
        break;
      case 'employee_letter':
        // For employee/respondent letters - judge is the recipient
        const issues = caseData?.issues || caseData?.case?.disciplinary_complaint?.issues || [];
        templateParams = {
          ...baseParams,
          recipientName: caseData?.judge_name || caseData?.case?.disciplinary_complaint?.judge_name || 'ሰራተኛው',
          recipientAddress: '', // Could be fetched from judge profile if available
          details: issues.map(i => i.description).join(', ') || '',
          responsePeriodDays: '10',
          appealPeriodDays: '30',
          warningLevel: 'የመጀመሪያ',
        };
        break;
      default:
        templateParams = {
          ...baseParams,
          applicantName,
        };
    }

    const content = template.getContent(templateParams);
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
    navigate('/disciplinary_letter_generation');
  };

  // Save letter to database
  const handleSaveDraft = async () => {
    const currentDecisionId = data?.case?.decision?.decision_id;
    
    if (!selectedTemplate || !currentDecisionId) {
      setSnackbar({
        open: true,
        message: t('letterGeneration.decisionRequired'),
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
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
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: A4_WIDTH,
        windowWidth: A4_WIDTH
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Convert canvas dimensions from pixels to mm
      // At 96 DPI: 1px = 0.264583mm, but we used scale: 2, so divide by 2
      const pxToMm = 0.264583;
      
      // Calculate dimensions to fit to PDF width
      const imgWidthMm = pdfWidth;
      const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;

      // If content fits on one page, add it directly
      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        // Content spans multiple pages - split into pages
        const pageHeightMm = pdfHeight;
        const pageHeightPx = (canvas.width * pdfHeight) / pdfWidth;
        const pagesNeeded = Math.ceil(canvas.height / pageHeightPx);

        for (let i = 0; i < pagesNeeded; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const sourceY = pageHeightPx * i;
          const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

          // Create a temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          pageCtx.drawImage(canvas, 0, -sourceY, canvas.width, canvas.height);

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 1.0);
          
          // Calculate height for this chunk on the PDF
          const displayHeightMm = (sourceHeight * pdfWidth) / canvas.width;

          pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidthMm, displayHeightMm);
        }
      }

      pdf.save(`letter_case_${data?.file_number || 'unknown'}.pdf`);

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

  // Extract data with fallbacks for different response structures
  const applicant = data?.applicant || data?.case?.disciplinary_complaint?.applicant;
  const decision = data?.case?.decision;
  const attachments = data?.evidences || data?.case?.disciplinary_complaint?.evidences || []; // Disciplinary uses 'evidences'

  const caseNumberValue = data?.file_number || data?.case?.case_number || data?.case?.disciplinary_complaint?.file_number;
  const caseStatusValue = data?.status || data?.case?.status;
  const complaintDateValue = data?.createdAt || data?.created_at || data?.case?.disciplinary_complaint?.createdAt || data?.case?.disciplinary_complaint?.created_at;
  const judgeNameValue = data?.judge_name || data?.case?.disciplinary_complaint?.judge_name;
  const applicantNameValue = getApplicantName(applicant);
  const applicantPhoneValue = getApplicantPhone(applicant);
  const applicantEmailValue = getApplicantEmail(applicant);
  const hasApplicantDetails = Boolean(applicantNameValue || applicantPhoneValue || applicantEmailValue);
  const formattedComplaintDate = formatDate(complaintDateValue, t('letterGeneration.notAvailable'));
  const normalizedCaseStatus = (caseStatusValue || '').toLowerCase();
  const caseStatusChipColor = !caseStatusValue
    ? 'default'
    : normalizedCaseStatus === 'closed'
      ? 'success'
      : 'primary';

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
          onClick={() => navigate('/disciplinary_letter_generation')}
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
            <Button variant="contained" onClick={() => navigate('/disciplinary_letter_generation')}>
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
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" rowGap={2}>
        <Typography sx={{ color: '#1E516A', fontWeight: 600, cursor: 'pointer', fontSize: '20px' }} onClick={handleBack}>
          {t('letterGeneration.backToGenerator')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isEditing ? (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              disabled={saving || availableTemplates.length === 0}
              sx={{ textTransform: 'none' }}
            >
              {saving
                ? t('letterGeneration.saving')
                : currentSavedLetter
                  ? t('letterGeneration.updateButton')
                  : t('letterGeneration.saveDraftButton')}
            </Button>
          ) : (
            <>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ textTransform: 'none' }}>
                {t('letterGeneration.editLetter')}
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={handleDownloadPDF}
                disabled={saving}
                sx={{ textTransform: 'none', backgroundColor: '#0d6f4e', '&:hover': { backgroundColor: '#0a5a3e' } }}
              >
                {t('letterGeneration.downloadPdf')}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column - Case Information */}
        <Grid item xs={12} lg={4}>
          {/* Case Info Card */}
          <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <DescriptionIcon sx={{ color: '#1E516A', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#041f36' }}>
                  {t('letterGeneration.caseInfo')}
                </Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('letterGeneration.caseNumber')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {caseNumberValue || t('letterGeneration.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('letterGeneration.status')}
                  </Typography>
                  <Chip
                    label={caseStatusValue || t('letterGeneration.notAvailable')}
                    size="small"
                    color={caseStatusChipColor}
                    sx={{
                      marginLeft: 2
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('letterGeneration.complaintDate')}
                  </Typography>
                  <Typography variant="body2">{formattedComplaintDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Judge
                  </Typography>
                  <Typography variant="body2">
                    {judgeNameValue || t('letterGeneration.notAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Applicant Info Card */}
          <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#041f36', mb: 1 }}>
                {t('letterGeneration.applicant')}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                {t('letterGeneration.fullName')}
              </Typography>
              <Typography variant="body2" fontWeight={600} mb={1}>
                {applicantNameValue || t('letterGeneration.notAvailable')}
              </Typography>
              {hasApplicantDetails ? (
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.phone')}
                    </Typography>
                    <Typography variant="body2">
                      {applicantPhoneValue || t('letterGeneration.notAvailable')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.email')}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {applicantEmailValue || t('letterGeneration.notAvailable')}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('letterGeneration.missingApplicant')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Decision Info Card */}
          {decision && (
            <Card sx={{ borderRadius: 2, boxShadow: 1, mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircleIcon sx={{ color: '#0d6f4e', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#041f36' }}>
                    {t('letterGeneration.decision')}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.status')}
                    </Typography>
                    <Chip label={decision?.status?.name || t('letterGeneration.notAvailable')} size="small" color="success" sx={{ marginLeft: 2 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.decisionType')}
                    </Typography>
                    <Typography variant="body2">
                      {decision?.status?.decision_type || t('letterGeneration.notAvailable')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.referenceNumber')}
                    </Typography>
                    <Typography variant="body2">
                      {decision?.letterRef?.reference_number || t('letterGeneration.referenceNotAssigned')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('letterGeneration.decisionDate')}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(decision?.created_at, t('letterGeneration.notAvailable'))}
                    </Typography>
                  </Grid>
                </Grid>

                {attachments.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => setAttachmentModalOpen(true)}
                    sx={{ mt: 1, textTransform: 'none' }}
                    size="small"
                    fullWidth
                  >
                    {t('letterGeneration.viewAttachments', { count: attachments.length })}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Template Selection & Editor/Preview (A4 size) */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 1, minHeight: A4_MIN_HEIGHT + 150 }}>
            <CardContent sx={{ p: 3 }}>
              {/* Template Selection Dropdown */}
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ minWidth: 260, flex: '1 1 280px' }} size="small">
                  <InputLabel>{t('letterGeneration.letterType')}</InputLabel>
                  <Select
                    value={selectedTemplate?.id || ''}
                    label={t('letterGeneration.letterType')}
                    onChange={handleTemplateChange}
                    disabled={availableTemplates.length === 0}
                  >
                    {availableTemplates.length === 0 ? (
                      <MenuItem value="" disabled>
                        {t('letterGeneration.noTemplatesForDecisionType')}
                      </MenuItem>
                    ) : (
                      availableTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.title}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                  {currentSavedLetter && (
                    <Chip label={t('letterGeneration.savedChip')} color="success" size="small" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {isEditing ? t('letterGeneration.editingStateLabel') : t('letterGeneration.previewStateLabel')}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {availableTemplates.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', minHeight: A4_MIN_HEIGHT }}>
                  <Typography color="text.secondary">{t('letterGeneration.noTemplatesConfigured')}</Typography>
                </Box>
              ) : isEditing ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <JoditEditor
                    ref={editorRef}
                    value={letterContent}
                    config={editorConfig}
                    onBlur={(newContent) => setLetterContent(newContent)}
                  />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Paper
                    ref={previewRef}
                    elevation={2}
                    sx={{
                      width: A4_WIDTH,
                      minHeight: A4_MIN_HEIGHT,
                      p: 4,
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 0,
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: letterContent }} />
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
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
                  key={attachment.evidence_id || index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => window.open(getFullFileUrl(attachment.file_url), '_blank')}>
                      <VisibilityIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <AttachFileIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={attachment.description || t('letterGeneration.attachmentFallback', { index: index + 1 })}
                    secondary={t('letterGeneration.document')}
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

export default DisciplinaryLetterGenerationPage;
