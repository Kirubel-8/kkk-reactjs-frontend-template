import React, { useState } from 'react';
import { Box, Card, Typography, Button, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { FaFileAlt } from 'react-icons/fa';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommonModal from './CommonModal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Renders a description section with "See more" modal functionality - Matching viewDetailComplaint3 style
 */
const DescriptionSection = ({ title, content, onViewMore }) => {
  const shouldTruncate = content && content.length > 100;
  const displayContent = shouldTruncate ? `${content.substring(0, 100)}......` : content;

  if (!content) return null;

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          fontSize: '18px',
          color: '#215167'
        }}
      >
        {title}
      </Typography>
      <Divider sx={{ mt: '16px', borderColor: '#E8E8E8' }} />
      <Box sx={{ mt: '16px' }}>
        <Typography
          component="span"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 500,
            fontSize: '16px',
            color: '#2c2c2c'
          }}
        >
          {displayContent}
        </Typography>
        {shouldTruncate && (
          <Button
            onClick={() => onViewMore(title, content)}
            sx={{
              textTransform: 'none',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: '16px',
              color: '#3BA1F5',
              ml: '4px',
              p: 0,
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.8
              }
            }}
            disableRipple
          >
            See more
          </Button>
        )}
      </Box>
    </Box>
  );
};

/**
 * Renders the Decision Status section styled as a card with title, divider, and two-column content.
 */
export const DecisionStatusSection = ({ statusName, description, hasRecommendation }) => {
  if (!hasRecommendation) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #E0E0E0',
        p: '24px'
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          color: '#094C81',
          fontSize: '18px',
          fontWeight: 600,
          mb: 2
        }}
      >
        Recommended Decision
      </Typography>

      <Box sx={{ height: '1px', backgroundColor: '#E8E8E8', mb: '16px' }} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.4
          }}
        >
          {statusName || 'Unknown decision'}
        </Typography>
        {description && (
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#212121',
              lineHeight: 1.4
            }}
          >
            Description: {description || '—'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/**
 * Renders the Case Type & Assignment section styled as a card with title, divider, and grid layout.
 */
export const CaseTypeCommitteeSection = ({ caseType, assignedCommittee }) => {
  if (!caseType && !assignedCommittee) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #E0E0E0',
        p: '24px'
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Montserrat', sans-serif",
          color: '#094C81',
          fontSize: '18px',
          fontWeight: 600,
          mb: 2
        }}
      >
        Case Type
      </Typography>

      <Box sx={{ height: '1px', backgroundColor: '#E8E8E8', mb: '16px' }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
          gap: 2,
          mb: 1.5
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#64748b'
          }}
        >
          Case Type:
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.4
          }}
        >
          {caseType?.name || 'Not assigned'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
          gap: 2,
          mb: assignedCommittee ? 1.5 : 0
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#64748b'
          }}
        >
          Status:
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#212121',
            lineHeight: 1.4
          }}
        >
          {`Assigned to ${assignedCommittee?.name}` || 'Not assigned to a department yet'}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * Renders a description action bar using the same attachment frame style,
 * with built-in download and print controls.
 */
