
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Paper,
  Stack,
  Modal
} from '@mui/material';
import { 
  DeleteOutline, 
  CloudUpload, 
  ArrowBack, 
  Description, 
  Image as ImageIcon,
  WarningAmber,
  VisibilityOutlined
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import courtOfficeService from 'service/courtOffice.service';
import { DeliveredProcedureOutlined } from '@ant-design/icons';

export default function UploadDocuments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = location.state || {};

  console.log("ggggggg", id);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [files, setFiles] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnSection, setShowReturnSection] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [openDoc, setOpenDoc] = useState(null);


  useEffect(() => {
    if (!id) {
      navigate('/court-office/requests');
      return;
    }
    fetchDetails();
  }, [id]);

  // const fetchDetails = async () => {
  //   try {
  //     const response = await courtOfficeService.getRequestById(id);
  //     setRequestDetails(response.data);
  //   } catch (error) {
  //     console.error('Error fetching details:', error);
  //     setSnackMessage('Error fetching request details');
  //     setSnackSeverity('error');
  //     setSnackOpen(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await courtOfficeService.getRequestById(id);
      const caseData = response.data;
      const complaint = caseData.disciplinary_complaint || {};
      const courtReq = caseData.courtOfficeRequest || {};

      console.log("KKKKSSS", caseData);
      console.log("KKKKSSSj", complaint);
  
      // Set main data
      setRequestDetails({
        caseId: caseData.case_id,
        fileNumber: complaint.file_number,
        judgeName: complaint.judge_name,
        status: courtReq.court_office_document_request_status,
        requestedAt: courtReq.court_office_requested_at,
        deliveredAt: courtReq.court_office_delivered_at,
        reason: courtReq.court_office_request_reason,
        attachments: caseData.attachments || [],
        uploaded: (caseData.courtOfficeRequest?.court_office_document_request_status === "fulfilled")
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
  
  useEffect(() => {
    if (!id) {
      navigate('/court-office/requests');
      return;
    }
    fetchDetails();
  }, [id]);  

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setSubmitting(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await courtOfficeService.uploadDocuments(id, formData);
      setSnackMessage('Documents uploaded and send successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      // setTimeout(() => navigate('/court-office/requests'), 1500);
      await fetchDetails();
      setFiles([]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setSnackMessage('Failed to upload documents');
      setSnackSeverity('error');
      setSnackOpen(true);
       } finally {
    setSubmitting(false); //reset submitting button
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
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return <ImageIcon color="primary" />;
    if (fileName.match(/\.(pdf)$/i)) return <Description color="error" />;
    return <Description color="action" />;
  };

  const handleOpenUploadedFile = (file) => {
    // file object should include: name, type, url
    const fileUrl = URL.createObjectURL(file); // for local files
    setOpenDoc({ 
      name: file.name, 
      type: file.type, 
      url: fileUrl 
    });
  };
  
  const handleCloseDoc = () => {
    setOpenDoc(null);
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
        return status;
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/court-office/requests')}
          sx={{ mr: 2, bgcolor: '#fff', boxShadow: 1, '&:hover': { bgcolor: '#f5f5f5' } }}
        >
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E3180', fontFamily: "'Montserrat', sans-serif" }}>
            Upload Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Case File: {requestDetails?.file_number}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Upload Area */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #E0E0E0',
              minHeight: 300,
              p: 2
            }}
          >
            <CardContent sx={{ p: 4 }}>
            {(!requestDetails?.uploaded || requestDetails.attachments?.length === 0) && (
              <>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Attach Requested Files
              </Typography>
              <Box
                component="label"
                sx={{
                  border: '2px dashed #2E3180',
                  borderRadius: '12px',
                  p: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: 'rgba(46, 49, 128, 0.02)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(46, 49, 128, 0.05)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
                <CloudUpload sx={{ fontSize: 64, color: '#2E3180', mb: 2 }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                  Click to Upload or Drag Files Here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: PDF, JPG, PNG, DOCX (Max 10MB)
                </Typography>
              </Box>
              </>
              )}
              {files.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Selected Files ({files.length})
                  </Typography>

                  <Grid container spacing={2}>
                    {files.map((file, index) => (
                      <Grid item xs={6} sm={3} key={index}> {/* Up to 4 per row */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          {/* File Name */}
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              mr: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {file.name}
                          </Typography>

                          {/* Preview Icon */}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenUploadedFile(file)}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>

                          {/* Delete Icon */}
                          <IconButton
                            size="small"
                            onClick={() => removeFile(index)}
                            sx={{ color: '#ff4d4f' }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {requestDetails?.uploaded && requestDetails.attachments?.length > 0 && (
                <Box sx={{ mt: 0 }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    <DeliveredProcedureOutlined></DeliveredProcedureOutlined> Delivered Files
                  </Typography>

                  <Grid container spacing={2}>
                    {requestDetails.attachments
                     .filter(file => file.file_path) // only files with a path
                     .map((file, index) => {
                      // FIX: convert backslashes to forward slashes for browser
                      const normalizedPath = file.file_path.replace(/\\/g, "/");
                      
                      const fileUrl = `${import.meta.env.DOCUMENT_BASE_URL || "http://localhost:4000"}${normalizedPath}`;

                      return (
                        <Grid item xs={6} sm={3} key={index}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              border: "1px solid #eee",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              "&:hover": { boxShadow: 3 }
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                flex: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {file.file_name || "Unnamed File"}
                            </Typography>

                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                setOpenDoc({
                                  name: file.file_name || "Unnamed File",
                                  url: fileUrl,
                                  type: file.file_name?.endsWith(".pdf")
                                    ? "application/pdf"
                                    : "image/*",
                                })
                              }
                            >
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* document modal */}
              <AnimatePresence>
                {openDoc && (
                  <Modal
                    open
                    onClose={handleCloseDoc}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(2px)",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      p: 1.5,
                      height: "100vh !important",
                    }}
                  >
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      sx={{
                        position: "relative",
                        width: { xs: "95%", sm: "85%", md: "70%" },
                        maxWidth: 950,
                        bgcolor: "#ffffff",
                        borderRadius: 4,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                        p: { xs: 3, sm: 4 },
                        outline: "none",
                        maxHeight: "95vh",
                        height: "92vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Modal Header */}
                      <Typography
                        variant="h6"
                        align="center"
                        sx={{ fontWeight: 700, mb: 1 }}
                      >
                        Document Preview
                      </Typography>

                      {/* Description */}
                      <Typography
                        align="center"
                        sx={{ mb: 2, color: "text.secondary", fontSize: "0.95rem" }}
                      >
                        {openDoc.description || openDoc.name || "No description"}
                      </Typography>

                      {/* File Preview */}
                      <Box
                        sx={{
                          flex: 1,
                          minHeight: 300,
                          border: "1px solid #ddd",
                          borderRadius: 2,
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#fafafa",
                          mb: 2,
                        }}
                      >
                        {openDoc.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif)$/i.test(openDoc.name) ? (
                          <img
                            src={openDoc.url}
                            alt="Document"
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        ) : /\.(pdf)$/i.test(openDoc.name) || openDoc.type === "application/pdf" ? (
                          <iframe
                            src={openDoc.url}
                            title="Document"
                            style={{ width: "100%", height: "100%", border: "none" }}
                          />
                        ) : (
                          <Box sx={{ textAlign: "center", p: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              Cannot preview this file.
                            </Typography>
                            <Button
                              variant="contained"
                              href={openDoc.url}
                              target="_blank"
                              download
                            >
                              Download File
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {/* Footer */}
                      <Typography
                        align="center"
                        sx={{ mt: 1, fontSize: "0.85rem", color: "text.disabled", fontStyle: "italic" }}
                      >
                        Review the document you send to.
                      </Typography>
                    </Box>
                  </Modal>
                )}
              </AnimatePresence>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleUpload}
                  disabled={files.length === 0 || submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  sx={{
                    borderRadius: '30px',
                    px: 4,
                    py: 1.5,
                    bgcolor: '#2E3180',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1A1C60' }
                  }}
                >
                  {submitting ? 'Uploading...' : 'Submit Documents'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Info & Alternative Actions */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Request Info Card */}
            <Card 
              sx={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #E0E0E0'
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Request Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">File Number</Typography>
                    <Typography variant="body1" fontWeight={500}>{requestDetails?.fileNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Judge Name</Typography>
                    <Typography variant="body1" fontWeight={500}>{requestDetails?.judgeName}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Requested Date</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {requestDetails?.requestedAt
                        ? new Date(requestDetails.requestedAt).toLocaleDateString() 
                        : '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Delivered Date</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {requestDetails?.deliveredAt
                        ? new Date(requestDetails.deliveredAt).toLocaleDateString() 
                        : '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        display: 'inline-block',
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: '4px',
                        bgcolor: 'rgba(99, 97, 97, 0.1)',
                        color: 'rgb(6, 180, 0)',
                        fontWeight: 700,
                        mt: 0.5,
                        mr: 0.5,
                        ml: 1.5
                      }}
                    >
                      {getStatusLabel(requestDetails?.status)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Return Empty Section */}
            {(!requestDetails?.uploaded || requestDetails.attachments?.length === 0) && (
            <Card 
              sx={{ 
                borderRadius: '16px', 
                boxShadow: 'none',
                border: '1px solid #ffccc7',
                bgcolor: '#fff1f0'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WarningAmber color="error" />
                  <Typography variant="subtitle1" fontWeight={600} color="error">
                    Unable to fulfill?
                  </Typography>
                </Box>
                
                {!showReturnSection ? (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth
                    onClick={() => setShowReturnSection(true)}
                    sx={{ borderRadius: '20px', textTransform: 'none' }}
                  >
                    Return Without Documents
                  </Button>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Please provide a reason why the documents cannot be provided.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Enter reason..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      sx={{ bgcolor: '#fff', mb: 2 }}
                      size="small"
                    />
                    <Stack direction="row" spacing={1}>
                      <Button 
                        variant="contained" 
                        color="error" 
                        fullWidth
                        onClick={handleReturnEmpty}
                        disabled={!returnReason.trim() || submitting}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                      >
                        Submit
                      </Button>
                      <Button 
                        variant="text" 
                        color="inherit"
                        onClick={() => setShowReturnSection(false)}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

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

    </Box>
  );
}
