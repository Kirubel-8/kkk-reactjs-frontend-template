import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Card, Grid, Divider, IconButton, Snackbar, Alert, CircularProgress, Modal, TextField } from '@mui/material';
import { History, Visibility, Delete } from '@mui/icons-material';
import { FaFileUpload } from 'react-icons/fa';
import { FaFile } from 'react-icons/fa';
import { CgSoftwareUpload } from 'react-icons/cg';
import { RiDeleteBinLine } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';
import courtOfficeService from 'service/courtOffice.service';
import { EvidencePreviewModal } from '../components/modals/EvidencePreviewModal';
import { getStatusColor } from 'utils/statusColors';
import { useTheme } from '@mui/material/styles';

export default function UploadDocuments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = location.state || {};
  const theme = useTheme();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  const truncateFileName = (fileName, maxChars = 8) => {
    if (fileName.length <= maxChars) return fileName;
    return fileName.substring(0, maxChars) + '...';
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Combine all files for preview (newly uploaded + already uploaded)
  const allFilesForPreview = useMemo(() => {
    const files = [];
    
    // Add newly uploaded files
    uploadedFiles.forEach((fileObj) => {
      files.push({
        id: fileObj.id,
        file_name: fileObj.name,
        file: fileObj.file,
        isNew: true,
        url: URL.createObjectURL(fileObj.file)
      });
    });
    
    // Add already uploaded files
    if (requestDetails?.attachments) {
      requestDetails.attachments
        .filter(file => file.file_path)
        .forEach((file) => {
          const normalizedPath = file.file_path.replace(/\\/g, "/");
          const fileUrl = `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${normalizedPath}`;
          files.push({
            id: file.file_id || file.id,
            file_name: file.file_name || 'File',
            file_path: file.file_path,
            isNew: false,
            url: fileUrl
          });
        });
    }
    
    return files;
  }, [uploadedFiles, requestDetails?.attachments]);

  const handleViewFile = (file, isNewFile = true) => {
    const index = allFilesForPreview.findIndex(f => 
      isNewFile 
        ? f.id === file.id 
        : (f.file_path === file.file_path || f.id === file.id)
    );
    if (index !== -1) {
      setCurrentPreviewIndex(index);
      setPreviewModalOpen(true);
    }
  };

  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    // Clean up object URLs for newly uploaded files
    allFilesForPreview.forEach(file => {
      if (file.isNew && file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    });
  };

  const handlePreviousFile = () => {
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  const handleNextFile = () => {
    if (currentPreviewIndex < allFilesForPreview.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const currentPreviewFile = allFilesForPreview[currentPreviewIndex] || null;
  const isImageFile = currentPreviewFile 
    ? /\.(jpg|jpeg|png|gif)$/i.test(currentPreviewFile.file_name || '')
    : false;

  useEffect(() => {
    if (!id) {
      navigate('/court-office/requests');
      return;
    }
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await courtOfficeService.getRequestById(id);
      const caseData = response.data;
      const complaint = caseData.disciplinary_complaint || {};
      const courtReq = caseData.courtOfficeRequest || {};

      setRequestDetails({
        caseId: caseData.case_id,
        fileNumber: complaint.file_number,
        judgeName: complaint.judge_name,
        courtOffice: complaint.court_office || 'Court Name',
        status: courtReq.court_office_document_request_status,
        requestedAt: courtReq.court_office_requested_at,
        deliveredAt: courtReq.court_office_delivered_at,
        reason: courtReq.court_office_request_reason,
        attachments: caseData.attachments || [],
        uploaded: (courtReq.court_office_document_request_status === "fulfilled")
      });
    } catch (error) {
      console.error('Error fetching details:', error);
      setSnackMessage('Error fetching request details');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDocuments = async () => {
    if (uploadedFiles.length === 0) return;
    
    setSubmitting(true);
    const formData = new FormData();
    uploadedFiles.forEach((fileObj) => {
      formData.append('files', fileObj.file);
    });

    try {
      await courtOfficeService.uploadDocuments(id, formData);
      setSnackMessage('Documents uploaded successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      await fetchDetails();
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setSnackMessage('Failed to upload documents');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnEmpty = async () => {
    if (!returnReason.trim()) return;

    setSubmitting(true);
    try {
      await courtOfficeService.returnEmpty(id, returnReason);
      setSnackMessage('Response submitted successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      setTimeout(() => navigate('/court-office/requests'), 1500);
    } catch (error) {
      console.error('Error returning empty:', error);
      setSnackMessage('Failed to submit response');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setUploadedFiles([]);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'fulfilled':
        return 'Delivered';
      case 'returned_empty':
        return 'Returned Empty';
      default:
        return status || 'Pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '-';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pt: '43px', maxWidth: '1540px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          sx={{ 
            fontFamily: 'Montserrat',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: '22px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#11255A'
          }}
        >
          Court Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* <Button
            variant="contained"
            startIcon={<History />}
            sx={{
              width: '124px',
              height: '37px',
              borderRadius: '3.06px',
              gap: '7.66px',
              padding: '7.66px',
              backgroundColor: '#6B7A8F',
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontStyle: 'normal',
              fontSize: '12.25px',
              lineHeight: '100%',
              letterSpacing: '0%',
              color: '#FFFFFF',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#6B7A8F' }
            }}
          >
            History | Log
          </Button> */}
          
          {requestDetails?.status !== 'fulfilled' && (<Button
            variant="contained"
            startIcon={<RiDeleteBinLine />}
            onClick={() => setOpenReturnModal(true)}
            disabled={uploadedFiles.length > 0 || submitting || requestDetails?.uploaded}
            sx={{
              height: '37px',
              gap: '8.48px',
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontStyle: 'normal',
              fontSize: '12.25px',
              lineHeight: '100%',
              letterSpacing: '0%',
              color: '#FFFFFF',
              textTransform: 'none',
              backgroundColor: uploadedFiles.length > 0 ? theme.palette.statusButtons.rejected : '#F44336E5',
              whiteSpace: 'nowrap',
              '&:hover': { 
                backgroundColor: uploadedFiles.length > 0 ? '#F4433699' : '#F44336E5' 
              },
              '&:disabled': {
                backgroundColor: '#F4433699',
                color: '#FFFFFF',
                opacity: 0.5,
              }
            }}
          >
            Return Without Documents
          </Button>)}
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* LEFT CARD */}
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
          <Card
            sx={{
              minHeight: '287px',
              borderRadius: '15.53px',
              backgroundColor: '#FFFFFF',
              pt: '24px',
              pr: '31.05px',
              pb: '24px',
              pl: '31.05px',
              width: '100%',
              border: '1px solid #E3F2FD'
            }}
          >
            {/* Case Information Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: '16px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  color: '#094C81'
                }}
              >
                Case Information
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  color: getStatusColor(theme, requestDetails?.status),
                  textAlign: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                {getStatusLabel(requestDetails?.status)}
              </Typography>
            </Box>

            {/* Judge Name */}
            {/* <Divider sx={{ borderColor: '#E8E8E8' }} /> */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: '12px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121'
                }}
              >
                Judge Name
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121',
                  textAlign: 'right'
                }}
              >
                {requestDetails?.judgeName || '-'}
              </Typography>
            </Box>

            {/* Court Office */}
            <Divider sx={{ borderColor: '#E8E8E8' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: '12px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121'
                }}
              >
                Court Office
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121',
                  textAlign: 'right'
                }}
              >
                {requestDetails?.courtOffice || '-'}
              </Typography>
            </Box>

            {/* Case File Number */}
            <Divider sx={{ borderColor: '#E8E8E8' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: '12px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121'
                }}
              >
                Case File Number
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121',
                  textAlign: 'right'
                }}
              >
                {requestDetails?.fileNumber || '-'}
              </Typography>
            </Box>

            {/* Request Date */}
            <Divider sx={{ borderColor: '#E8E8E8' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: '12px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121'
                }}
              >
                Request Date
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121',
                  textAlign: 'right'
                }}
              >
                {formatDate(requestDetails?.requestedAt)}
              </Typography>
            </Box>

            {/* Delivered Date */}
            <Divider sx={{ borderColor: '#E8E8E8' }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: '12px'
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121'
                }}
              >
                Delivered Date
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '16px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#212121',
                  textAlign: 'right'
                }}
              >
                {formatDate(requestDetails?.deliveredAt)}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT CARD */}
        <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
          <Card
            sx={{
              minHeight: '287px',
              borderRadius: '15.53px',
              backgroundColor: '#FFFFFF',
              pt: '24px',
              pr: '31.05px',
              pb: '24px',
              pl: '31.05px',
              width: '100%',
              border: '1px solid #E3F2FD'
            }}
          >
            {/* Document Attachment Header */}
            <Typography
              sx={{
                fontFamily: 'Montserrat',
                fontWeight: 600,
                fontStyle: 'normal',
                fontSize: '18px',
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#094C81',
                mb: '5px'
              }}
            >
              Document Attachment
            </Typography>

            {/* Horizontal line under header */}
            <Divider sx={{ borderColor: '#E8E8E8', mb: '33px' }} />

            {/* Upload Area */}
            {(!requestDetails?.uploaded || requestDetails.attachments?.length === 0) && (
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '700px',
                width: '100%',
                minHeight: '149px',
                borderRadius: '8px',
                border: '2px dashed #0A1D39',
                backgroundColor: '#027BDA2E',
                cursor: 'pointer',
                gap: 2,
                p: 3,
                mb: uploadedFiles.length > 0 ? '24px' : 0,
                mx: 'auto'
              }}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                hidden
              />
              <FaFileUpload style={{ fontSize: 40, color: '#215167' }} />
              <Typography
                sx={{
                  fontFamily: 'Montserrat',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  color: '#6D6D6D'
                }}
              >
                Document Attachment (PDF, JPG, PNG)
              </Typography>
            </Box>
            )}

            {/* Already Uploaded Attachments */}
            {requestDetails?.uploaded && requestDetails.attachments?.length > 0 && (
              <Box sx={{ mt: '24px' }}>
                {/* <Typography
                  sx={{
                    fontFamily: 'Montserrat',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    fontSize: '18px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#094C81',
                    mb: '16px'
                  }}
                >
                  Document Attachments
                </Typography> */}
                <Grid container spacing={2}>
                  {requestDetails.attachments
                    .filter(file => file.file_path)
                    .map((file, index) => {
                      const normalizedPath = file.file_path.replace(/\\/g, "/");
                      const fileUrl = `${import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000'}${normalizedPath}`;
                      const fileName = file.file_name || `File ${index + 1}`;
                      
                      return (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              maxWidth: '331px',
                              width: '100%',
                              height: '66px',
                              borderRadius: '9px',
                              pt: '20px',
                              pr: '16px',
                              pb: '20px',
                              pl: '16px',
                              backgroundColor: '#E8EEFD'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                              <FaFile style={{ fontSize: 24, color: '#424242' }} />
                              <Box>
                                <Typography
                                  sx={{
                                    fontFamily: 'Montserrat',
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    color: '#424242',
                                    mb: 0.5
                                  }}
                                >
                                  {truncateFileName(fileName)}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: 'Montserrat',
                                    fontWeight: 400,
                                    fontSize: '14px',
                                    color: '#9E9E9E'
                                  }}
                                >
                                  Uploaded
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleViewFile(file, false)}
                              sx={{ color: '#2196F3' }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      );
                    })}
                </Grid>
              </Box>
            )}

            {/* Document Attachments List */}
            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: '24px' }}>
                {/* <Typography
                  sx={{
                    fontFamily: 'Montserrat',
                    fontWeight: 600,
                    fontStyle: 'normal',
                    fontSize: '18px',
                    lineHeight: '100%',
                    letterSpacing: '0%',
                    color: '#094C81',
                    mb: '16px'
                  }}
                >
                  Document Attachments
                </Typography> */}

                <Grid container spacing={2}>
                  {uploadedFiles.map((file) => (
                    <Grid item xs={12} sm={6} key={file.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          maxWidth: '331px',
                          width: '100%',
                          height: '66px',
                          borderRadius: '9px',
                          pt: '20px',
                          pr: '16px',
                          pb: '20px',
                          pl: '16px',
                          backgroundColor: '#E8EEFD'
                        }}
                      >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <FaFile style={{ fontSize: 24, color: '#424242' }} />
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: 'Montserrat',
                              fontWeight: 400,
                              fontSize: '16px',
                              color: '#424242',
                              mb: 0.5
                            }}
                          >
                            {truncateFileName(file.name)}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'Montserrat',
                              fontWeight: 400,
                              fontSize: '14px',
                              color: '#9E9E9E'
                            }}
                          >
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewFile(file, true)}
                          sx={{ color: '#2196F3' }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteFile(file.id)}
                          sx={{ color: '#F44336' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: '31.5px' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={submitting}
                    sx={{
                      width: '116px',
                      height: '37px',
                      minWidth: '40px',
                      borderRadius: '3.61px',
                      border: '1px solid #D4D4D4',
                      backgroundColor: '#FFFFFF',
                      gap: '8px',
                      padding: '8px 16px',
                      fontFamily: 'Montserrat',
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '13px',
                      lineHeight: '120%',
                      letterSpacing: '0.5%',
                      textAlign: 'center',
                      color: '#1414148A',
                      textTransform: 'none',
                      '&:hover': {
                        border: '1px solid #D4D4D4',
                        backgroundColor: '#FFFFFF'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CgSoftwareUpload style={{ fontSize: 16 }} />}
                    onClick={handleSubmitDocuments}
                    disabled={uploadedFiles.length === 0 || submitting}
                    sx={{
                      width: '165px',
                      height: '36px',
                      borderRadius: '3.06px',
                      gap: '7.66px',
                      padding: '7.66px',
                      backgroundColor: '#007BFF99',
                      fontFamily: 'Montserrat',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '12.25px',
                      lineHeight: '100%',
                      letterSpacing: '0%',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#007BFF99'
                      }
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Document'}
                  </Button>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Return Without Document Modal */}
      <Modal
        open={openReturnModal}
        onClose={() => {
          setOpenReturnModal(false);
          setReturnReason('');
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '500px',
            bgcolor: 'background.paper',
            borderRadius: '8px',
            p: 3,
            outline: 'none'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Return Without Documents
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please provide a reason why the documents cannot be provided.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter reason..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenReturnModal(false);
                setReturnReason('');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReturnEmpty}
              disabled={!returnReason.trim() || submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackOpen(false)} 
          severity={snackSeverity} 
          sx={{ width: '100%' }}
          variant="standard"
        >
          {snackMessage}
        </Alert>
      </Snackbar>

      {/* Evidence Preview Modal */}
      {currentPreviewFile && (
        <EvidencePreviewModal
          open={previewModalOpen}
          onClose={handleClosePreview}
          evidences={allFilesForPreview}
          currentEvidence={currentPreviewFile}
          currentDocIndex={currentPreviewIndex}
          evidenceSrc={currentPreviewFile.url}
          isImageEvidence={isImageFile}
          canManageEvidence={false}
          showRejectionField={false}
          comment=""
          onCommentChange={() => {}}
          onApproveEvidence={() => {}}
          onRejectClick={() => {}}
          onConfirmReject={() => {}}
          onCancelRejection={() => {}}
          onPrevious={handlePreviousFile}
          onNext={handleNextFile}
        />
      )}
    </Box>
  );
}
