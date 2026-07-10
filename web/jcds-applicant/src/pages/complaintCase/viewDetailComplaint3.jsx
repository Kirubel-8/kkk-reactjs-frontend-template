import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PencilIcon, TrashIcon, PrinterIcon, EyeIcon, DocumentIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { FaLessThan, FaFileAlt } from "react-icons/fa";
import { MdDelete, MdOutlineMessage } from "react-icons/md";
import { RxUpdate } from "react-icons/rx";
import { toast } from "react-toastify";
import complaintService from "@/service/complaint.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import PreviewModal from "../requestManagement/document-preview-modal";
import ConfirmDialog from "../requestManagement/delete-modal";
import { EtLocalizationProvider } from "habesha-datepicker-v2";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PiLessThanBold } from "react-icons/pi";

const ViewDetailComplaint3 = () => {
  const navigate = useNavigate();
  const { complaintId } = useParams();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null, title: null });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [allWitnessesModal, setAllWitnessesModal] = useState(false);
  const [descriptionModal, setDescriptionModal] = useState({ isOpen: false, title: "", content: "" });
  const [fileUploadPreviewModal, setFileUploadPreviewModal] = useState({ isOpen: false, file: null, evidenceId: null, type: null, previewUrl: null });
  const [evidenceActionLoading, setEvidenceActionLoading] = useState(false);
  const [evidenceFileErrors, setEvidenceFileErrors] = useState({});
  const [issueText, setIssueText] = useState("");
  const [raisingIssue, setRaisingIssue] = useState(false);
  const [allRejections, setAllRejections] = useState([]);
  const [loadingRejections, setLoadingRejections] = useState(false);
  
  // Refs for scrolling to bottom - must be at top level
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const letterPreviewRef = useRef(null);
  const descriptionModalContentRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const fullRequestId = location.state?.fullComplaintId || complaintId;

  const fetchRequestDetails = useCallback(async () => {
    if (!fullRequestId) {
      setError("No complaint ID provided");
      setLoading(false);
      stopLoading();
      return;
    }

    if (isDeleting) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await complaintService.getComplaintById(fullRequestId);
      console.log('Complaint data:', response);
      setRequestData(response);
    } catch (error) {
      console.error("Error fetching complaint details:", error);
      setError(error.message || "Failed to load complaint details");
      toast.error(error.message || "Failed to load complaint details");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [fullRequestId, isDeleting, stopLoading]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // Fetch all rejections for the complaint
  const fetchAllRejections = useCallback(async () => {
    if (!fullRequestId) return;

    try {
      setLoadingRejections(true);
      const rejections = await complaintService.getComplaintRejections(fullRequestId);
      setAllRejections(Array.isArray(rejections) ? rejections : []);
    } catch (error) {
      console.error("Error fetching rejections:", error);
      // Don't show error toast, just log it - rejections are optional
      setAllRejections([]);
    } finally {
      setLoadingRejections(false);
    }
  }, [fullRequestId]);

  useEffect(() => {
    if (fullRequestId) {
      fetchAllRejections();
    }
  }, [fetchAllRejections]);
  
  // Scroll to bottom when messages change - must be before any early returns
  useEffect(() => {
    if (scrollContainerRef.current && messagesEndRef.current) {
      const witnesses = requestData?.witnesses || [];
      const evidences = requestData?.evidences || [];
      
      const rejectedEvidences = evidences.filter(evidence => 
        (evidence.file_status === "rejected" || evidence.status === "rejected" || 
         evidence.file_status === "returned" || evidence.status === "returned") && 
        (evidence.rejection_reason || evidence.rejectionReason)
      );
      
      // Check if there are any rejections to display
      const hasRejections = rejectedEvidences.length > 0 || allRejections.length > 0;
      
      if (hasRejections) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
        }, 100);
    }
    }
  }, [requestData, allRejections]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getShortId = (id) => {
    if (!id) return "";
    const idString = String(id);
    return idString.length > 8 ? idString.substring(0, 8) : idString;
  };

  // Convert Gregorian date to Ethiopian Calendar format
  const convertToEthiopianDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const gregorianYear = date.getFullYear();
      const gregorianMonth = date.getMonth() + 1; // 1-12
      const gregorianDay = date.getDate();
      
      // Ethiopian calendar conversion using standard algorithm
      // Ethiopian New Year is on September 11 (or 12 in leap years)
      
      // Check if Gregorian year is a leap year
      const isGregorianLeap = (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || (gregorianYear % 400 === 0);
      const newYearDay = isGregorianLeap ? 12 : 11;
      
      // Calculate Ethiopian year
      // Ethiopian calendar is approximately 7-8 years behind Gregorian
      // If date is before Ethiopian New Year (Sept 11/12), it's still the previous Ethiopian year
      let ethiopianYear = gregorianYear - 7;
      if (gregorianMonth < 9 || (gregorianMonth === 9 && gregorianDay < newYearDay)) {
        ethiopianYear -= 1;
      }
      
      // Calculate day of year in Ethiopian calendar
      let dayOfYear;
      if (gregorianMonth > 9 || (gregorianMonth === 9 && gregorianDay >= newYearDay)) {
        // After Ethiopian New Year (Sept 11/12 to Dec 31)
        const startDate = new Date(gregorianYear, 8, newYearDay); // September
        const currentDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
        dayOfYear = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
      } else {
        // Before Ethiopian New Year (Jan 1 to Sept 10/11)
        const prevYearNewYear = isGregorianLeap ? 12 : 11;
        const prevYearStart = new Date(gregorianYear - 1, 8, prevYearNewYear);
        const yearStart = new Date(gregorianYear, 0, 1);
        const currentDate = new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
        
        const daysFromPrevNewYear = Math.floor((yearStart - prevYearStart) / (24 * 60 * 60 * 1000));
        const daysFromYearStart = Math.floor((currentDate - yearStart) / (24 * 60 * 60 * 1000));
        dayOfYear = daysFromPrevNewYear + daysFromYearStart + 1;
      }
      
      // Determine month and day (each month has 30 days except Pagume)
      let ethiopianMonth = Math.ceil(dayOfYear / 30);
      let ethiopianDay = dayOfYear % 30;
      
      if (ethiopianDay === 0) {
        ethiopianDay = 30;
        ethiopianMonth -= 1;
      }
      
      // Handle Pagume (13th month) - 5 or 6 days
      const isEthiopianLeap = (ethiopianYear % 4 === 3);
      const pagumeDays = isEthiopianLeap ? 6 : 5;
      
      if (ethiopianMonth > 12) {
        if (dayOfYear <= 360 + pagumeDays) {
          ethiopianMonth = 13; // Pagume
          ethiopianDay = dayOfYear - 360;
        } else {
          // Should not happen, but handle edge case
          ethiopianMonth = 1;
          ethiopianDay = dayOfYear - 360 - pagumeDays;
          ethiopianYear += 1;
        }
      }
      
      // Ethiopian month names
      const ethiopianMonths = [
        "መስከረም", "ጥቅምት", "ሕዳር", "ታኅሣሥ", "ጥር", "የካቲት",
        "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
      ];
      
      const monthName = ethiopianMonths[ethiopianMonth - 1] || `Month ${ethiopianMonth}`;
      
      return `${monthName} ${ethiopianDay}, ${ethiopianYear}`;
    } catch (error) {
      console.error("Error converting to Ethiopian date:", error);
      return "N/A";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      pending_director_approval: "Pending",
      under_investigation: "Under Investigation",
      under_council_review: "Under Council Review",
      accepted: "Accepted",
      decided: "Decided",
      rejected: "Rejected"
    };
    return statusMap[status] || status || "Pending";
  };

  const getStatusColor = (status) => {
    if (!status) return "#3BA1F5";
    const normalizedStatus = status.toLowerCase();
    const colorMap = {
      pending: "#F7B84B",
      pending_director_approval: "#F7B84B",
      under_investigation: "#FFD666",
      under_council_review: "#4C8BFF",
      accepted: "#49C178",
      returned: "#B792E8",
      rejected: "#E85A5A",
      decided: "#2E5B6D"
    };
    return colorMap[normalizedStatus] || "#3BA1F5"; // Default color if status not found
  };

  const handleBack = () => {
    navigate("/home/requests");
  };

  const handleEdit = () => {
    if (requestData?.status === "pending" || requestData?.status === "returned") {
      navigate(`/home/edit-complaint-v3/${complaintId}`, {
        state: { fullRequestId, requestData }
      });
    } else {
      toast.warning("Only pending or returned complaints can be edited");
    }
  };

  const handleDeleteComplaint = () => {
    setDeleteModal({ isOpen: true, type: "complaint" });
  };

  const handleConfirmDelete = async () => {
    const { type } = deleteModal;
    try {
      setDeleteModal({ isOpen: false, type: null });

      if (type === "complaint") {
        setIsDeleting(true);
        startLoading();
        await complaintService.deleteComplaint(fullRequestId);
        toast.success("Complaint deleted successfully");
        navigate("/home/requests");
      }
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast.error(error.message || "Failed to delete complaint");
      setIsDeleting(false);
    } finally {
      if (type === "complaint") {
        stopLoading();
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, type: null });
  };

  const handleRaiseIssue = async () => {
    if (!issueText.trim()) {
      toast.error("Please enter an issue before submitting");
      return;
    }

    try {
      setRaisingIssue(true);
      startLoading();
      await complaintService.raiseIssueComplaint(fullRequestId, {
        issue: issueText.trim()
      });
      toast.success("Issue raised successfully");
      setIssueText("");
      await fetchRequestDetails();
      await fetchAllRejections(); // Refresh rejections after raising issue
    } catch (error) {
      console.error("Error raising issue:", error);
      toast.error(error.message || "Failed to raise issue");
    } finally {
      setRaisingIssue(false);
      stopLoading();
    }
  };

  const handlePrint = async () => {
    // Get the first letter from the decision
    const firstLetter = requestData?.case?.decision?.letters?.[0];
    
    if (!firstLetter || !firstLetter.letter_content) {
      toast.error("No decision letter available to download");
      return;
    }

    setSaving(true);
    try {
      // Create a temporary container for the letter content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = firstLetter.letter_content;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px'; // A4 width in pixels at 96 DPI
      document.body.appendChild(tempDiv);

      // Wait a bit for images/fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Convert canvas dimensions from pixels to mm
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

      const caseNumber = requestData?.case?.case_number || 'unknown';
      pdf.save(`complaint_decision_letter_${caseNumber}.pdf`);

      toast.success("Decision letter downloaded successfully");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to download decision letter");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDescription = async () => {
    if (!descriptionModal.content) {
      toast.error("No content to download");
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
      if (descriptionModal.title) {
        const titleElement = document.createElement('div');
        titleElement.style.fontFamily = "'Montserrat', sans-serif";
        titleElement.style.fontWeight = '600';
        titleElement.style.fontSize = '20px';
        titleElement.style.lineHeight = '1.4';
        titleElement.style.color = '#094C81';
        titleElement.style.marginBottom = '16px';
        titleElement.style.textAlign = 'left';
        titleElement.textContent = descriptionModal.title;
        tempDiv.appendChild(titleElement);
      }
      
      // Add content
      const contentElement = document.createElement('div');
      contentElement.style.fontFamily = "'Montserrat', sans-serif";
      contentElement.style.fontWeight = '500';
      contentElement.style.fontSize = '16px';
      contentElement.style.lineHeight = '1.6';
      contentElement.style.color = '#2C2C2C';
      contentElement.style.whiteSpace = 'pre-wrap';
      contentElement.style.textAlign = 'left';
      contentElement.style.wordWrap = 'break-word';
      contentElement.textContent = descriptionModal.content;
      tempDiv.appendChild(contentElement);
      
      document.body.appendChild(tempDiv);

      // Wait a bit for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
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

      const fileName = `${descriptionModal.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);

      toast.success("Description downloaded successfully");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to download description");
    } finally {
      setSaving(false);
    }
  };

  const handleViewFile = async (fileUrl, index) => {
    if (!fileUrl) {
      toast.error("No file URL provided");
      return;
    }

    try {
      setPreviewLoading(true);
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
      
      // Calculate evidence number (index + 1)
      const evidenceNumber = index !== undefined ? index + 1 : 1;
      const evidenceTitle = `Evidence ${evidenceNumber}`;
      
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf';
      const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(fileExtension);
      const isAudio = ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'].includes(fileExtension);
      
      if (isImage || isPdf || isVideo || isAudio) {
        // For images and PDFs, try to fetch as File object for better modal handling
        try {
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Accept': '*/*',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const fileName = fileUrl.split('/').pop() || 'document';
          const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';
          const file = new File([blob], fileName, { type: contentType });
          
          setPreviewModal({ isOpen: true, file, title: evidenceTitle });
          setPreviewLoading(false);
        } catch (fetchError) {
          // Fallback to direct URL
          setPreviewModal({ isOpen: true, file: fullUrl, title: evidenceTitle });
          setPreviewLoading(false);
        }
        return;
      }
      
      // For non-previewable files (like docx), download them
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop() || 'document';
      const blobUrl = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      setPreviewLoading(false);
    } catch (error) {
      console.error("Error opening file:", error);
      setPreviewLoading(false);
      toast.error(error.message || "Failed to open file.");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null, title: null });
  };

  const handleDeleteFile = async (evidenceId) => {
    try {
      setEvidenceActionLoading(true);
      startLoading();
      await complaintService.modifyComplaintEvidence(evidenceId, "delete");
      toast.success("Evidence deleted successfully");
      await fetchRequestDetails();
    } catch (error) {
      console.error("Error deleting evidence file:", error);
      toast.error(error.message || "Failed to delete evidence file");
    } finally {
      setEvidenceActionLoading(false);
      stopLoading();
    }
  };

  const handleEvidenceFileChange = (evidenceId, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const evidenceKey = evidenceId || 'unknown';
    
    // Size validation (match new complaint upload rules)
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024;    // 50 MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024;   // 200 MB
    const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
    const AUDIO_EXTENSIONS = ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'];
    const getFileExtension = (name) => {
      const lastDot = name.lastIndexOf('.');
      return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
    };
    const fileExtension = getFileExtension(file.name || '');
    const fileType = file.type || "";
    let maxSize = MAX_DOCUMENT_SIZE;
    let sizeLabel = "10 MB";
    if (VIDEO_EXTENSIONS.includes(fileExtension) || fileType.startsWith('video/')) {
      maxSize = MAX_VIDEO_SIZE;
      sizeLabel = "200 MB";
    } else if (AUDIO_EXTENSIONS.includes(fileExtension) || fileType.startsWith('audio/')) {
      maxSize = MAX_AUDIO_SIZE;
      sizeLabel = "50 MB";
    }

    if (file.size > maxSize) {
      const toastMsg = `"${file.name || 'Selected file'}" is too large (${formatFileSize(file.size)}). Max allowed is ${sizeLabel}. Upload failed.`;
      toast.error(toastMsg);
      setEvidenceFileErrors((prev) => ({ ...prev, [evidenceKey]: "File is too large." }));
      return;
    }

    // Clear previous error for this evidence on valid selection
    setEvidenceFileErrors((prev) => {
      if (!prev[evidenceKey]) return prev;
      const updated = { ...prev };
      delete updated[evidenceKey];
      return updated;
    });

    const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', 'mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'];
    
    const canPreviewFile =
      fileType.startsWith('image/') ||
      fileType.startsWith('video/') ||
      fileType.startsWith('audio/') ||
      fileType === 'application/pdf' ||
      previewableExtensions.includes(fileExtension);
    
    const previewUrl = canPreviewFile ? URL.createObjectURL(file) : null;
    
    // Show preview modal instead of directly uploading
    setFileUploadPreviewModal({
      isOpen: true,
      file: file,
      evidenceId: evidenceId,
      type: 'replace',
      previewUrl: previewUrl,
    });
  };

  const handleConfirmFileUpload = async () => {
    const { file, evidenceId, type } = fileUploadPreviewModal;

    if (!file) {
      toast.error("No file selected");
      return;
    }

    try {
      setEvidenceActionLoading(true);
      startLoading();
      
      if (type === 'replace' && evidenceId) {
        await complaintService.modifyComplaintEvidence(evidenceId, "replace", file);
        toast.success("File replaced successfully");
      }

      // Refresh data first
      await fetchRequestDetails();

      // Close preview modal and cleanup preview URL after success
      if (fileUploadPreviewModal.previewUrl) {
        URL.revokeObjectURL(fileUploadPreviewModal.previewUrl);
      }
      setFileUploadPreviewModal({
        isOpen: false,
        file: null,
        evidenceId: null,
        type: null,
        previewUrl: null,
      });
    } catch (error) {
      console.error(`Error ${type === 'replace' ? 'replacing' : 'adding'} file:`, error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        `Failed to ${type === 'replace' ? 'replace' : 'add'} file`;
      toast.error(errorMessage);
      // Keep modal open on error so user can try again
    } finally {
      setEvidenceActionLoading(false);
      stopLoading();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || "Complaint not found"}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  // Data from backend
  const witnesses = requestData?.witnesses || [];
  const evidences = requestData?.evidences || [];
  
  // Include all evidences that have a rejection reason, regardless of current status
  const rejectedEvidences = evidences
    .filter(evidence => (evidence.rejection_reason || evidence.rejectionReason))
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.updated_at || a.reviewed_at || a.createdAt || a.created_at || 0);
      const dateB = new Date(b.updatedAt || b.updated_at || b.reviewed_at || b.createdAt || b.created_at || 0);
      return dateA - dateB; // Oldest first, most recent at bottom
    });
  
  // Get complaint rejection reason (fallback for backward compatibility)
  const rejection = Array.isArray(requestData?.complaintRejection) 
    ? requestData.complaintRejection[0] 
    : requestData?.complaintRejection;
  const complaintRejectionReason = rejection?.comment || requestData?.rejection_comment || requestData?.rejection_reason;

  // Use allRejections if available, otherwise fallback to requestData
  // Reverse to show oldest first, newest at bottom (chat style)
  const displayRejections = (allRejections.length > 0 
    ? allRejections.filter(r => r.comment) // Only show rejections with comments
    : (Array.isArray(requestData?.complaintRejection) 
        ? requestData.complaintRejection.filter(r => r?.comment)
        : (requestData?.complaintRejection?.comment ? [requestData.complaintRejection] : []))
  ).slice().reverse(); // Reverse to show oldest first, newest at bottom

  const uploadPreviewFile = fileUploadPreviewModal.file;
  const uploadPreviewFileName = uploadPreviewFile?.name || "";
  const uploadPreviewFileType = uploadPreviewFile?.type || "";
  const uploadPreviewExtension = uploadPreviewFileName.split('.').pop()?.toLowerCase() || "";
  const uploadPreviewImageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  const uploadPreviewVideoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"];
  const uploadPreviewAudioExtensions = ["mp3", "mpeg", "wav", "ogg", "aac", "flac", "m4a", "wma", "m4b", "m4p"];
  const uploadPreviewIsImage = uploadPreviewFileType.startsWith('image/') || uploadPreviewImageExtensions.includes(uploadPreviewExtension);
  const uploadPreviewIsPdf = uploadPreviewFileType === 'application/pdf' || uploadPreviewExtension === 'pdf';
  const uploadPreviewIsVideo = uploadPreviewFileType.startsWith('video/') || uploadPreviewVideoExtensions.includes(uploadPreviewExtension);
  const uploadPreviewIsAudio = uploadPreviewFileType.startsWith('audio/') || uploadPreviewAudioExtensions.includes(uploadPreviewExtension);
  const uploadPreviewUrl = fileUploadPreviewModal.previewUrl;
  const uploadPreviewModalSizeClasses = uploadPreviewIsAudio
    ? "w-[40vw] max-w-[40vw] h-[40vh] max-h-[40vh]"
    : "w-[55vw] max-w-[55vw] h-[88vh] max-h-[88vh]";

  const toDisplayDate = (raw) => raw
    ? new Date(raw).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";

  const evidenceMessages = rejectedEvidences.map((evidence, index) => ({
    id: evidence.complaint_evidence_id || evidence.evidence_id || `evidence-${index}`,
    comment: evidence.rejection_reason || evidence.rejectionReason || "No reason provided",
    date: evidence.reviewed_at || evidence.reviewedAt || evidence.updatedAt || evidence.updated_at || evidence.createdAt || evidence.created_at || null,
    isFromUser: true, // treat evidence rejection as backoffice/staff
    isEvidence: true,
  }));

  const rejectionMessages = displayRejections
    .filter(r => r?.comment)
    .map((rejection, index) => ({
      id: rejection.complaint_rejection_id || `rejection-${index}`,
      comment: rejection.comment,
      date: rejection.createdAt || rejection.created_at || null,
      isFromUser: rejection.user_id !== null && rejection.user_id !== undefined,
      isFromCustomer: rejection.user_id === null && rejection.customer_id !== null && rejection.customer_id !== undefined,
      isEvidence: false,
    }));

  const combinedMessages = [...evidenceMessages, ...rejectionMessages]
    .map(msg => ({ ...msg, displayDate: toDisplayDate(msg.date) }))
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db; // oldest first, newest at bottom
    });

  return (
    <div className="mt-12 mx-4 sm:mx-8 md:mx-16 lg:mx-24 xl:mx-32 2xl:mx-auto 2xl:max-w-[1800px] 2xl:px-32">
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        {/* Left side: Back arrow and Title */}
        <div className="flex items-center gap-4">
        <button
                onClick={handleBack}
                className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity bg-[#eaeaee] p-2"
              >
                <FaLessThan className="text-[#2C2C2C] text-xl" />
              </button>
          
          <h1 className="font-['Montserrat'] font-bold text-xl text-[#2C2C2C]">
            Complaint Report Detail
          </h1>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-2.5">
          {/* Edit Button - Only show for pending or returned complaints */}
          {(requestData?.status === "pending" || requestData?.status === "returned") && (
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-2 py-2 rounded w-24 h-9 bg-[#007BFF99] hover:opacity-90 transition-opacity"
          >
            <PencilIcon className="w-4 h-4 text-white" />
            <span className="font-['Montserrat'] font-semibold text-xs text-white">
              Edit
            </span>
          </button>
          )}

          {/* Delete Button - Only show for pending complaints */}
          {requestData?.status === "pending" && (
          <button
              onClick={handleDeleteComplaint}
            className="flex items-center justify-center gap-2 px-2 py-2 rounded w-24 h-9 bg-[#F4433699] hover:opacity-90 transition-opacity"
          >
            <TrashIcon className="w-4 h-4 text-white" />
            <span className="font-['Montserrat'] font-semibold text-xs text-white">
              Delete
            </span>
          </button>
          )}

          {/* Decision Button - Only show when status is "Decided" */}
          {(requestData?.status === "decided" || requestData?.status === "Decided") && (
          <button
            onClick={handlePrint}
            disabled={saving}
              className="flex items-center justify-center gap-2 px-2 py-2 rounded w-24 h-9 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#37A63799' }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="font-['Montserrat'] font-semibold text-xs text-white">
                  Downloading...
                </span>
              </>
            ) : (
              <>
                <PrinterIcon className="w-4 h-4 text-white" />
                <span className="font-['Montserrat'] font-semibold text-xs text-white">
                  Decision
                </span>
              </>
            )}
          </button>
          )}
        </div>
      </div>

      {/* Two Cards Section */}
      <div className="flex flex-col lg:flex-row gap-8 mt-8 mb-8">
        {/* Left Card */}
        <div className="rounded-lg w-full max-w-[51.875rem] min-h-[49.0625rem] shadow-lg bg-white pt-8 px-8 overflow-y-auto hide-scrollbar">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            {/* Case Information Title */}
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                Case Information
              </h2>

            {/* Status Badge - Right corner */}
            <div className="flex items-center justify-center">
              <span 
                className="font-['Montserrat'] font-semibold text-base text-center whitespace-nowrap"
                style={{ color: getStatusColor(requestData?.status) }}
              >
                {getStatusText(requestData?.status)}
              </span>
            </div>
          </div>

          {/* Fields Section */}
          <div className="mt-4">
            {/* Report Id */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Report Id
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {getShortId(requestData?.complaint_id || requestData?.id || complaintId).toUpperCase()}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />

            {/* Judge Name */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Judge Name
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {requestData?.judge_name || "N/A"}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />

            {/* Court Office */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Court Office
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {requestData?.courtOffice?.name || requestData?.judge_court || requestData?.court_office || "N/A"}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />

            {/* Case File Number */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Case File Number
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {requestData?.case_file_number || "N/A"}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />

            {/* Case Type */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Case Type
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {requestData?.case_type || "N/A"}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />

            {/* Date of Offense */}
            <div className="flex items-center justify-between py-3">
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                Date of Offense
              </span>
              <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                {requestData?.act_date ? convertToEthiopianDate(requestData.act_date) : "N/A"}
              </span>
            </div>
            {/* Separator Line */}
            <div className="w-full h-px border border-[#E8E8E8]" />
          </div>

          {/* Witness Information Section */}
          <div className="mt-4">
            {/* Witness Information Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                Witness Information
              </h2>
              {witnesses.length > 3 && (
                <button
                  onClick={() => setAllWitnessesModal(true)}
                  className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <EyeIcon className="w-5 h-5 text-[#094C81]" />
                </button>
              )}
            </div>

            {/* Witnesses List - Show only first 3 */}
            {witnesses.length > 0 ? (
              witnesses.slice(0, 3).map((witness, index) => (
                <React.Fragment key={witness.complaint_witness_id || index}>
                  <div className="flex items-center justify-between py-3">
                    <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                      {witness.witness_name || "N/A"}
                    </span>
                    <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                      {witness.witness_phone_number || "N/A"}
                    </span>
                  </div>
                  {index < Math.min(witnesses.length, 3) - 1 && (
                    <div className="w-full h-px border border-[#E8E8E8]" />
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="py-3">
                <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                  No witnesses available
                </span>
              </div>
            )}
          </div>

          {/* Evidence Attachments Section */}
          <div className="mt-4">
            {/* Evidence Attachments Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                Evidence Attachments
              </h2>
            </div>

            {/* Files Grid - 2 columns, show all evidences */}
            {evidences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                {evidences.map((evidence, index) => {
                  const evidenceKey = evidence.complaint_evidence_id || evidence.evidence_id || index;
                  const evidenceFileUrl = evidence.public_url || evidence.file_url || evidence.file_path;
                  const hasFile = !!(evidenceFileUrl);
                  
                  return (
                    <React.Fragment key={evidenceKey}>
                      <div className="rounded-lg flex items-center justify-between w-full h-auto max-h-16 py-5 px-4 bg-[#E8EEFD] min-w-0 overflow-hidden">
                  <div className="flex items-center flex-1 min-w-0">
                    {/* Attachment Icon */}
                    <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 relative">
                      <FaFileAlt className="w-6 h-8 text-[#215167] absolute top-2 left-3" />
                    </div>
                    
                        {/* File Name and Size */}
                        <div className="flex flex-col flex-1 ml-4 min-w-0 overflow-hidden">
                          <span className="font-['Montserrat'] font-normal text-base text-[#0A1D39] truncate">
                            Evidence {index + 1}
                          </span>
                          {hasFile && (
                            <span
                              className={`font-['Montserrat'] font-normal text-sm mt-1 truncate ${
                                evidenceFileErrors[evidenceKey] ? 'text-red-500' : 'text-[#949494]'
                              }`}
                            >
                              {evidenceFileErrors[evidenceKey] || evidence.file_type || "File"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* View and Delete Icons */}
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {/* Update Icon - Only show if evidence file status is rejected */}
                        {(evidence.file_status === "rejected" || evidence.status === "rejected") && (
                          <>
                            <input
                              type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v,.mp3,.mpeg,.wav,.ogg,.aac,.flac,.m4a,.wma"
                              id={`replace-evidence-${evidenceKey}`}
                              className="hidden"
                              onChange={(event) => handleEvidenceFileChange(evidence.complaint_evidence_id || evidence.evidence_id, event)}
                              disabled={evidenceActionLoading}
                            />
                        <button
                          type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const input = document.getElementById(`replace-evidence-${evidenceKey}`);
                                if (input) {
                                  input.click();
                                }
                              }}
                          className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              disabled={evidenceActionLoading}
                              title="Replace"
                        >
                          <RxUpdate className="text-[#215167]" />
                        </button>
                          </>
                        )}
                        
                        {/* View Icon */}
                        {hasFile ? (
                          <button
                            type="button"
                            onClick={() => handleViewFile(evidenceFileUrl, index)}
                            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            disabled={previewLoading}
                          >
                            {previewLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#215167]"></div>
                            ) : (
                              <EyeIcon className="w-6 h-5 text-[#3c7996]" />
                            )}
                          </button>
                        ) : (
                          <EyeIcon className="w-6 h-5 text-gray-300 cursor-not-allowed" />
                        )}

                        {/* Delete Icon - Only show if evidence file status is rejected */}
                        {(evidence.file_status === "rejected" || evidence.status === "rejected") && (
                        <button
                          type="button"
                          onClick={() => {
                            const evidenceId = evidence.complaint_evidence_id || evidence.evidence_id;
                            if (evidenceId) {
                              handleDeleteFile(evidenceId);
                            }
                          }}
                          className="w-4 h-4 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          disabled={evidenceActionLoading}
                          title="Delete"
                        >
                          <MdDelete className="w-4 h-4 text-[#FF4C4C]" />
                        </button>
                        )}
                      </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="py-4">
                <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                  No evidence files available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card */}
        <div className="rounded-lg w-full max-w-[51.875rem] min-h-[49.0625rem] shadow-lg bg-white pt-8 px-8 mb-8 lg:mb-0">
          {/* Act Details Section */}
          <div>
            {/* Act Details Header */}
            <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
              Act Details
            </h2>

            {/* Separator Line */}
            <div className="mt-4 w-full h-px border border-[#E8E8E8]" />

            {/* Description Text */}
            {requestData?.detailed_description ? (
              <div className="mt-4">
                <span className="font-['Montserrat'] font-normal text-base text-[#2C2C2C]">
                  {requestData.detailed_description.length > 100
                    ? `${requestData.detailed_description.substring(0, 100)}......`
                    : requestData.detailed_description}
                </span>
                {requestData.detailed_description.length > 100 && (
                  <button
                    type="button"
                    onClick={() => setDescriptionModal({ 
                      isOpen: true, 
                      title: "Act Details", 
                      content: requestData.detailed_description 
                    })}
                    className="cursor-pointer hover:opacity-80 transition-opacity font-['Montserrat'] font-medium text-base text-[#3BA1F5] ml-1"
                  >
                    See more
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <span className="font-['Montserrat'] font-normal text-base text-[#2C2C2C]">
                  No act details available
                </span>
              </div>
            )}
          </div>

          {/* Damage Details Section */}
          {requestData?.damage_description && (
            <div className="pt-8">
              {/* Damage Details Header */}
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                Damage Details
              </h2>

              {/* Separator Line */}
              <div className="mt-4 w-full h-px border border-[#E8E8E8]" />

              {/* Description Text */}
              <div className="mt-4">
                <span className="font-['Montserrat'] font-normal text-base text-[#2C2C2C]">
                  {requestData.damage_description.length > 100
                    ? `${requestData.damage_description.substring(0, 100)}......`
                    : requestData.damage_description}
                </span>
                {requestData.damage_description.length > 100 && (
                  <button
                    type="button"
                    onClick={() => setDescriptionModal({ 
                      isOpen: true, 
                      title: "Damage Details", 
                      content: requestData.damage_description 
                    })}
                    className="cursor-pointer hover:opacity-80 transition-opacity font-['Montserrat'] font-medium text-base text-[#3BA1F5] ml-1"
                  >
                    See more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Decision Section - Only show when status is "Decided" */}
          {(() => {
            const status = requestData?.status || requestData?.complaint?.status;
            const decisionStatusName = requestData?.case?.decision?.status?.name || 
                                      requestData?.complaint?.case?.decision?.status?.name;
            const decision = requestData?.case?.decision || requestData?.complaint?.case?.decision;
            const decisionDescription = decision?.external_decision;
            
            const isDecided = status === "decided" || status === "Decided";
            
            if (isDecided && (decisionStatusName || decisionDescription)) {
              // Combine decision status name and description for display
              let fullDecisionText = "";
              if (decisionStatusName && decisionDescription) {
                fullDecisionText = `${decisionStatusName}: ${decisionDescription}`;
              } else if (decisionStatusName) {
                fullDecisionText = decisionStatusName;
              } else if (decisionDescription) {
                fullDecisionText = decisionDescription;
              }
              
              return (
                <div className="pt-8">
                  {/* Decision Header */}
                  <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                    Decision
                  </h2>

                  {/* Separator Line */}
                  <div className="mt-4 w-full h-px border border-[#E8E8E8]" />

                  {/* Decision Text */}
                  <div className="mt-4">
                    <span className="font-['Montserrat'] font-medium text-base text-[#2C2C2C]">
                      {fullDecisionText.length > 100
                        ? `${fullDecisionText.substring(0, 100)}......`
                        : fullDecisionText}
                    </span>
                    {fullDecisionText.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setDescriptionModal({ 
                          isOpen: true, 
                          title: "Decision", 
                          content: fullDecisionText 
                        })}
                        className="cursor-pointer hover:opacity-80 transition-opacity font-['Montserrat'] font-medium text-base text-[#3BA1F5] ml-1"
                      >
                        See more
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Feedback Section */}
          {(() => {
            const status = requestData?.status || requestData?.complaint?.status;
            const isDecided = status === "decided" || status === "Decided";
            return (
              <div className={`mt-8 flex flex-col w-full max-w-[48rem] ${isDecided ? "min-h-[20rem]" : "min-h-[28.5rem]"} rounded-xl border border-[#E0E0E0] bg-white min-h-0`}>
            {/* Feedback Section Header */}
            <div className="-mt-3 pt-3">
              <h2 className="font-['Montserrat'] font-semibold px-6 pt-6 text-lg text-[#222222]">
                Feedback Section
              </h2>
            </div>

            {/* Horizontal Line - 13px below the header, end to end */}
            <div className="mt-3 w-full h-px border border-[#E8E8E8]" />

            {/* Rejection Reasons or Empty State */}
            {combinedMessages.length > 0 ? (
              <div className="flex-1 flex flex-col pt-4 px-6 overflow-hidden min-h-0" style={{ backgroundColor: '#F7F7FF' }}>
                {/* Scrollable messages container - Telegram style */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 hide-scrollbar flex flex-col min-h-0">
                  {/* Combined Evidence + Complaint Rejections - Oldest at top, newest at bottom */}
                  {combinedMessages.map((msg) => {
                    const isEvidence = msg.isEvidence;
                    const isFromUser = isEvidence ? true : msg.isFromUser;
                    const messageAlignment = isFromUser ? "self-start" : "self-end";
                    const messageBgColor = '#E8EEFD'; // unified style like evidence rejection

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-3 text-left max-w-[85%] shadow-sm ${messageAlignment}`}
                        style={{ backgroundColor: messageBgColor }}
                      >
                        {/* Message content */}
                        <p 
                          className={`font-normal ${!isEvidence ? 'mb-2' : ''}`}
                          style={{
                            fontFamily: 'Source Sans Pro',
                            fontWeight: 400,
                            fontSize: '15.75px',
                            lineHeight: '100%',
                            letterSpacing: '0%',
                            color: '#073954'
                          }}
                        >
                          {msg.comment}
                        </p>
                        {msg.displayDate && (
                          <div className="flex items-center justify-end mt-2 pt-2 border-t border-[#E8E8E8]">
                            <p 
                              className="font-normal text-xs"
                              style={{
                                fontFamily: 'Source Sans Pro',
                                fontWeight: 400,
                                fontSize: '12px',
                                lineHeight: '100%',
                                letterSpacing: '0%',
                                color: '#718096'
                              }}
                            >
                              {msg.displayDate}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
            <div className="flex flex-col items-center justify-center flex-1 px-6 pb-6">
              {/* Message Icon */}
              <MdOutlineMessage className="w-12 h-12 text-[#718096A6]" />

              {/* Text Content - 12px from icon */}
              <div className="mt-3 text-center">
                <p className="font-['Montserrat'] font-semibold text-base text-center text-[#718096] mb-2">
                  No issue has been submitted.
                </p>
                <p className="font-['Montserrat'] font-normal text-base text-center text-[#718096]">
                  Please feel free to provide your question or the issue you
                </p>
                <p className="font-['Montserrat'] font-normal text-base text-center text-[#718096] mt-1">
                  are facing whenever you are ready. we are here to help.
                </p>
              </div>
            </div>
            )}

            {/* Input Field and Button at Bottom - Only show if status is returned */}
            {(requestData?.status === "returned") && (
              <div className="flex flex-col sm:flex-row items-center gap-[clamp(8px,0.42vw,8px)] mt-[clamp(24px,2.22vh,24px)] px-[clamp(24px,1.25vw,24px)] pb-[clamp(24px,2.22vh,24px)]">
              {/* Input Field */}
              <input
                type="text"
                placeholder="Send a Issue"
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !raisingIssue) {
                    handleRaiseIssue();
                  }
                }}
                disabled={raisingIssue}
                className="w-full max-w-[clamp(400px,30vw,600px)] h-[clamp(44px,5.19vh,56px)] rounded-md border border-[#E2E8F0] px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] text-[#718096] placeholder:text-[#718096] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Raise Issue Button */}
              <button
                type="button"
                onClick={handleRaiseIssue}
                disabled={raisingIssue || !issueText.trim()}
                className="max-w-[clamp(120px,8vw,160px)] h-auto max-h-[clamp(44px,5.19vh,56px)] rounded-md px-[clamp(32px,2.5vw,48px)] py-[clamp(12px,1.48vh,16px)] bg-[#215167] font-['Montserrat'] font-semibold text-[clamp(14px,0.83vw,16px)] text-white border-none cursor-pointer flex items-center justify-center hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {raisingIssue ? "Raising..." : "Raise Issue"}
              </button>
            </div>
            )}
          </div>
            );
          })()}
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal}
          title={previewModal.title}
          customStyle={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        title="Delete Complaint"
        description="Are you sure you want to delete this complaint? This action cannot be undone."
      />

      {/* Description Modal */}
      {descriptionModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center" style={{ zIndex: 100 }}>
          <div 
            className="bg-white rounded-lg overflow-hidden flex flex-col shadow-lg w-full max-w-[850px] h-[85%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                {descriptionModal.title}
              </h2>
              <div className="flex items-center gap-2">
                {/* Download Button */}
                <button
                  onClick={handleDownloadDescription}
                  disabled={saving}
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Download as PDF"
                  title="Download as PDF"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  ) : (
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  )}
                </button>
                {/* Close Button */}
              <button
                onClick={() => setDescriptionModal({ isOpen: false, title: "", content: "" })}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close Modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              </div>
            </div>

            {/* Modal Content */}
            <div ref={descriptionModalContentRef} className="overflow-auto flex-1 p-6">
              <p className="font-['Montserrat'] font-medium text-base text-[#2C2C2C] whitespace-pre-wrap">
                {descriptionModal.content}
              </p>
            </div>
          </div>
        </div>
      , document.body)}

      {/* File Upload Preview Modal */}
      {fileUploadPreviewModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center" style={{ zIndex: 100 }}>
          <div 
            className={`bg-white rounded-lg overflow-hidden flex flex-col shadow-lg ${uploadPreviewModalSizeClasses}`}
            style={{
              boxShadow: '0px 0px 11.18px 0px #3470FF29'
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#215167]">
                {fileUploadPreviewModal.type === 'replace' 
                  ? 'Preview replacement evidence' 
                  : 'Preview New Evidence File'}
              </h2>
              <button
                onClick={() => {
                  // Cleanup preview URL when closing
                  if (fileUploadPreviewModal.previewUrl) {
                    URL.revokeObjectURL(fileUploadPreviewModal.previewUrl);
                  }
                  setFileUploadPreviewModal({
                    isOpen: false,
                    file: null,
                    evidenceId: null,
                    type: null,
                    previewUrl: null,
                  });
                }}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close Modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className={`flex-1 overflow-auto p-6 ${uploadPreviewIsAudio ? 'flex items-center justify-center' : ''}`}>
              {fileUploadPreviewModal.file && (
                <div className={`w-full h-full flex items-center justify-center ${uploadPreviewIsAudio ? 'flex-col' : ''}`}>
                  {uploadPreviewIsImage && uploadPreviewUrl ? (
                    <img
                      src={uploadPreviewUrl}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                  ) : uploadPreviewIsPdf && uploadPreviewUrl ? (
                    <iframe
                      src={uploadPreviewUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="PDF Preview"
                    />
                  ) : uploadPreviewIsVideo && uploadPreviewUrl ? (
                    <video
                      src={uploadPreviewUrl}
                      controls
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : uploadPreviewIsAudio && uploadPreviewUrl ? (
                    <div className="w-full flex flex-col items-center gap-4">
                      <audio
                        src={uploadPreviewUrl}
                        controls
                        className="w-full max-w-xl"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                      <p className="font-['Montserrat'] font-normal text-sm text-gray-600 text-center">
                        {uploadPreviewFileName || "Audio file"}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="font-['Montserrat'] font-normal text-sm text-gray-600">
                        Preview not available for this file type
                      </p>
                      <p className="font-['Montserrat'] font-normal text-xs text-gray-500 mt-2">
                        File: {uploadPreviewFileName || fileUploadPreviewModal.file.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
                          <button
                            onClick={() => {
                  // Cleanup preview URL when canceling
                  if (fileUploadPreviewModal.previewUrl) {
                    URL.revokeObjectURL(fileUploadPreviewModal.previewUrl);
                  }
                  setFileUploadPreviewModal({
                    isOpen: false,
                    file: null,
                    evidenceId: null,
                    type: null,
                    previewUrl: null,
                  });
                }}
                className="px-4 py-2 rounded-md font-['Montserrat'] font-medium text-base text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
                          </button>
              <button
                onClick={handleConfirmFileUpload}
                disabled={!fileUploadPreviewModal.file || evidenceActionLoading}
                className="px-4 py-2 rounded-md font-['Montserrat'] font-semibold text-base text-white bg-[#215167] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evidenceActionLoading ? 'Processing...' : (fileUploadPreviewModal.type === 'replace' ? 'Update' : 'Upload Evidence')}
              </button>
                      </div>
                    </div>
              </div>
      , document.body)}

      {/* All Witnesses Modal */}
      {allWitnessesModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center" style={{ zIndex: 100 }}>
          <div 
            className="bg-white rounded-lg overflow-hidden flex flex-col shadow-lg w-[clamp(320px,80vw,720px)] h-[clamp(360px,70vh,520px)] max-h-[80vh]"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="font-['Montserrat'] font-semibold text-lg text-[#094C81]">
                    Witness Information
                  </h2>
              <button
                onClick={() => setAllWitnessesModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close Modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-auto flex-1 p-6">
              {/* Witnesses List - Max 8 */}
              {witnesses.length > 0 ? (
                witnesses.slice(0, 8).map((witness, index) => (
                    <React.Fragment key={witness.complaint_witness_id || index}>
                      <div className="flex items-center justify-between py-3">
                        <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                          {witness.witness_name || "N/A"}
                        </span>
                        <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                          {witness.witness_phone_number || "N/A"}
                        </span>
                      </div>
                      {index < Math.min(witnesses.length, 8) - 1 && (
                        <div className="w-full h-px border border-[#E8E8E8]" />
                      )}
                    </React.Fragment>
                ))
              ) : (
                <div className="py-3">
                  <span className="font-['Montserrat'] font-normal text-base text-[#212121]">
                    No witnesses available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
};

export default ViewDetailComplaint3;
