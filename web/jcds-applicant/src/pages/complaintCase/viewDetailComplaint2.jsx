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
  DialogFooter,
  Input,
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
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { toast } from "react-toastify";
import complaintService from "@/service/complaint.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import PreviewModal from "../requestManagement/document-preview-modal";
import ConfirmDialog from "../requestManagement/delete-modal";
import DecisionLetterModal from "@/widgets/DecisionLetterModal";

const ViewDetailComplaint = () => {
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
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Modal states for detailed views
  const [descriptionModal, setDescriptionModal] = useState({ isOpen: false, type: null, content: null });
  const [witnessesModal, setWitnessesModal] = useState({ isOpen: false, witnesses: [] });
  const [evidenceModal, setEvidenceModal] = useState({ isOpen: false, evidence: null });
  
  // Modal states for evidence management
  const [rejectionReasonModal, setRejectionReasonModal] = useState({ isOpen: false, evidence: null, reason: null });
  const [fileUploadPreviewModal, setFileUploadPreviewModal] = useState({ isOpen: false, file: null, evidenceId: null, type: null, previewUrl: null });
  const [addEvidenceModal, setAddEvidenceModal] = useState({ isOpen: false, file: null });
  
  // Letter modal state
  const [letterModal, setLetterModal] = useState({ isOpen: false, letter: null });

  const fullRequestId = location.state?.fullRequestId || complaintId;

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
      // Service now returns the complaint object directly
      console.log('Complaint data:', response);
      console.log('Status:', response?.status);
      console.log('Case:', response?.case);
      console.log('Decision:', response?.case?.decision);
      console.log('Decision status:', response?.case?.decision?.status);
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

  const handleBack = () => {
    navigate("/home/requests");
  };

  const handleEdit = () => {
    if (requestData?.status === "pending" || requestData?.status === "returned") {
      // navigate(`/home/edit-complaint-request/${complaintId}`, {
      navigate(`/home/edit-complaint-request-v2/${complaintId}`, {
        state: { fullRequestId, requestData }
      });
    } else {
      toast.warning("Only pending or returned complaints can be edited");
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
      await complaintService.modifyComplaintEvidence(evidenceId, "replace", file);
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
  };

  const handleAddEvidenceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL for images
      const previewUrl = file.type?.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : null;
      
      // Close the add evidence modal first
      setAddEvidenceModal({ isOpen: false, file: null });
      
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
        await complaintService.modifyComplaintEvidence(evidenceId, "replace", file);
        toast.success("File replaced successfully");
      } else if (type === 'add') {
        // Use updateComplaint to add new evidence
        const formData = new FormData();
        formData.append("evidence_files", file);
        
        await complaintService.updateComplaint(fullRequestId, formData);
        toast.success("New evidence added successfully");
        setAddEvidenceModal({ isOpen: false, file: null });
      }

      // Close preview modal and cleanup preview URL first
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

      // Refresh data after closing modal
      await fetchRequestDetails();
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
    setDeleteModal({ isOpen: false, type: null, evidenceId: null });
  };

  const handleViewFile = async (fileUrl) => {
    if (!fileUrl) {
      toast.error("No file URL provided");
      return;
    }

    try {
      setPreviewLoading(true);
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
      
      console.log("Opening file preview:", fullUrl);
      
      // For PDFs and images, we can try to use the URL directly
      // For other file types, we need to fetch and create a File object
      const fileExtension = fileUrl.split('.').pop()?.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf';
      
      if (isImage || isPdf) {
        // For images and PDFs, we can pass the URL directly to the PreviewModal
        // The modal can handle URL strings
        setPreviewModal({ isOpen: true, file: fullUrl });
        setPreviewLoading(false);
        return;
      }
      
      // For other file types, fetch and create File object
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
      
      console.log("File created successfully:", fileName, contentType);
      setPreviewModal({ isOpen: true, file });
      setPreviewLoading(false);
    } catch (error) {
      console.error("Error opening file:", error);
      console.error("File URL:", fileUrl);
      setPreviewLoading(false);
      toast.error(error.message || "Failed to open file. Please check the console for details.");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null });
  };

  const getShortId = (id) => {
    if (!id) return "";
    const idString = String(id);
    return idString.length > 8 ? idString.substring(0, 8) : idString;
  };

  const getPreview = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      pending_director_approval: "Pending", // Hiding internal status
      under_investigation: "Under Investigation",
      accepted: "Accepted",
      decided: "Decided",
      rejected: "Rejected"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      pending_director_approval: "bg-yellow-100 text-yellow-800", // Same as pending
      under_investigation: "bg-blue-100 text-blue-800",
      accepted: "bg-green-100 text-green-800",
      decided: "bg-primary/10 text-primary",
      rejected: "bg-red-100 text-red-800"
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getEvidenceStatusText = (status) => {
    const statusMap = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected"
    };
    return statusMap[status] || status;
  };

  const getEvidenceStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Typography variant="h6" color="gray" className="mb-4">
            {error || "Complaint not found"}
          </Typography>
          <Button onClick={handleBack} className="bg-primary">
            Back to Requests
          </Button>
        </Card>
      </div>
    );
  }

  // Data from backend - access from complaint object
  const witnesses = requestData?.witnesses || [];
  const evidences = requestData?.evidences || [];
  
  // Debug: Log evidence structure to help identify file URL fields
  if (evidences.length > 0) {
    console.log("Evidence structure sample:", evidences[0]);
  }

  // Check if complaint allows file modifications
  const canModifyFiles = requestData && requestData?.status === "under_investigation";

  const canModifyEvidence = (evidence) => {
    return canModifyFiles && (evidence.status === "rejected" || evidence.status === "pending");
  };

  // Check if at least one evidence is rejected
  const hasRejectedEvidence = evidences.some(evidence => 
    evidence.status === "rejected"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <Typography variant="h5" className="text-primary font-bold">
                  Complaint Details
                </Typography>
                <Typography variant="small" color="gray" className="text-sm">
                  Complaint ID: #{getShortId(requestData?.complaint_id || requestData?.id || complaintId)}
                </Typography>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {(requestData?.status === "pending" || requestData?.status === "returned") && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </Button>
                  {requestData?.status === "pending" && (
                  <Button
                    variant="outlined"
                    color="red"
                    onClick={handleDeleteComplaint}
                    className="flex items-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </Button>
                  )}
                </>
              )}
              <Button
                variant="outlined"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed height, no scrolling */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
          {/* Left Card */}
          <Card className="p-4 shadow-md border border-gray-200 overflow-y-auto">
            {/* Judge Information */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <Typography variant="h6" className="text-primary font-bold">
                    Judge Information
                  </Typography>
                </div>
                <Chip
                  value={getStatusText(requestData?.status)}
                  className={`${getStatusColor(requestData?.status)} text-xs`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Judge Name
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {requestData?.judge_name || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Judge Court
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {requestData?.judge_court || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Case File Number
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {requestData?.case_file_number || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Case Type
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {requestData?.case_type || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Submission Date
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {requestData?.created_at || requestData?.submission_date
                      ? format(new Date(requestData.created_at || requestData.submission_date), "MMM dd, yyyy")
                      : "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" color="gray" className="text-[15px] mb-1">
                    Act Date
                  </Typography>
                  <Typography variant="small" className="font-semibold text-[15px]">
                    {formatDate(requestData.act_date)}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Complaint Description */}
            {requestData?.detailed_description && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                    <Typography variant="h6" className="text-primary font-bold">
                      Complaint Description
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setDescriptionModal({ 
                      isOpen: true, 
                      type: "complaint", 
                      content: requestData.detailed_description 
                    })}
                    className="text-primary text-xs"
                  >
                    View Details
                  </Button>
                </div>
                <Typography variant="small" className="text-gray-700 text-[15px] line-clamp-6">
                  {getPreview(requestData.detailed_description, 200)}
                </Typography>
              </div>
            )}

            {/* Damage Description */}
            {requestData?.damage_description && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-primary" />
                    <Typography variant="h6" className="text-primary font-bold">
                      Damage Caused
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setDescriptionModal({ 
                      isOpen: true, 
                      type: "damage", 
                      content: requestData.damage_description 
                    })}
                    className="text-primary text-xs"
                  >
                    View Details
                  </Button>
                </div>
                <Typography variant="small" className="text-gray-700 text-[15px] line-clamp-6">
                  {getPreview(requestData.damage_description, 200)}
                </Typography>
              </div>
            )}

            {/* Additional Explanation */}
            {requestData?.additional_explanation && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                    <Typography variant="h6" className="text-primary font-bold">
                      Additional Explanation
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => setDescriptionModal({ 
                      isOpen: true, 
                      type: "additional", 
                      content: requestData.additional_explanation 
                    })}
                    className="text-primary text-xs"
                  >
                    View Details
                  </Button>
                </div>
                <Typography variant="small" className="text-gray-700 text-[15px] line-clamp-6">
                  {getPreview(requestData.additional_explanation, 200)}
                </Typography>
              </div>
            )}
          </Card>

          {/* Right Card */}
          <Card className="p-4 shadow-md border border-gray-200 overflow-y-auto">
            {/* Witnesses */}
            {witnesses.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <Typography variant="h6" className="text-primary font-bold">
                      Witnesses ({witnesses.length})
                    </Typography>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {witnesses.map((witness, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded border border-gray-200 flex flex-col"
                    >
                      <Typography
                        variant="small"
                        className="font-semibold text-[15px] truncate"
                        title={witness.witness_name || "N/A"}
                      >
                        {witness.witness_name || "N/A"}
                      </Typography>
                      <Typography
                        variant="small"
                        color="gray"
                        className="text-[15px] truncate"
                        title={witness.witness_phone_number || "N/A"}
                      >
                        {witness.witness_phone_number || "N/A"}
                      </Typography>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence & Documents */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DocumentIcon className="w-5 h-5 text-primary" />
                  <Typography variant="h6" className="text-primary font-bold">
                    Evidence & Documents ({evidences.length})
                  </Typography>
                </div>
                {hasRejectedEvidence && canModifyFiles && (
                  <Button
                    size="sm"
                    variant="filled"
                    onClick={() => setAddEvidenceModal({ isOpen: true, file: null })}
                    className="flex items-center gap-2 bg-green-600 text-sm px-3 py-1.5"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Evidence
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {evidences.length > 0 ? (
                  evidences.map((evidence, index) => {
                    const evidenceFileUrl = evidence.public_url || evidence.file_url || evidence.file_path;
                    const hasFile = !!(evidenceFileUrl);
                    return (
                      <div key={evidence.complaint_evidence_id} className="p-3 bg-gray-50 rounded border border-gray-200 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {hasFile ? (
                              <button
                                onClick={() => handleViewFile(evidenceFileUrl)}
                                className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="View File"
                                disabled={previewLoading}
                              >
                                {previewLoading ? (
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                <EyeIcon className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <EyeIcon className="w-4 h-4 text-gray-300 cursor-not-allowed" title="No file available" />
                            )}
                            <Typography variant="small" className="font-semibold text-[15px]">
                              Evidence {index + 1}
                            </Typography>
                          </div>
                          {(() => {
                            const status = evidence.status;
                            if (status === "pending") {
                              return (
                                <div className="ml-2" title="Pending">
                                  <ClockIcon className="w-5 h-5 text-primary" />
                                </div>
                              );
                            } else if (status === "uploaded") {
                              return (
                                <div className="ml-2" title="Uploaded">
                                  <ClockIcon className="w-5 h-5 text-primary" />
                                </div>
                              );
                            } else if (status === "verified" || status === "approved") {
                              return (
                                <div className="ml-2" title="Verified">
                                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                </div>
                              );
                            } else if (status === "rejected") {
                              return (
                                <div className="ml-2" title="Rejected">
                                  <XCircleIcon className="w-5 h-5 text-red-600" />
                                </div>
                              );
                            } else {
                              return (
                          <Chip
                                  value={getEvidenceStatusText(status)}
                                  className={`${getEvidenceStatusColor(status)} text-xs ml-2`}
                          />
                              );
                            }
                          })()}
                        </div>
                        {evidence.description && (
                          <Typography variant="small" className="text-gray-600 text-[15px] mb-2 line-clamp-2">
                            {evidence.description}
                          </Typography>
                        )}
                        {canModifyEvidence(evidence) && (
                          <div className="flex items-center gap-2 mt-auto flex-wrap">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              id={`replace-evidence-${evidence.complaint_evidence_id}`}
                              className="hidden"
                              onChange={(event) => handleEvidenceFileChange(evidence.complaint_evidence_id, event)}
                              disabled={evidenceActionLoading}
                            />
                              <Button
                                size="sm"
                                variant="outlined"
                              className="p-1.5"
                                disabled={evidenceActionLoading}
                              title="Replace"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const input = document.getElementById(`replace-evidence-${evidence.complaint_evidence_id}`);
                                if (input) {
                                  input.click();
                                }
                              }}
                              >
                              <PencilIcon className="w-4 h-4" />
                              </Button>
                            <Button
                              size="sm"
                              variant="outlined"
                              color="red"
                              onClick={() => handleOpenEvidenceDelete(evidence.complaint_evidence_id)}
                              className="p-1.5"
                              disabled={evidenceActionLoading}
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {evidence.rejection_reason && (
                          <Button
                            size="sm"
                            variant="text"
                            onClick={() => setRejectionReasonModal({ 
                              isOpen: true, 
                              evidence: evidence, 
                              reason: evidence.rejection_reason 
                            })}
                            className="text-xs text-red-600 mt-2 w-full"
                          >
                            View Rejection Reason
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 flex items-center justify-center py-4">
                    <Typography variant="small" color="gray" className="text-[15px]">
                      No evidence available
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Decision Status */}
            {(() => {
              // Check multiple possible paths for status and decision
              const status = requestData?.status || requestData?.complaint?.status;
              const decisionStatusName = requestData?.case?.decision?.status?.name || 
                                        requestData?.complaint?.case?.decision?.status?.name;
              const decision = requestData?.case?.decision || requestData?.complaint?.case?.decision;
              
              // Get complainant letter if available
              const complainantLetter = decision?.letters?.find(l => l.letter_type === 'complainant_letter');
              
              const isDecided = status === "decided" || status === "Decided" || status === "decided";
              
              if (isDecided && decisionStatusName) {
                return (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <Typography variant="h6" className="text-green-600 font-bold">
                          Decision Status
                        </Typography>
                      </div>
                      {complainantLetter && (
                        <Button
                          size="sm"
                          variant="filled"
                          onClick={() => setLetterModal({ isOpen: true, letter: complainantLetter })}
                          className="flex items-center gap-2 bg-primary"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                          View Letter
                        </Button>
                      )}
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <Typography variant="small" color="primary" className="mb-1 font-semibold">
                        Decision:
                      </Typography>
                      <Typography variant="small" className="text-primary text-[15px] font-semibold capitalize">
                        {decisionStatusName}
                      </Typography>
                      {decision?.external_decision && (
                        <>
                          <Typography variant="small" color="primary" className="mt-2 mb-1 font-semibold">
                            Description:
                          </Typography>
                          <Typography variant="small" className="text-primary text-[15px]">
                            {decision.external_decision}
                          </Typography>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Rejection/Return Reason */}
            {(["rejected", "returned"].includes(requestData?.status)) && (() => {
              const rejection = Array.isArray(requestData?.complaintRejection) 
                ? requestData.complaintRejection[0] 
                : requestData?.complaintRejection;
              const reasonComment = rejection?.comment || requestData?.rejection_comment || requestData?.rejection_reason;
              
              return reasonComment ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className={`w-5 h-5 ${requestData?.status === "returned" ? "text-orange-600" : "text-red-600"}`} />
                    <Typography variant="h6" className={`${requestData?.status === "returned" ? "text-orange-600" : "text-red-600"} font-bold`}>
                      {requestData?.status === "returned" ? "Return Reason" : "Rejection Reason"}
                    </Typography>
                  </div>
                  <Typography variant="small" className="text-gray-800 text-[15px]">
                    {reasonComment}
                  </Typography>
                </div>
              ) : null;
            })()}
          </Card>
        </div>
      </div>

      {/* Description Modal */}
      <Dialog
        open={descriptionModal.isOpen}
        handler={() => setDescriptionModal({ isOpen: false, type: null, content: null })}
        className="!max-w-[650px] !w-[90%] sm:!w-[70%] md:!w-[50%]"
      >
        <DialogHeader>
          <Typography variant="h5" className="text-primary">
            {descriptionModal.type === "complaint" && "Complaint Description"}
            {descriptionModal.type === "damage" && "Damage Caused"}
            {descriptionModal.type === "additional" && "Additional Explanation"}
          </Typography>
        </DialogHeader>
        <DialogBody className="!max-h-[70vh] !overflow-y-auto">
          <Typography variant="small" className="text-gray-700 whitespace-pre-wrap">
            {descriptionModal.content}
          </Typography>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setDescriptionModal({ isOpen: false, type: null, content: null })}
            className="mr-1"
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Witnesses Modal */}
      <Dialog
        open={witnessesModal.isOpen}
        handler={() => setWitnessesModal({ isOpen: false, witnesses: [] })}
        className="!max-w-[900px] !w-[95%] sm:!w-[85%] md:!w-[70%]"
      >
        <DialogHeader>
          <Typography variant="h5" className="text-primary">
            Witnesses ({witnessesModal.witnesses.length})
          </Typography>
        </DialogHeader>
        <DialogBody className="!max-h-[70vh] !overflow-y-auto">
          <div className="space-y-3">
            {witnessesModal.witnesses.map((witness, index) => (
              <Card key={index} className="p-4 border border-gray-200">
                <Typography variant="h6" className="mb-2">
                  {witness.witness_name || "N/A"}
                </Typography>
                <div className="space-y-1">
                  <Typography variant="small" color="gray" className="text-[15px]">
                    Address: {witness.witness_address || "N/A"}
                  </Typography>
                  {witness.witness_phone_number && (
                    <Typography variant="small" color="gray" className="text-[15px]">
                      Phone: {witness.witness_phone_number}
                    </Typography>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setWitnessesModal({ isOpen: false, witnesses: [] })}
            className="mr-1"
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleCancelDelete}
        title={deleteModal.type === "complaint" ? "Delete Complaint" : "Delete Evidence"}
        description={
          deleteModal.type === "complaint"
            ? "Are you sure you want to delete this complaint? This action cannot be undone."
            : "Are you sure you want to delete this evidence? This action cannot be undone."
        }
      />

      {/* Rejection Reason Modal */}
      <Dialog
        open={rejectionReasonModal.isOpen}
        handler={() => setRejectionReasonModal({ isOpen: false, evidence: null, reason: null })}
        className="!max-w-[650px] !w-[90%] sm:!w-[70%] md:!w-[50%]"
      >
        <DialogHeader className="flex items-center gap-2">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          </div>
          <Typography variant="h5" className="text-red-600">
            Rejection Reason
          </Typography>
        </DialogHeader>
        <DialogBody className="!max-h-[70vh] !overflow-y-auto">
          <div className="space-y-4">
            {rejectionReasonModal.evidence && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <Typography variant="small" color="gray" className="mb-1">
                  Evidence Type
                </Typography>
                <Typography variant="small" className="font-semibold">
                  {rejectionReasonModal.evidence.file_url || rejectionReasonModal.evidence.public_url
                    ? "File Attachment"
                    : "Text Evidence"}
                </Typography>
                {(rejectionReasonModal.evidence.file_url || rejectionReasonModal.evidence.public_url) && (
                  <>
                    <Typography variant="small" color="gray" className="mt-2 mb-1">
                      File Name
                    </Typography>
                    <Typography variant="small" className="font-medium">
                      {(rejectionReasonModal.evidence.file_url || rejectionReasonModal.evidence.public_url).split("/").pop()}
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
            onClick={() => setRejectionReasonModal({ isOpen: false, evidence: null, reason: null })}
            className="bg-primary"
          >
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* File Upload Preview Modal */}
      <Dialog
        open={fileUploadPreviewModal.isOpen}
        handler={(value) => {
          if (!value) {
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
          }
        }}
        className="!max-w-[1000px] !w-[95%] sm:!w-[85%] md:!w-[75%]"
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
        <DialogBody className="!max-h-[80vh] !overflow-y-auto">
          <div className="space-y-4">
            {fileUploadPreviewModal.file && (
              <>
                {/* File Preview */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
                  {fileUploadPreviewModal.file.type?.startsWith('image/') && fileUploadPreviewModal.previewUrl ? (
                    <img
                      src={fileUploadPreviewModal.previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
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

      {/* Decision Letter Modal */}
      <DecisionLetterModal
        isOpen={letterModal.isOpen}
        onClose={() => setLetterModal({ isOpen: false, letter: null })}
        letter={letterModal.letter}
        caseNumber={requestData?.case_file_number || requestData?.complaint_id}
      />
    </div>
  );
};

export default ViewDetailComplaint;

