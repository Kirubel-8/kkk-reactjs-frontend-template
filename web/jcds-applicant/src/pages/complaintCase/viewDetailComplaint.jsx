import React, { useState, useEffect, useCallback } from "react";
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
  DialogFooter
} from "@material-tailwind/react";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { toast } from "react-toastify";
import complaintService from "@/service/complaint.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import PreviewModal from "../requestManagement/document-preview-modal";
import ConfirmDialog from "../requestManagement/delete-modal";

const ViewDetailComplaint = () => {
  console.log("ViewDetailComplaint component is rendering");
  
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, evidenceId: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [evidenceActionLoading, setEvidenceActionLoading] = useState(false);
  const [expandedComplaintDesc, setExpandedComplaintDesc] = useState(false);
  const [expandedDamageDesc, setExpandedDamageDesc] = useState(false);
  const [expandedAdditionalDesc, setExpandedAdditionalDesc] = useState(false);
  const [rejectionReasonModal, setRejectionReasonModal] = useState({
    isOpen: false,
    evidence: null,
    reason: null
  });

  // Get the full request ID from location state or use the parameter
  const fullRequestId = location.state?.fullRequestId || complaintId;
  
  console.log("ViewDetailComplaint - complaintId:", complaintId);
  console.log("ViewDetailComplaint - location.state:", location.state);
  console.log("ViewDetailComplaint - fullRequestId:", fullRequestId);
  console.log("ViewDetailComplaint - loading:", loading);
  console.log("ViewDetailComplaint - error:", error);

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
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 0);
      setError(null);
      console.log("Fetching complaint details for ID:", fullRequestId);
      const response = await complaintService.getComplaintById(fullRequestId);
      console.log("API Response:", response);

      const data = response.data || response;
      setRequestData(data);
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

  const handleBack = () => {
    navigate("/home/requests");
  };

  const handleEdit = () => {
    if (requestData?.status === "pending") {
      navigate(`/home/edit-complaint-request/${complaintId}`, {
        state: { fullRequestId, requestData }
      });
    } else {
      toast.warning("Only pending complaints can be edited");
    }
  };

  const handleDeleteComplaint = () => {
    setDeleteModal({ isOpen: true, type: "complaint", evidenceId: null });
  };

  const handleOpenEvidenceDelete = (evidenceId) => {
    setDeleteModal({ isOpen: true, type: "evidence", evidenceId });
  };

  const handleReplaceEvidenceFile = async (evidenceId, file) => {
    try {
      setEvidenceActionLoading(true);
      await complaintService.modifyComplaintEvidence(
        evidenceId,
        "replace",
        file
      );
      toast.success("Evidence replaced successfully");
      await fetchRequestDetails();
    } catch (error) {
      console.error("Error replacing evidence file:", error);
      toast.error(error.message || "Failed to replace evidence file");
    } finally {
      setEvidenceActionLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    try {
      setEvidenceActionLoading(true);
      await complaintService.modifyComplaintEvidence(evidenceId, "delete");
      toast.success("Evidence deleted successfully");
      await fetchRequestDetails();
    } catch (error) {
      console.error("Error deleting evidence file:", error);
      toast.error(error.message || "Failed to delete evidence file");
    } finally {
      setEvidenceActionLoading(false);
    }
  };

  const handleEvidenceFileChange = (evidenceId, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    handleReplaceEvidenceFile(evidenceId, file);
  };

  const handleConfirmDelete = async () => {
    const { type, evidenceId } = deleteModal;
    try {
      setDeleteModal({ isOpen: false, type: null, evidenceId: null });

      if (type === "evidence" && evidenceId) {
        await handleDeleteEvidence(evidenceId);
        return;
      }

      if (type === "complaint") {
        setIsDeleting(true);
        startLoading();

        console.log("Deleting complaint with ID:", fullRequestId);
        await complaintService.deleteComplaint(fullRequestId);
        console.log("Complaint deleted successfully");
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
    setDeleteModal({ isOpen: false, type: null, evidenceId: null });
  };

  const handleViewFile = async (fileUrl) => {
    try {
      // Construct full URL using backend port
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
      
      console.log("Fetching file from backend URL:", fullUrl);
      
      // Fetch the file from backend
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      // Get file data
      const blob = await response.blob();
      const fileName = fileUrl.split('/').pop() || 'document';
      
      // Create a File object for the modal
      const file = new File([blob], fileName, { type: blob.type });
      
      // Open modal with the file
      setPreviewModal({ isOpen: true, file });
      
    } catch (error) {
      console.error("Error opening file:", error);
      toast.error("Failed to open file");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null });
  };

  const exceedsWordThreshold = (text, threshold = 35) => {
    if (!text) return false;
    const str = String(text).replace(/[\n\r]+/g, ' ').trim();
    const words = str.split(/\s+/);
    return words.length > threshold;
  };

  const getWordsPreview = (text, wordLimit = 35) => {
    if (!text) return "";
    const words = String(text).replace(/[\n\r]+/g, ' ').trim().split(/\s+/);
    if (words.length <= wordLimit) return words.join(' ');
    return words.slice(0, wordLimit).join(' ') + ' ...';
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
          <title>Complaint Details - ${requestData.complaint_id?.toString().slice(0, 8) || requestData.id?.toString().slice(0, 8) || shortRequestId}</title>
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
            .witness-item {
              border-left: 2px solid #4475F2;
              padding-left: 8px;
              margin-bottom: 6px;
            }
            .witness-title {
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
            .damage-box {
              background-color: #f8d7da;
              padding: 8px;
              border-radius: 3px;
              line-height: 1.3;
              color: #721c24;
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
            <h1>Complaint Details</h1>
            <div class="subtitle">Complaint ID: #${requestData.complaint_id || requestData.id || complaintId}</div>
            <div class="subtitle">Printed on: ${currentDate}</div>
          </div>

          <div class="section">
            <div class="section-title">Complaint Status</div>
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
                  ${requestData.created_at || requestData.createdAt || requestData.submission_date
                    ? format(new Date(requestData.created_at || requestData.createdAt || requestData.submission_date), "MMMM dd, yyyy 'at' h:mm a")
                    : "N/A"
                  }
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Last Updated</div>
                <div class="info-value">
                  ${requestData.updated_at || requestData.updatedAt
                    ? format(new Date(requestData.updated_at || requestData.updatedAt), "MMMM dd, yyyy 'at' h:mm a")
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
                <div class="info-label">Judge Court</div>
                <div class="info-value">${requestData.judge_court || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case File Number</div>
                <div class="info-value">${requestData.case_file_number || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Case Type</div>
                <div class="info-value">${requestData.case_type || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Act Date</div>
                <div class="info-value">${requestData.act_date ? format(new Date(requestData.act_date), "MMMM dd, yyyy") : "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Complaint Address</div>
                <div class="info-value">${requestData.complainant_address || "N/A"}</div>
              </div>
            </div>
          </div>

          ${requestData.detailed_description ? `
          <div class="section">
            <div class="section-title">Complaint Description</div>
            <div class="description-box">${requestData.detailed_description}</div>
          </div>
          ` : ''}

          ${requestData.damage_description ? `
          <div class="section">
            <div class="section-title">Damage Caused</div>
            <div class="damage-box">${requestData.damage_description}</div>
          </div>
          ` : ''}

          ${requestData.additional_explanation ? `
          <div class="section">
            <div class="section-title">Additional Explanation</div>
            <div class="description-box">${requestData.additional_explanation}</div>
          </div>
          ` : ''}

          ${requestData.witnesses && requestData.witnesses.length > 0 ? `
          <div class="section">
            <div class="section-title">Witnesses</div>
            ${requestData.witnesses.map((witness, index) => `
              <div class="witness-item">
                <div class="witness-title">Witness #${index + 1}</div>
                <div class="info-value">${witness.witness_name || witness.name || "N/A"} - ${witness.witness_address || witness.contact || "N/A"}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${requestData.evidences && requestData.evidences.length > 0 ? `
          <div class="section">
            <div class="section-title">Evidence & Documents</div>
            ${requestData.evidences.map((evidence, index) => `
              <div class="evidence-item">
                <div class="evidence-title">File Attachment</div>
                <div class="evidence-description">Type: ${evidence.file_type || "Unknown"}</div>
                ${evidence.description ? `
                  <div class="evidence-description">${evidence.description}</div>
                ` : ''}
                ${(evidence.public_url || evidence.file_url) ? `
                  <div class="info-value" style="margin-top: 5px; font-size: 12px; color: #666;">
                    File: ${(evidence.public_url || evidence.file_url).split('/').pop()}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${(() => {
            const rejection = Array.isArray(requestData.complaintRejection) 
              ? requestData.complaintRejection[0] 
              : requestData.complaintRejection;
            const rejectionComment = rejection?.comment || requestData.rejection_comment || requestData.rejection_reason;
            return requestData.status === "rejected" && rejectionComment ? `
          <div class="section">
            <div class="section-title">Rejection Reason</div>
            <div class="damage-box">${rejectionComment}</div>
          </div>
          ` : '';
          })()}

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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "under_investigation":
        return "bg-orange-100 text-orange-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "decided":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
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
      case "under_council_review":
        return "🏛️ Under Council Review";
      case "decided":
        return "📋 Decided";
      case "rejected":
        return "❌ Rejected";
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, "MMMM dd, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const complaintStatus = (requestData?.status || "").toLowerCase();
  const canModifyFiles = complaintStatus === "under_investigation";
  const canModifyEvidence = (evidence) => {
    if (!evidence) return false;
    return complaintStatus === "under_investigation" && (evidence.status || "").toLowerCase() === "rejected";
  };

  const getEvidenceStatusText = (status) => {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "uploaded":
        return "Submitted";
      default:
        return status || "Pending";
    }
  };

  const getEvidenceStatusColor = (status) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "approved") return "bg-green-100 text-green-800";
    if (normalized === "rejected") return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <Typography variant="h6" color="gray">
            Loading complaint details...
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
            Error loading complaint details
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
            Complaint not found
          </Typography>
          <Typography variant="small" color="gray" className="mb-4">
            The requested complaint could not be found or you don't have permission to view it.
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4475F229] rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#a8bef0]" />
                </div>
                <div>
                  <Typography variant="h5" className="text-primary sm:text-2xl lg:text-3xl">
                    Complaint Details
                  </Typography>
                  <Typography variant="small" color="gray" className="text-xs sm:text-sm">
                    Complaint ID: #{requestData.complaint_id || requestData.id || complaintId}
                  </Typography>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end w-full sm:w-auto space-x-2 sm:space-x-3">
              {requestData.status === "pending" && (
                <>
                  <Button
                    variant="outlined"
                    color="red"
                    onClick={handleDeleteComplaint}
                    className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                  >
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Delete</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </>
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
                  Complaint Status
                </Typography>
                <Chip
                  value={getStatusText(requestData.status)}
                  className={`${getStatusColor(requestData.status)} font-medium`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <Typography variant="small" color="gray">
                      Submission Date
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {requestData.created_at || requestData.createdAt || requestData.submission_date
                        ? format(
                            new Date(requestData.created_at || requestData.createdAt || requestData.submission_date),
                            "MMMM dd, yyyy 'at' h:mm a"
                          )
                        : "N/A"}
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <Typography variant="small" color="gray">
                      Act Date
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {formatDate(requestData.act_date)}
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
                    Judge Court
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.judge_court || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="mb-1">
                    Case File Number
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.case_file_number || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="mb-1">
                    Case Type
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.case_type || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="mb-1">
                    Complaint Address
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.complainant_address|| "N/A"}
                  </Typography>
                </div>
              </div>
            </Card>

            {/* Complaint Description */}
            {requestData.detailed_description && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Complaint Description
                  </Typography>
                </div>
                <div className="border-l-4 border-primary pl-4 py-3  rounded-lg">
                  <Typography 
                    variant="small" 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                  >
                    {expandedComplaintDesc
                      ? requestData.detailed_description
                      : getWordsPreview(requestData.detailed_description, 35)}
                  </Typography>
                  {exceedsWordThreshold(requestData.detailed_description) && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => setExpandedComplaintDesc((p) => !p)}
                        className="text-xs font-medium text-primary normal-case"
                      >
                        {expandedComplaintDesc ? "Read less" : "Read more"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Damage Description */}
            {requestData.damage_description && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Damage Caused
                  </Typography>
                </div>
                <div className="border-l-4 border-primary pl-4 py-3 rounded-lg ">
                  <Typography 
                    variant="small" 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                  >
                    {expandedDamageDesc
                      ? requestData.damage_description
                      : getWordsPreview(requestData.damage_description, 35)}
                  </Typography>
                  {exceedsWordThreshold(requestData.damage_description) && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => setExpandedDamageDesc((p) => !p)}
                        className="text-xs font-medium text-primary normal-case"
                      >
                        {expandedDamageDesc ? "Read less" : "Read more"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Additional Explanation */}
            {requestData.additional_explanation && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentTextIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Additional Explanation
                  </Typography>
                </div>
                <div className="border-l-4 border-primary pl-4 py-3 rounded-lg">
                  <Typography 
                    variant="small" 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                  >
                    {expandedAdditionalDesc
                      ? requestData.additional_explanation
                      : getWordsPreview(requestData.additional_explanation, 35)}
                  </Typography>
                  {exceedsWordThreshold(requestData.additional_explanation) && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="text"
                        onClick={() => setExpandedAdditionalDesc((p) => !p)}
                        className="text-xs font-medium text-primary normal-case"
                      >
                        {expandedAdditionalDesc ? "Read less" : "Read more"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Witnesses */}
            {requestData.witnesses && requestData.witnesses.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UserIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Witnesses
                  </Typography>
                </div>
                <div className="space-y-3">
                  {requestData.witnesses.map((witness, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="w-5 h-5 text-gray-500" />
                        <div>
                          <Typography variant="small" className="font-medium">
                            Witness #{index + 1}
                          </Typography>
                          <Typography variant="small" color="gray">
                            {witness.witness_name || witness.name || "N/A"} - {witness.witness_address || witness.contact || "N/A"}
                          </Typography>
                        </div>
                      </div>
                      {(witness.witness_signature || witness.signature) && (
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => handleViewFile(witness.witness_signature || witness.signature)}
                          className="flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Signature
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Evidence */}
            {requestData.evidences && requestData.evidences.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentIcon className="w-6 h-6 text-primary" />
                  <Typography variant="h6" className="text-primary">
                    Evidence & Documents
                  </Typography>
                </div>
                <div className="space-y-4">
                  {requestData.evidences.map((evidence, index) => {
                    const evidenceFileUrl = evidence.public_url || evidence.file_url;
                    const evidenceStatus = (evidence.status || "").toLowerCase();
                    const statusClass =
                      evidenceStatus === "rejected"
                        ? "border-red-300 bg-red-50"
                        : evidenceStatus === "approved"
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-gray-50";

                    return (
                      <div
                        key={evidence.complaint_evidence_id || index}
                        className={`border rounded-lg p-4 ${statusClass}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div>
                            <Typography variant="small" className="font-semibold">
                              {evidence.file_type ? "File Attachment" : "Evidence"}
                            </Typography>
                            <Typography variant="small" color="gray">
                              Type: {evidence.file_type || "N/A"}
                            </Typography>
                            {evidence.description && (
                              <Typography variant="small" color="gray">
                                {evidence.description}
                              </Typography>
                            )}
                            {evidence.rejection_reason && exceedsWordThreshold(evidence.rejection_reason, 20) && (
                              <div className="mt-1">
                                <Button
                                  size="sm"
                                  variant="text"
                                  className="p-0 ml-1 text-[11px] text-primary normal-case hover:underline"
                                  onClick={() =>
                                    setRejectionReasonModal({
                                      isOpen: true,
                                      evidence,
                                      reason: evidence.rejection_reason,
                                    })
                                  }
                                >
                                  View more
                                </Button>
                              </div>
                            )}
                          </div>
                          <Chip
                            value={getEvidenceStatusText(evidence.status)}
                            className={`${getEvidenceStatusColor(evidence.status)} text-xs capitalize`}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {evidenceFileUrl ? (
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="outlined"
                                size="sm"
                                className="flex items-center gap-1 min-w-[110px]"
                                onClick={() => handleViewFile(evidenceFileUrl)}
                              >
                                <EyeIcon className="w-4 h-4" /> View File
                              </Button>
                              <Typography variant="small" color="gray" className="break-all">
                                {evidenceFileUrl.split("/").pop()}
                              </Typography>
                            </div>
                          ) : (
                            <Typography variant="small" color="gray">
                              No file attached
                            </Typography>
                          )}

                          {canModifyEvidence(evidence) && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                id={`replace-evidence-${evidence.complaint_evidence_id}`}
                                className="hidden"
                                onChange={(event) =>
                                  handleEvidenceFileChange(
                                    evidence.complaint_evidence_id,
                                    event
                                  )
                                }
                                disabled={evidenceActionLoading}
                              />
                              <label
                                htmlFor={`replace-evidence-${evidence.complaint_evidence_id}`}
                                className={`px-3 py-2 rounded cursor-pointer text-xs font-medium ${
                                  evidenceActionLoading
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                Replace File
                              </label>
                              <Button
                                variant="text"
                                color="red"
                                size="sm"
                                onClick={() => handleOpenEvidenceDelete(evidence.complaint_evidence_id)}
                                className="flex items-center gap-1"
                                disabled={evidenceActionLoading}
                              >
                                <TrashIcon className="w-4 h-4" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>

                        {evidence.rejection_reason && (
                          <div className="mt-3 p-2 bg-red-100 rounded">
                            <Typography variant="small" color="red" className="font-medium">
                              Rejection Reason:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {evidence.rejection_reason}
                            </Typography>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    Edit Complaint
                  </Button>
                )}
              </div>
            </Card>

            {/* Rejection Reason - Show when status is rejected */}
            {requestData.status === "rejected" && (
              (() => {
                // Handle both single object and array cases
                const rejection = Array.isArray(requestData.complaintRejection) 
                  ? requestData.complaintRejection[0] 
                  : requestData.complaintRejection;
                const rejectionComment = rejection?.comment || requestData.rejection_comment || requestData.rejection_reason;
                
                return rejectionComment ? (
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
                        {rejectionComment}
                      </Typography>
                    </div>
                  </Card>
                ) : null;
              })()
            )}

            {/* Complaint Summary */}
            <Card className="p-4 sm:p-6">
              <Typography variant="h6" className="text-primary mb-3 sm:mb-4 text-sm sm:text-base">
                Complaint Summary
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
                    Judge:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.judge_name || "N/A"}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Court:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.judge_court || "N/A"}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Case Type:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.case_type || "N/A"}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Address:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.complainant_address || "N/A"}
                  </Typography>
                </div>
                <div className="flex justify-between">
                  <Typography variant="small" color="gray">
                    Witnesses:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {requestData.witnesses?.length || 0}
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
                    Submitted:
                  </Typography>
                  <Typography variant="small" className="font-medium">
                    {formatDate(requestData.created_at || requestData.createdAt || requestData.submission_date)}
                  </Typography>
                </div>
                {requestData.act_date && (
                  <div className="flex justify-between">
                    <Typography variant="small" color="gray">
                      Act Date:
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {formatDate(requestData.act_date)}
                    </Typography>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
        />
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
                  {(rejectionReasonModal.evidence.file_type ? "File Attachment" : "Evidence")}
                </Typography>
                {(rejectionReasonModal.evidence.public_url || rejectionReasonModal.evidence.file_url) && (
                  <>
                    <Typography variant="small" color="gray" className="mt-2 mb-1">
                      File Name
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {(rejectionReasonModal.evidence.public_url || rejectionReasonModal.evidence.file_url).split("/").pop()}
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
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === "evidence"
            ? "Delete Evidence File"
            : "Delete Complaint"
        }
        description={
          deleteModal.type === "evidence"
            ? "Are you sure you want to delete this evidence file? This action cannot be undone."
            : "Are you sure you want to delete this complaint? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ViewDetailComplaint;