const DescriptionActionBar = ({ title, onDownload, onPrint }) => (
  <Box
    sx={{
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: '100%',
      height: '64px',
      py: '20px',
      px: '16px',
      mb: '16px',
      backgroundColor: '#E8EEFD'
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
      <Box
        sx={{
          width: '48px',
          height: '48px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative'
        }}
      >
        <FaFileAlt
          style={{
            width: '24px',
            height: '32px',
            color: '#215167',
            position: 'absolute',
            top: '8px',
            left: '12px'
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, ml: '16px', minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: '16px',
            color: '#0A1D39',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title || 'Description'}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 400,
            fontSize: '14px',
            color: '#949494',
            mt: '4px'
          }}
        >
          Download or print this description
        </Typography>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', ml: '16px' }}>
      <button
        type="button"
        onClick={onDownload}
        style={{
          width: '20px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0
        }}
        aria-label="Download description"
      >
        <DownloadIcon style={{ width: '20px', height: '16px', color: '#6582CC' }} />
      </button>
      <button
        type="button"
        onClick={onPrint}
        style={{
          width: '20px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0
        }}
        aria-label="Print description"
      >
        <PrintIcon style={{ width: '20px', height: '16px', color: '#6582CC' }} />
      </button>
    </Box>
  </Box>
);

export default function ComplaintContentCard({ sections = [], decisionProps, renderDecision = true }) {
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  /**
   * Build a safe filename for the current description content.
   */
  const getDescriptionFileName = (title) => {
    if (!title) return `description_${Date.now()}.pdf`;
    const safeTitle =
      title
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]+/g, '')
        .replace(/(^_|_$)/g, '') || 'description';
    return `${safeTitle}_${Date.now()}.pdf`;
  };

  const handleViewMore = (title, content) => {
    setModalContent({ title, content });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  /**
   * Download the current description content as a PDF file.
   */
  const handleDownloadDescription = async () => {
    if (!modalContent.content) {
      return;
    }

    setSaving(true);
    try {
      // Create a temporary container for PDF generation with title
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
      tempDiv.style.padding = '24px';
      tempDiv.style.backgroundColor = '#ffffff';

      // Add title if available
      if (modalContent.title) {
        const titleElement = document.createElement('div');
        titleElement.style.fontFamily = "'Montserrat', sans-serif";
        titleElement.style.fontWeight = '600';
        titleElement.style.fontSize = '20px';
        titleElement.style.lineHeight = '1.4';
        titleElement.style.color = '#094C81';
        titleElement.style.marginBottom = '16px';
        titleElement.style.textAlign = 'left';
        titleElement.textContent = modalContent.title;
        tempDiv.appendChild(titleElement);
      }

      // Add content
      const contentElement = document.createElement('div');
      contentElement.style.fontFamily = "'Montserrat', sans-serif";
      contentElement.style.fontWeight = '500';
      contentElement.style.fontSize = '16px';
      contentElement.style.lineHeight = '1.6';
      contentElement.style.color = '#073954';
      contentElement.style.whiteSpace = 'pre-wrap';
      contentElement.style.textAlign = 'left';
      contentElement.style.wordWrap = 'break-word';
      contentElement.style.color = "#2c2c2c"
      contentElement.textContent = modalContent.content;
      tempDiv.appendChild(contentElement);

      document.body.appendChild(tempDiv);

      // Wait a bit for rendering to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Remove temporary element
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Set margins for formal document formatting
      const marginTop = 20; // 20mm top margin
      const marginBottom = 20; // 20mm bottom margin
      const marginLeft = 20; // 20mm left margin
      const marginRight = 20; // 20mm right margin
      const contentWidth = pdfWidth - marginLeft - marginRight; // Available width for content
      const contentHeight = pdfHeight - marginTop - marginBottom; // Available height for content

      // Calculate dimensions to fit content within margins
      const imgWidthMm = contentWidth;
      const imgHeightMm = (canvas.height * contentWidth) / canvas.width;

      // If content fits on one page, add it with margins
      if (imgHeightMm <= contentHeight) {
        pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, imgWidthMm, imgHeightMm);
      } else {
        // Content spans multiple pages - split into pages with margins
        const pageContentHeight = contentHeight;
        const pageHeightPx = (canvas.width * pageContentHeight) / contentWidth;
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
          const displayHeightMm = (sourceHeight * contentWidth) / canvas.width;

          // Add image with proper margins
          pdf.addImage(pageImgData, 'JPEG', marginLeft, marginTop, imgWidthMm, displayHeightMm);
        }
      }

      const fileName = getDescriptionFileName(modalContent.title);
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Print the current description content.
   */
  const handlePrintDescription = () => {
    if (!modalContent.content) return;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    const doc = printWindow.document;
    doc.write('<!DOCTYPE html><html lang="en"><head><title></title></head><body></body></html>');
    doc.close();
    const container = doc.createElement('div');
    container.style.padding = '24px';
    container.style.fontFamily = "'Montserrat', sans-serif";
    container.style.color = '#073954';
    container.style.fontSize = '16px';
    container.style.whiteSpace = 'pre-wrap';
    container.textContent = modalContent.content;
    doc.body.appendChild(container);
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      <Box>
        {/* Description Sections - Add spacing between them like in viewDetailComplaint3 */}
        {sections.map((section, index) => (
          <Box key={index} sx={{ mb: index < sections.length - 1 ? '32px' : 0 }}>
            <DescriptionSection title={section.title} content={section.content} onViewMore={handleViewMore} />
          </Box>
        ))}

        {/* Decision Status Placeholder */}
        {renderDecision && <DecisionStatusSection {...decisionProps} />}
      </Box>

      {/* Full Content Modal - Matching viewDetailComplaint3 style */}
      <CommonModal
        open={openModal}
        onClose={handleCloseModal}
        title={modalContent.title}
        onDownload={handleDownloadDescription}
        saving={saving}
        width="850px"
        hideCloseIcon={false}
        showCloseButton={false}
      >
        <Box
          sx={{
            padding: '24px',
            backgroundColor: '#ffffff'
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#2c2c2c',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              wordWrap: 'break-word'
            }}
          >
            {modalContent.content}
          </Typography>
        </Box>
      </CommonModal>
    </>
  );
}
