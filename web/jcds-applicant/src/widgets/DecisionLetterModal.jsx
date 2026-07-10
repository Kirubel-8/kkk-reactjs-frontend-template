import React, { useRef } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
} from "@material-tailwind/react";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH = 794;
const A4_MIN_HEIGHT = 1123;

/**
 * Modal to display and print decision letters.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.letter - Letter object with letter_content and letter_type
 * @param {string} props.caseNumber - Case number for PDF filename
 */
const DecisionLetterModal = ({ isOpen, onClose, letter, caseNumber }) => {
  const contentRef = useRef(null);

  if (!letter) return null;

  const handlePrint = () => {
    const printContent = contentRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Decision Letter - ${caseNumber || "Letter"}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: 'Nyala', 'Times New Roman', serif; 
              font-size: 14px;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = async () => {
    const content = contentRef.current;
    if (!content) return;

    try {
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`decision_letter_${caseNumber || "document"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const getLetterTypeLabel = (type) => {
    const labels = {
      complainant_letter: "Letter to Complainant",
      judge_letter: "Letter to Judge",
    };
    return labels[type] || type;
  };

  return (
    <Dialog
      open={isOpen}
      handler={onClose}
      size="xl"
      className="!max-w-[900px] !w-[95%]"
    >
      <DialogHeader className="flex items-center justify-between">
        <Typography variant="h5" className="text-primary">
          {getLetterTypeLabel(letter.letter_type)}
        </Typography>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </DialogHeader>

      <DialogBody className="!max-h-[70vh] !overflow-y-auto bg-gray-50 p-4">
        {/* A4 Letter Preview */}
        <div
          ref={contentRef}
          className="bg-white mx-auto shadow-lg"
          style={{
            width: `${A4_WIDTH}px`,
            minHeight: `${A4_MIN_HEIGHT}px`,
            padding: "60px",
            fontFamily: '"Nyala", "Times New Roman", serif',
            fontSize: "14px",
            lineHeight: "1.6",
          }}
          dangerouslySetInnerHTML={{ __html: letter.letter_content }}
        />
      </DialogBody>

      <DialogFooter className="flex justify-end gap-3">
        <Button
          variant="outlined"
          onClick={handlePrint}
          className="flex items-center gap-2"
        >
          <PrinterIcon className="w-4 h-4" />
          Print
        </Button>
        <Button
          variant="filled"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-primary"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Download PDF
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default DecisionLetterModal;
