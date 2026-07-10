import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Chip,
  Spinner,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Textarea,
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  ScaleIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { toast } from "react-toastify";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import PreviewModal from "../requestManagement/document-preview-modal";
import ConfirmDialog from "../requestManagement/delete-modal";

const ViewDetailDisciplinary = () => {
  const { shortRequestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();

  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    file: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    evidenceId: null,
  });
  const [addEvidenceModal, setAddEvidenceModal] = useState({
    isOpen: false,
    file: null,
  });
  const [rejectionReasonModal, setRejectionReasonModal] = useState({
    isOpen: false,
    evidence: null,
    reason: null,
  });
  const [editTextEvidenceModal, setEditTextEvidenceModal] = useState({
    isOpen: false,
    evidence: null,
    description: "",
  });
  const [fileUploadPreviewModal, setFileUploadPreviewModal] = useState({
    isOpen: false,
    file: null,
    evidenceId: null,
    type: null, // 'replace' or 'add'
    previewUrl: null, // For image previews
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedIssueDesc, setExpandedIssueDesc] = useState({});
  const [expandedEvidenceDesc, setExpandedEvidenceDesc] = useState({});

  const fullRequestId = location.state?.fullRequestId || shortRequestId;

  // Helper functions
  const exceedsWordThreshold = (text, threshold = 35) => {
    if (!text) return false;
    const str = String(text)
      .replace(/[\n\r]+/g, " ")
      .trim();
    const words = str.split(/\s+/);
    return words.length > threshold;
  };

  const getWordsPreview = (text, wordLimit = 35) => {
    if (!text) return "";
    const words = String(text)
      .replace(/[\n\r]+/g, " ")
      .trim()
      .split(/\s+/);
    if (words.length <= wordLimit) return words.join(" ");
    return words.slice(0, wordLimit).join(" ") + " ...";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "under_investigation":
        return "bg-orange-100 text-orange-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "Decided":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "evidence_revision_required":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "⌛ Pending";
      case "under_investigation":
        return "🔍 Under Investigation";
      case "accepted":
        return "✅ Accepted";
      case "under_review":
        return "📋 Under Review";
      case "evidence_revision_required":
        return "📝 Revision Required";
      case "Decided":
        return "📋 Decided";
      case "rejected":
        return "❌ Rejected";
      default:
        return status;
    }
  };

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (isDeleting) return;

      try {
        setLoading(true);
        setError(null);

        const response =
          await DisciplinaryRequestService.getRequestById(fullRequestId);
        const data = response.data || response;
        setRequestData(data);
      } catch (error) {
        console.error("Error fetching request details:", error);
        setError(error.message || "Failed to load request details");
        toast.error(error.message || "Failed to load request details");
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    if (fullRequestId && !isDeleting) {
      fetchRequestDetails();
    } else if (!fullRequestId) {
      setError("No request ID provided");
      setLoading(false);
      stopLoading();
    }
  }, [fullRequestId, isDeleting]);

  // File Management Functions
  const handleReplaceFile = async (evidenceId, file) => {
    if (!file) {
      toast.error("Please select a file to replace");
      return;
    }

    try {
      startLoading();
      const response = await DisciplinaryRequestService.modifyRejectedEvidence(
        evidenceId,
        "replace",
        file
      );
      
      toast.success(response?.message || "File replaced successfully");

      // Refresh data
      const updatedRequest =
        await DisciplinaryRequestService.getRequestById(fullRequestId);
      setRequestData(updatedRequest.data || updatedRequest);
    } catch (error) {
      console.error("Error replacing file:", error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "Failed to replace file";
      toast.error(errorMessage);
    } finally {
      stopLoading();
    }
  };

  const handleDeleteFile = async (evidenceId) => {
    try {
      startLoading();
      await DisciplinaryRequestService.modifyRejectedEvidence(
        evidenceId,
        "delete"
      );
      toast.success("File deleted successfully");

      // Refresh data
      const updatedRequest =
        await DisciplinaryRequestService.getRequestById(fullRequestId);
      setRequestData(updatedRequest.data || updatedRequest);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(error.message || "Failed to delete file");
    } finally {
      stopLoading();
    }
  };

  const handleUpdateTextEvidence = async () => {
    const { evidence, description } = editTextEvidenceModal;

    if (!description || !description.trim()) {
      toast.error("Please enter evidence description");
      return;
    }

    try {
      startLoading();
      // Update via the main update endpoint
      // Set file_status to "pending" when editing, similar to file replacement
      const updateFormData = new FormData();
      const evidences = [{
        evidence_id: evidence.evidence_id,
        description: description.trim(),
        file_url: null,
        file_status: "pending" // Reset status to pending for re-verification
      }];
      updateFormData.append("evidences", JSON.stringify(evidences));

      await DisciplinaryRequestService.updateRequest(fullRequestId, updateFormData);
      
      toast.success("Text evidence updated successfully");

      // Refresh data and close modal
      const updatedRequest =
        await DisciplinaryRequestService.getRequestById(fullRequestId);
      setRequestData(updatedRequest.data || updatedRequest);
      setEditTextEvidenceModal({ isOpen: false, evidence: null, description: "" });
    } catch (error) {
      console.error("Error updating text evidence:", error);
      toast.error(error.message || "Failed to update text evidence");
    } finally {
      stopLoading();
    }
  };

  const handleDeleteTextEvidence = async (evidenceId) => {
    try {
      startLoading();
      await DisciplinaryRequestService.deleteEvidence(evidenceId);
      toast.success("Text evidence deleted successfully");

      // Refresh data
      const updatedRequest =
        await DisciplinaryRequestService.getRequestById(fullRequestId);
      setRequestData(updatedRequest.data || updatedRequest);
    } catch (error) {
      console.error("Error deleting text evidence:", error);
      toast.error(error.message || "Failed to delete text evidence");
    } finally {
      stopLoading();
    }
  };

  const openDeleteFileModal = (evidenceId) => {
    setDeleteModal({
      isOpen: true,
      type: "file",
      evidenceId,
    });
  };

  const openDeleteRequestModal = () => {
    setDeleteModal({
      isOpen: true,
      type: "request",
    });
  };

  const handleConfirmDelete = async () => {
    const { type, evidenceId } = deleteModal;

    try {
      setDeleteModal({ isOpen: false, type: null, evidenceId: null });

      if (type === "request") {
        setIsDeleting(true);
        startLoading();
        await DisciplinaryRequestService.deleteRequest(fullRequestId);
        toast.success("Disciplinary request deleted successfully");
        navigate("/home/requests");
      } else if (type === "file" && evidenceId) {
        await handleDeleteFile(evidenceId);
      } else if (type === "text_evidence" && evidenceId) {
        await handleDeleteTextEvidence(evidenceId);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(error.message || `Failed to delete ${type}`);
      if (type === "request") {
        setIsDeleting(false);
      }
    } finally {
      stopLoading();
    }
  };

  const handleFileInputChange = (evidenceId, e) => {
    const file = e.target.files[0];
    console.log("File selected for replacement:", file);
    console.log("Evidence ID:", evidenceId);
    if (file) {
      // Create preview URL for images
      const previewUrl = file.type?.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : null;
      
      // Show preview modal instead of directly uploading
      setFileUploadPreviewModal({
        isOpen: true,
        file: file,
        evidenceId: evidenceId,
        type: 'replace',
        previewUrl: previewUrl,
      });
    } else {
      console.warn("No file selected");
    }
    // Reset input
    e.target.value = "";
  };

  const handleAddEvidenceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL for images
      const previewUrl = file.type?.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : null;
      
      // Show preview modal instead of directly setting file
      setFileUploadPreviewModal({
        isOpen: true,
        file: file,
        evidenceId: null,
        type: 'add',
        previewUrl: previewUrl,
      });
    }
    // Reset input
    e.target.value = "";
  };

  const handleConfirmFileUpload = async () => {
    const { file, evidenceId, type } = fileUploadPreviewModal;

    if (!file) {
      toast.error("No file selected");
      return;
    }

    try {
      startLoading();
      
      if (type === 'replace' && evidenceId) {
        const response = await DisciplinaryRequestService.modifyRejectedEvidence(
          evidenceId,
          "replace",
          file
        );
        toast.success(response?.message || "File replaced successfully");
      } else if (type === 'add') {
        await DisciplinaryRequestService.addEvidenceToComplaint(
          fullRequestId,
          file
        );
        toast.success("New evidence added successfully");
        setAddEvidenceModal({ isOpen: false, file: null });
      }

      // Refresh data
      const updatedRequest =
        await DisciplinaryRequestService.getRequestById(fullRequestId);
      setRequestData(updatedRequest.data || updatedRequest);
      
      // Close preview modal and cleanup preview URL
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
    } finally {
      stopLoading();
    }
  };

  const handleBack = () => {
    navigate("/home/requests");
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the current date for the print
    const currentDate = format(new Date(), "MMMM dd, yyyy 'at' h:mm a");
    
    // Create print-friendly HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Disciplinary Request Details - ${requestData.id?.toString().slice(0, 8) || requestData.request_id?.toString().slice(0, 8) || shortRequestId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 10px;
              color: #333;
              line-height: 1.3;
              font-size: 11px;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #4475F2;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .header h1 {
              color: #4475F2;
              margin: 0;
              font-size: 16px;
            }
            .header .subtitle {
              color: #666;
              margin: 2px 0 0 0;
              font-size: 10px;
            }
            .section {
              margin-bottom: 12px;
              page-break-inside: avoid;
            }
            .section-title {
              color: #4475F2;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 6px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 2px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              margin-bottom: 8px;
            }
            .info-item {
              margin-bottom: 4px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .info-value {
              color: #333;
              font-size: 10px;
              margin-top: 1px;
            }
            .status {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 9px;
              font-weight: bold;
              margin-left: 5px;
            }
            .status.pending { background-color: #fef3cd; color: #856404; }
            .status.under_investigation { background-color: #fef3cd; color: #856404; }
            .status.accepted { background-color: #d4edda; color: #155724; }
            .status.decided { background-color: #cce5ff; color: #004085; }
            .status.rejected { background-color: #f8d7da; color: #721c24; }
            .issue-item {
              border-left: 2px solid #4475F2;
              padding-left: 8px;
              margin-bottom: 6px;
            }
            .issue-title {
              font-weight: bold;
              color: #4475F2;
              margin-bottom: 2px;
              font-size: 10px;
            }
            .evidence-item {
              background-color: #f8f9fa;
              padding: 6px;
              border-radius: 3px;
              margin-bottom: 4px;
            }
            .evidence-title {
              font-weight: bold;
              margin-bottom: 2px;
              font-size: 10px;
            }
            .evidence-description {
              color: #666;
              font-size: 9px;
            }
            .description-box {
              background-color: #f8f9fa;
              padding: 8px;
              border-radius: 3px;
              line-height: 1.3;
              font-size: 10px;
              margin-bottom: 6px;
            }
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 9px;
            }
            @media print {
              body { margin: 5px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Disciplinary Request Details</h1>
            <div class="subtitle">Request ID: #${requestData.id?.toString().slice(0, 8) || requestData.request_id?.toString().slice(0, 8) || shortRequestId}</div>
            <div class="subtitle">Printed on: ${currentDate}</div>
          </div>

          <div class="section">
            <div class="section-title">Request Status</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  ${getStatusText(requestData.status)}
                  <span class="status ${requestData.status}">${requestData.status}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Submission Date</div>
                <div class="info-value">
                  ${requestData.createdAt || requestData.created_at
                    ? format(new Date(requestData.createdAt || requestData.created_at), "MMMM dd, yyyy 'at' h:mm a")
                    : "N/A"
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Judge Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Judge Name</div>
                <div class="info-value">${requestData.judge_name || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Court Office</div>
                <div class="info-value">${requestData.court_office || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">File Number</div>
                <div class="info-value">${requestData.file_number || "N/A"}</div>
              </div>
            </div>
          </div>

          ${requestData.issues && requestData.issues.length > 0 ? `
          <div class="section">
            <div class="section-title">Complaint Issues</div>
            ${requestData.issues.map((issue, index) => `
              <div class="issue-item">
                <div class="issue-title">Issue #${index + 1}</div>
                <div class="info-value">${issue.description || "No description provided"}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${requestData.evidences && requestData.evidences.length > 0 ? `
          <div class="section">
            <div class="section-title">Evidence & Documents</div>
            ${requestData.evidences.map((evidence, index) => `
              <div class="evidence-item">
                <div class="evidence-title">${evidence.file_url ? "File Attachment" : "Text Evidence"}</div>
                ${evidence.description ? `
                  <div class="evidence-description">${evidence.description}</div>
                ` : ''}
                ${evidence.file_url ? `
                  <div class="info-value" style="margin-top: 5px; font-size: 12px; color: #666;">
                    File: ${evidence.file_url.split('/').pop()}
                  </div>
                ` : ''}
                ${evidence.file_status ? `
                  <div class="info-value" style="margin-top: 5px; font-size: 10px;">
                    Status: ${evidence.file_status}
                  </div>
                ` : ''}
                ${evidence.rejection_reason ? `
                  <div class="info-value" style="margin-top: 5px; font-size: 9px; color: #721c24;">
                    Rejection Reason: ${evidence.rejection_reason}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${requestData.status === "rejected" && requestData.disciplinaryRejection?.comment ? `
          <div class="section">
            <div class="section-title">Rejection Reason</div>
            <div class="damage-box">${requestData.disciplinaryRejection.comment}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>This document was generated from the Judicial Case Disciplinary Management System (JCDMS)</p>
            <p>For official purposes only</p>
          </div>
        </body>
      </html>
    `;
    
    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleEdit = () => {
    if (requestData?.status === "pending") {
      navigate(`/home/edit-disciplinary-request/${shortRequestId}`, {
        state: { fullRequestId, requestData },
      });
    } else {
      toast.warning("Only pending requests can be edited");
    }
  };

  const handleViewFile = async (fileUrl) => {
    try {
      const fullUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `${DOCUMENT_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

      console.log("Fetching file from backend URL:", fullUrl);

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }

      const blob = await response.blob();
      const fileName = fileUrl.split("/").pop() || "document";
      const file = new File([blob], fileName, { type: blob.type });

      setPreviewModal({ isOpen: true, file });
    } catch (error) {
      console.error("Error opening file:", error);
      toast.error("Failed to open file");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null });
  };

  // Check if complaint allows file modifications
  const canModifyFiles =
    requestData &&
    [
      "evidence_revision_required",
      "under_review",
      "under_investigation",
    ].includes(requestData.status);

  // Check if evidence is rejected and can be modified
  const canModifyEvidence = (evidence) => {
    return canModifyFiles && evidence.file_status === "rejected";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <Typography variant="h6" color="gray">
            Loading request details...
          </Typography>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Typography variant="h6" color="red" className="mb-4">
            Error loading request details
          </Typography>
          <Typography color="gray" className="mb-4">
            {error}
          </Typography>
          <Button onClick={handleBack} className="bg-primary">
            Back to Requests
          </Button>
        </Card>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Typography variant="h6" color="gray" className="mb-4">
            Request not found
          </Typography>
          <Button onClick={handleBack} className="bg-primary">
            Back to Requests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#416FE429] rounded-lg flex items-center justify-center">
                  <ScaleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#a8bef0]" />
                </div>
                <div>
                  <Typography variant="h5" className="text-primary sm:text-2xl lg:text-3xl">
                    Disciplinary Request Details
                  </Typography>
                  <Typography variant="small" color="gray" className="text-xs sm:text-sm">
                    Request ID: #
                    {requestData.id?.toString().slice(0, 8) ||
                      requestData.request_id?.toString().slice(0, 8) ||
                      shortRequestId}
                  </Typography>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end w-full sm:w-auto space-x-2 sm:space-x-3">
              {requestData.status === "pending" && (
                <Button
                  variant="outlined"
                  color="red"
                  onClick={openDeleteRequestModal}
                  className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                >
                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              )}

              <Button
                variant="text"
                onClick={handleBack}
                className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
              >
                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <Typography variant="h6" className="text-primary">
                  Request Status
                </Typography>
                <Chip
                  value={getStatusText(requestData.status)}
                  className={`${getStatusColor(
                    requestData.status
                  )} font-medium`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <Typography variant="small" color="gray">
                      Request Date
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {requestData.createdAt || requestData.created_at
                        ? format(
                            new Date(
                              requestData.createdAt || requestData.created_at
                            ),
                            "MMMM dd, yyyy 'at' h:mm a"
                          )
                        : "N/A"}
                    </Typography>
                  </div>
                </div>
              </div>
            </Card>

            {/* Judge Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <UserIcon className="w-6 h-6 text-primary" />
                <Typography variant="h6" className="text-primary">
                  Judge Information
                </Typography>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Typography variant="small" color="gray" className="mb-1">
                    Judge Name
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.judge_name || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="mb-1">
                    Court Office
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.court_office || "N/A"}
                  </Typography>
                </div>
                <div className="md:col-span-2">
                  <Typography variant="small" color="gray" className="mb-1">
                    File Number
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.file_number || "N/A"}
                  </Typography>
                </div>
              </div>
            </Card>

            {/* Issues */}
            {requestData.issues && requestData.issues.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Complaint Issues
                  </Typography>
                </div>
                <div className="space-y-3">
                  {requestData.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-primary pl-4 py-3 rounded-lg"
                    >
                      <Typography
                        variant="small"
                        className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                      >
                        {expandedIssueDesc[issue.issue_id || index]
                          ? issue.description || "No description provided"
                          : getWordsPreview(
                              issue.description || "No description provided",
                              35
                            )}
                      </Typography>
                      {exceedsWordThreshold(issue.description) && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="text"
                            onClick={() =>
                              setExpandedIssueDesc((prev) => ({
                                ...prev,
                                [issue.issue_id || index]:
                                  !prev[issue.issue_id || index],
                              }))
                            }
                            className="text-xs font-medium text-primary normal-case"
                          >
                            {expandedIssueDesc[issue.issue_id || index]
                              ? "Read less"
                              : "Read more"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Evidence & Documents */}
            {requestData.evidences && requestData.evidences.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-6 h-6 text-primary" />
                    <Typography variant="h6" className="text-primary">
                      Evidence & Documents
                    </Typography>
                  </div>
                  {canModifyFiles && (
                    <Button
                      variant="filled"
                      onClick={() =>
                        setAddEvidenceModal({ isOpen: true, file: null })
                      }
                      className="flex items-center gap-2 bg-green-600 text-sm px-4 py-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Evidence
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {requestData.evidences.map((evidence, index) => (
                    <div
                      key={evidence.evidence_id || index}
                      className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                        evidence.file_status === "rejected"
                          ? "border-red-300 bg-gradient-to-br from-red-50 to-red-100/30"
                          : evidence.file_status === "verified"
                          ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100/30"
                          : "border-gray-200 bg-gradient-to-br from-gray-50 to-white"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Typography variant="small" className="font-semibold">
                              {evidence.file_url
                                ? "File Attachment"
                                : "Text Evidence"}
                            </Typography>
                            {evidence.file_status === "verified" ? (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                <CheckCircleIcon className="w-4 h-4" />
                              </div>
                            ) : evidence.file_status === "rejected" ? (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                                <XCircleIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <Chip
                                value={evidence.file_status}
                                color="orange"
                                className="text-xs capitalize"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Text Evidence Description - Similar to Issue UI */}
                      {!evidence.file_url && evidence.description && (
                        <div className="border-l-4 border-primary pl-4 py-3 rounded-lg mb-3">
                          <Typography
                            variant="small"
                            className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                          >
                            {expandedEvidenceDesc[evidence.evidence_id || index]
                              ? evidence.description
                              : getWordsPreview(evidence.description, 35)}
                          </Typography>
                          {exceedsWordThreshold(evidence.description) && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="text"
                                onClick={() =>
                                  setExpandedEvidenceDesc((prev) => ({
                                    ...prev,
                                    [evidence.evidence_id || index]:
                                      !prev[evidence.evidence_id || index],
                                  }))
                                }
                                className="text-xs font-medium text-primary normal-case"
                              >
                                {expandedEvidenceDesc[evidence.evidence_id || index]
                                  ? "Read less"
                                  : "Read more"}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {evidence.file_url ? (
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Button
                              variant="outlined"
                              size="sm"
                              className="flex items-center gap-1.5 flex-shrink-0"
                              onClick={() => handleViewFile(evidence.file_url)}
                            >
                              <EyeIcon className="w-4 h-4" /> View File
                            </Button>
                            <Typography 
                              variant="small" 
                              color="gray"
                              className="truncate min-w-0 flex-1"
                              title={evidence.file_url.split("/").pop()}
                            >
                              {evidence.file_url.split("/").pop()}
                            </Typography>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Typography
                              variant="small"
                              color="blue"
                              className="font-medium"
                            >
                              Text Evidence
                            </Typography>
                          </div>
                        )}

                        {/* Action buttons for rejected evidence */}
                        <div className="flex items-center gap-2 flex-nowrap">
                          {canModifyEvidence(evidence) && !evidence.file_url && (
                            <Button
                              variant="outlined"
                              size="sm"
                              color="blue"
                              className="flex items-center gap-1.5 whitespace-nowrap"
                              onClick={() =>
                                setEditTextEvidenceModal({
                                  isOpen: true,
                                  evidence: evidence,
                                  description: evidence.description || "",
                                })
                              }
                            >
                              <PencilIcon className="w-4 h-4" />
                              Edit
                            </Button>
                          )}
                          {canModifyEvidence(evidence) && evidence.file_url && (
                            <>
                              {/* Replace file input */}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.png,.jpeg,.docx"
                                id={`replace-file-${evidence.evidence_id}`}
                                onChange={(e) =>
                                  handleFileInputChange(evidence.evidence_id, e)
                                }
                                className="hidden"
                              />
                              <Button
                                variant="outlined"
                                size="sm"
                                color="blue"
                                className="flex items-center gap-1.5 whitespace-nowrap"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Replace button clicked for evidence:", evidence.evidence_id);
                                  const input = document.getElementById(`replace-file-${evidence.evidence_id}`);
                                  if (input) {
                                    console.log("File input found, triggering click");
                                    input.click();
                                  } else {
                                    console.error("File input not found for evidence:", evidence.evidence_id);
                                    toast.error("File input not found. Please refresh the page.");
                                  }
                                }}
                              >
                                <PencilIcon className="w-4 h-4" />
                                Replace
                              </Button>
                            </>
                          )}
                          {evidence.file_status === "rejected" && (
                            <Button
                              variant="outlined"
                              size="sm"
                              color="red"
                              className="flex items-center gap-1.5 border-2 whitespace-nowrap"
                              onClick={() =>
                                setRejectionReasonModal({
                                  isOpen: true,
                                  evidence: evidence,
                                  reason: evidence.rejection_reason || evidence.rejectionReason || null,
                                })
                              }
                            >
                              <EyeIcon className="w-4 h-4" />
                              Rejection Reason
                            </Button>
                          )}
                          {canModifyEvidence(evidence) && (
                            <Button
                              variant="text"
                              color="red"
                              size="sm"
                              onClick={() => {
                                if (evidence.file_url) {
                                  openDeleteFileModal(evidence.evidence_id);
                                } else {
                                  setDeleteModal({
                                    isOpen: true,
                                    type: "text_evidence",
                                    evidenceId: evidence.evidence_id,
                                  });
                                }
                              }}
                              className="flex items-center justify-center p-2"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <Card className="p-4 sm:p-6">
              <Typography variant="h6" className="text-primary mb-3 sm:mb-4 text-sm sm:text-base">
                Quick Actions
              </Typography>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base py-2 sm:py-3"
                >
                  <DocumentTextIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  Print Details
                </Button>
                {requestData.status === "pending" && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleEdit}
                    className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base py-2 sm:py-3"
                  >
                    <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Edit Request
                  </Button>
                )}
              </div>
            </Card>

            {/* Rejection Reason - Show when status is rejected */}
            {requestData.status === "rejected" && requestData.disciplinaryRejection?.comment && (
              <Card className="p-4 sm:p-6 border-l-4 border-red-500 shadow-md bg-white">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-full">
                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                  <Typography variant="h6" className="text-red-600 font-semibold text-sm sm:text-base">
                    Rejection Reason
                  </Typography>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 sm:p-5 rounded-lg border border-red-200/50">
                  <Typography variant="small" className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm">
                    {requestData.disciplinaryRejection.comment}
                  </Typography>
                </div>
              </Card>
            )}

            {/* Request Summary */}
            <Card className="p-4 sm:p-6">
              <Typography variant="h6" className="text-primary mb-3 sm:mb-4 text-sm sm:text-base">
                Request Summary
              </Typography>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Status:
                  </Typography>
                  <Chip
                    value={getStatusText(requestData.status)}
                    className={`${getStatusColor(requestData.status)} text-xs`}
                  />
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Issues:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.issues?.length || 0}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Evidence:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.evidences?.length || 0} files
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Created:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.createdAt || requestData.created_at
                      ? format(
                          new Date(
                            requestData.createdAt || requestData.created_at
                          ),
                          "MMM dd, yyyy"
                        )
                      : "N/A"}
                  </Typography>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Evidence Modal */}
      <Dialog
        open={addEvidenceModal.isOpen}
        handler={() => setAddEvidenceModal({ isOpen: false, file: null })}
      >
        <DialogHeader>Add New Evidence</DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="mb-2 font-medium">
                Upload File
              </Typography>
              <Input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg,.docx"
                onChange={handleAddEvidenceFileChange}
              />
            </div>
            <Typography variant="small" color="gray">
              Note: Select a file to preview before uploading. You can add additional evidence files to support your
              complaint.
            </Typography>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setAddEvidenceModal({ isOpen: false, file: null })}
            className="mr-2"
          >
            Cancel
          </Button>
        </DialogFooter>
      </Dialog>

      {/* File Upload Preview Modal */}
      <Dialog
        open={fileUploadPreviewModal.isOpen}
        handler={() => {
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
        size="lg"
      >
        <DialogHeader className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${
            fileUploadPreviewModal.type === 'replace' 
              ? 'bg-blue-100' 
              : 'bg-green-100'
          }`}>
            <EyeIcon className={`w-5 h-5 ${
              fileUploadPreviewModal.type === 'replace' 
                ? 'text-blue-600' 
                : 'text-green-600'
            }`} />
          </div>
          <Typography variant="h5" className={
            fileUploadPreviewModal.type === 'replace' 
              ? 'text-blue-600' 
              : 'text-green-600'
          }>
            {fileUploadPreviewModal.type === 'replace' 
              ? 'Preview Replacement File' 
              : 'Preview New Evidence File'}
          </Typography>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {fileUploadPreviewModal.file && (
              <>
                
                
                {/* File Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                  {fileUploadPreviewModal.file.type?.startsWith('image/') && fileUploadPreviewModal.previewUrl ? (
                    <img
                      src={fileUploadPreviewModal.previewUrl}
                      alt="Preview"
                      className="w-full max-w-full h-auto max-h-[500px] object-contain rounded-lg"
                    />
                  ) : fileUploadPreviewModal.file.type === 'application/pdf' ? (
                    <div className="text-center">
                      <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <Typography variant="small" color="gray">
                        PDF Preview not available
                      </Typography>
                    </div>
                  ) : (
                    <div className="text-center">
                      <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <Typography variant="small" color="gray">
                        Preview not available for this file type
                      </Typography>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
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
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmFileUpload}
            disabled={!fileUploadPreviewModal.file}
            className={
              fileUploadPreviewModal.type === 'replace' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }
          >
            {fileUploadPreviewModal.type === 'replace' ? 'Update File' : 'Upload Evidence'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Text Evidence Modal */}
      <Dialog
        open={editTextEvidenceModal.isOpen}
        handler={() =>
          setEditTextEvidenceModal({ isOpen: false, evidence: null, description: "" })
        }
        size="lg"
      >
        <DialogHeader className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <PencilIcon className="w-5 h-5 text-blue-600" />
          </div>
          <Typography variant="h5" className="text-blue-600">
            Edit Text Evidence
          </Typography>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="mb-2 font-semibold">
                Evidence Description
              </Typography>
              <Textarea
                rows={8}
                value={editTextEvidenceModal.description}
                onChange={(e) =>
                  setEditTextEvidenceModal((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter evidence description..."
                className="!border-gray-300 focus:!border-blue-500"
              />
              <Typography variant="small" color="gray" className="mt-2">
                Update the text evidence description. This will replace the existing description.
              </Typography>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() =>
              setEditTextEvidenceModal({ isOpen: false, evidence: null, description: "" })
            }
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTextEvidence}
            disabled={!editTextEvidenceModal.description?.trim()}
            className="bg-blue-600"
          >
            Update Evidence
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal file={previewModal.file} onClose={closePreviewModal} />
      )}

      {/* Rejection Reason Modal */}
      <Dialog
        open={rejectionReasonModal.isOpen}
        handler={() =>
          setRejectionReasonModal({ isOpen: false, evidence: null, reason: null })
        }
        size="md"
      >
        <DialogHeader className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          </div>
          <Typography variant="h5" className="text-red-600">
            Rejection Reason
          </Typography>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            {rejectionReasonModal.evidence && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <Typography variant="small" color="gray" className="mb-1">
                  Evidence Type
                </Typography>
                <Typography variant="small" className="font-semibold">
                  {rejectionReasonModal.evidence.file_url
                    ? "File Attachment"
                    : "Text Evidence"}
                </Typography>
                {rejectionReasonModal.evidence.file_url && (
                  <>
                    <Typography variant="small" color="gray" className="mt-2 mb-1">
                      File Name
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {rejectionReasonModal.evidence.file_url.split("/").pop()}
                    </Typography>
                  </>
                )}
              </div>
            )}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 rounded-lg border border-red-200/50">
              <Typography variant="small" color="gray" className="mb-2 font-semibold">
                Rejection Reason:
              </Typography>
              <Typography
                variant="paragraph"
                className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed"
              >
                {rejectionReasonModal.reason || "No rejection reason provided."}
              </Typography>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="filled"
            onClick={() =>
              setRejectionReasonModal({ isOpen: false, evidence: null, reason: null })
            }
            className="bg-primary"
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: null, evidenceId: null })
        }
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === "request"
            ? "Delete Disciplinary Request"
            : deleteModal.type === "text_evidence"
            ? "Delete Text Evidence"
            : "Delete Evidence File"
        }
        description={
          deleteModal.type === "request"
            ? "Are you sure you want to delete this disciplinary request? This action cannot be undone."
            : deleteModal.type === "text_evidence"
            ? "Are you sure you want to delete this text evidence? This action cannot be undone."
            : "Are you sure you want to delete this evidence file? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ViewDetailDisciplinary;
