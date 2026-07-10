import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  CircularProgress,
  useTheme
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import federalOfficeService from '../../../service/federalOffice.service';
import StandardTable from '../../../components/common/StandardTable';
import { getStatusMeta } from '../../../utils/statusColors';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const A4_WIDTH = 850;
const A4_MIN_HEIGHT = 1000;
const FEDERAL_LETTER_TYPES = ['federal_office_notice', 'federal_office_forwarding'];

/**
 * List of decided cases with letters targeted to federal offices.
 */
const FederalOfficeIndex = () => {
  const theme = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    fetchCases();
  }, [page, rowsPerPage]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await federalOfficeService.getCases(page + 1, rowsPerPage);
      setData(response.cases || []);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching federal office cases:', error);
      setSnackbar({
        open: true,
        message: 'Unable to load cases. Please refresh the page.',
        severity: 'error'
      });
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => data.map((item, index) => {
    const complaint = item.complaint || item.disciplinary_complaint;
    const applicantName =
      complaint?.applicant?.full_name ||
      [complaint?.applicant?.first_name, complaint?.applicant?.last_name].filter(Boolean).join(' ') ||
      'Anonymous';
    const letters = item?.decision?.letters || [];
    return {
      id: item.case_id || index,
      rowNumber: page * rowsPerPage + index + 1,
      caseNumber: item.case_number || 'N/A',
      applicant: applicantName,
      caseType: item.caseType?.name || item.case_type || 'N/A',
      decisionStatus: item.decision?.status?.name || 'Decided',
      status: item.status,
      letters,
      decision: item.decision,
      raw: item
    };
  }), [data, page, rowsPerPage]);

  const tableColumns = useMemo(() => [
    { id: 'rowNumber', label: 'No.', width: '70px' },
    { id: 'caseNumber', label: 'Case Number', sortable: true },
    { id: 'applicant', label: 'Applicant', sortable: true },
    { id: 'caseType', label: 'Case Type', sortable: true },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const prog = getStatusMeta(theme, row.status);
        return (
          <Box
            sx={{
              display: 'inline-block',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              color: prog?.color || '#777',
              fontWeight: 'bold',
              fontSize: 12
            }}
          >
            {prog?.label || 'Pending'}
          </Box>
        );
      }
    },
    {
      id: 'action',
      label: 'Action',
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleView(row);
            }}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': { backgroundColor: '#e0e0e0' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ], [theme]);

  const handleView = (row) => {
    const targetLetter = row.letters?.find((l) => FEDERAL_LETTER_TYPES.includes(l.letter_type)) || row.letters?.[0];
    setSelectedCase(row.raw);
    setSelectedLetter(targetLetter || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCase(null);
    setSelectedLetter(null);
  };

  const documentBase = (import.meta.env.VITE_DOCUMENT_URL || 'http://localhost:4000/').replace(/\/?$/, '/');

  const handleOpenFile = (letter) => {
    if (!letter?.file_path) return;
    const url = `${documentBase}${letter.file_path.replace(/^\//, '')}`;
    window.open(url, '_blank');
  };

  const handlePrint = (letter) => {
    if (!letter) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Letter</title></head>
        <body style="margin:16px;">${letter.letter_content || ''}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    const target = previewRef.current;
    const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeightMm = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightMm);
    pdf.save(`federal_letter_${selectedCase?.case_number || 'case'}.pdf`);
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 0 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" color={theme.palette.primary.main} sx={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", fontSize: '22px' }} mb={0.5}>
          Federal Office Letters
        </Typography>
        {/* <Typography variant="body1" color="text.secondary">
          Decided cases with letters addressed to the federal office.
        </Typography> */}
      </Box>

      <StandardTable
        columns={tableColumns}
        rows={rows}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event, value) => {
          setRowsPerPage(value);
          setPage(0);
        }}
        initialSort={{ id: 'rowNumber', direction: 'asc' }}
      />

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth={false}
        sx={{
          '& .MuiDialog-paper': {
            maxWidth: '950px',
            width: '100%'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700} color="#2E3180">
            Letter Preview
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {!selectedLetter ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography color="text.secondary">No letter available for this case.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.5,
                  p: 1.5,
                  border: '1px solid #e5e7eb',  
                  borderRadius: 2,
                  backgroundColor: '#f9fafb'
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedLetter.created_at && (
                    <Chip
                      label={new Date(selectedLetter.created_at).toLocaleDateString()}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedLetter.file_path && (
                    <Button variant="outlined" onClick={() => handleOpenFile(selectedLetter)} sx={{ textTransform: 'none' }}>
                      Open PDF
                    </Button>
                  )}
                  <Button startIcon={<PrintIcon />} onClick={() => handlePrint(selectedLetter)} disabled={!selectedLetter} sx={{ textTransform: 'none' }}>
                    Print
                  </Button>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadPdf}
                    disabled={!selectedLetter || !selectedLetter.letter_content}
                    sx={{ textTransform: 'none' }}
                  >
                    Download
                  </Button>
                </Box>
              </Box>

              {selectedLetter.letter_content && (
                <Paper
                  ref={previewRef}
                  elevation={1}
                  sx={{
                    width: '100%',
                    maxWidth: `${A4_WIDTH}px`,
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
                  <div dangerouslySetInnerHTML={{ __html: selectedLetter.letter_content }} />
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {loading && (
        <Box sx={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default FederalOfficeIndex;

