import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Typography, Input, Textarea } from "@material-tailwind/react";
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  EyeIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlusIcon
} from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import customerAuthService from "@/service/customer-auth.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import PreviewModal from "../requestManagement/document-preview-modal";

const EditDisciplinary2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shortRequestId } = useParams();
  const { startLoading, stopLoading } = useLoading();
  
  
  // Applicant Info
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantGender, setApplicantGender] = useState("");

  // Court office options
  const courtOffices = [
    "Federal Supreme Court",
    "Federal High Court",
    "Federal First Instance Court",
    "Addis Ababa Supreme Court",
    "Addis Ababa High Court",
    "Addis Ababa First Instance Court",
  ];

  // Judge Info State
  const [judgeInfo, setJudgeInfo] = useState({
    judgeFullName: "",
    servingPlace: "",
    caseFileNumber: "",
    description: ""
  });

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [signature, setSignature] = useState(null);

  // Witness State
  const [witnessInfo, setWitnessInfo] = useState({});

  // Errors State
  const [errors, setErrors] = useState({});
  const [witnessErrors, setWitnessErrors] = useState({});
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });

  // Modal States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingEvidences, setExistingEvidences] = useState([]);
  const [removedWitnessIds, setRemovedWitnessIds] = useState([]);

  const fullRequestId = location.state?.fullRequestId || shortRequestId;
  const existingData = location.state?.requestData;

  const logo = "/jcdms-applicant/img/Courts-logo.png";

  // Fetch customer data from backend
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const customerAccountToken = localStorage.getItem("customerAccountToken");
        if (customerAccountToken) {
          const decodedToken = jwtDecode(customerAccountToken);
          const customerId = decodedToken.id;
          
          const response = await customerAuthService.getCustomerById(customerId);
          const customerData = response.data || response;
          
          setApplicantName(customerData.full_name || "");
          setApplicantPhone(customerData.phone_number || "");
          setApplicantAddress(customerData.address || "");
          setApplicantGender(customerData.gender || "");
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    };

    fetchCustomerData();
  }, []);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }, 0);
        setError(null);
        
        let requestData;
        if (existingData) {
          requestData = existingData;
        } else {
          const response = await DisciplinaryRequestService.getRequestById(fullRequestId);
          requestData = response.data || response;
        }

        console.log("Loading existing data:", requestData);

        const evidences = requestData.evidences || [];
        setExistingEvidences(evidences);

        // Separate additional information (no file_url)
        const additionalInfoEvidence = evidences.find(e => !e.file_url && !e.public_url && e.description) || null;
        const fileEvidences = evidences.filter(e => e.file_url || e.public_url);

        const documentsArray = await Promise.all(
          fileEvidences.map(async (evidence, index) => {
            const evidenceId = evidence.evidence_id || evidence.disciplinary_evidence_id;
            let fileInfo = {
              id: evidenceId || `evidence-${index}`,
              evidence_id: evidence.evidence_id || null,
              disciplinary_evidence_id: evidence.disciplinary_evidence_id || null,
              // Store both IDs for proper tracking
              allEvidenceIds: [evidence.evidence_id, evidence.disciplinary_evidence_id].filter(Boolean),
              description: evidence.description || "",
              fileUrl: evidence.public_url || evidence.file_url || null,
              name: `evidence-${index + 1}`,
              type: null,
              size: 0,
              isExisting: true
            };

            // Fetch file info if URL exists
            if (evidence.public_url || evidence.file_url) {
              try {
                const fileUrl = evidence.public_url || evidence.file_url;
                const fullUrl = fileUrl.startsWith('http') 
                  ? fileUrl 
                  : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                
                const response = await fetch(fullUrl, { method: 'HEAD' });
                if (response.ok) {
                  const fileNameFromUrl = fileUrl.split('/').pop() || `evidence-${index + 1}`;
                  const fileSize = parseInt(response.headers.get('content-length') || '0');
                  const fileType = response.headers.get('content-type') || 'application/octet-stream';
                
                  fileInfo = {
                    ...fileInfo,
                    name: fileNameFromUrl,
                    size: fileSize,
                    type: fileType
                  };
                }
              } catch (error) {
                console.warn(`Failed to fetch file info for ${fileUrl}:`, error);
                fileInfo.name = fileUrl.split('/').pop() || `evidence-${index + 1}`;
              }
            }

            return fileInfo;
          })
        );

        // Transform witness data
        const witnesses = (requestData.witnesses || []).map((witness, index) => ({
          id: witness.complaint_witness_id || witness.witness_id || `witness-${index}`,
          fullName: witness.witness_name || "",
          phoneNumber: witness.witness_phone_number || "",
          address: witness.witness_address || "",
          complaint_witness_id: witness.complaint_witness_id || witness.witness_id || null
        }));

        setJudgeInfo({
          judgeFullName: requestData.judge_name || requestData.judgeName || "",
          servingPlace: requestData.court_office || requestData.courtOffice || "",
          caseFileNumber: requestData.file_number || requestData.fileNumber || "",
          description: requestData.issues?.[0]?.description || ""
        });

        setDocuments(documentsArray);
        setAdditionalInformation(additionalInfoEvidence ? additionalInfoEvidence.description : "");
        setWitnessInfo({ 
          witnesses,
          currentWitness: { fullName: "", phoneNumber: "" }
        });
      } catch (error) {
        console.error("Error loading existing data:", error);
        setError(error.message || "Failed to load request data");
        toast.error("Failed to load request data");
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    if (fullRequestId) {
      loadExistingData();
    } else {
      setError("No request ID provided");
      setLoading(false);
      stopLoading();
    }
  }, [fullRequestId, existingData, stopLoading]);

  // Validation Functions
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'judgeFullName':
        if (!value.trim()) {
          newErrors.judgeFullName = 'Judge or Council Full Name is required';
        } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(value.trim())) {
          newErrors.judgeFullName = 'Name should contain only letters, spaces, Amharic characters, and forward slashes';
        } else if (value.trim().length < 2) {
          newErrors.judgeFullName = 'Name should be at least 2 characters';
        } else {
          delete newErrors.judgeFullName;
        }
        break;
        
      case 'servingPlace':
        if (!value) {
          newErrors.servingPlace = 'Serving place is required';
        } else {
          delete newErrors.servingPlace;
        }
        break;
        
      case 'caseFileNumber':
        if (value.trim() && value.trim().length < 3) {
          newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
        } else {
          delete newErrors.caseFileNumber;
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.trim().length < 10) {
          newErrors.description = 'Description should be at least 10 characters';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'additionalInformation':
        if (value.trim() && value.trim().length < 10) {
          newErrors.additionalInformation = 'Description should be at least 10 characters if provided';
        } else {
          delete newErrors.additionalInformation;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const validateAllFields = () => {
    const newErrors = {};
    
    if (!judgeInfo.judgeFullName.trim()) {
      newErrors.judgeFullName = 'Judge or Council Full Name is required';
    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(judgeInfo.judgeFullName.trim())) {
      newErrors.judgeFullName = 'Name should contain only letters, spaces, Amharic characters, and forward slashes';
    } else if (judgeInfo.judgeFullName.trim().length < 2) {
      newErrors.judgeFullName = 'Name should be at least 2 characters';
    }
    
    if (!judgeInfo.servingPlace) {
      newErrors.servingPlace = 'Serving place is required';
    }
    
    if (judgeInfo.caseFileNumber.trim() && judgeInfo.caseFileNumber.trim().length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    if (!judgeInfo.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (judgeInfo.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters';
    }
    
    if (additionalInformation.trim() && additionalInformation.trim().length < 10) {
      newErrors.additionalInformation = 'Description should be at least 10 characters if provided';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Judge Info Changes
  const handleJudgeInfoChange = (field, value) => {
    setJudgeInfo(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Handle Additional Information Change
  const handleAdditionalInformationChange = (value) => {
    setAdditionalInformation(value);
    validateField('additionalInformation', value);
  };

  // Handle Witness Changes
  const handleWitnessChange = (data) => {
    setWitnessInfo(data);
  };

  // Handle Witness Removal
  const handleRemoveWitness = (witnessId) => {
    if (witnessId) {
      setRemovedWitnessIds(prev => [...prev, witnessId]);
    }
    // Also remove from witnessInfo
    if (witnessInfo.witnesses) {
      const updatedWitnesses = witnessInfo.witnesses.filter(w => 
        w.complaint_witness_id !== witnessId && w.witness_id !== witnessId
      );
      handleWitnessChange({
        ...witnessInfo,
        witnesses: updatedWitnesses
      });
    }
  };

  // File Upload Functions
  const getFileIcon = (fileType) => {
    if (!fileType) {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
    
    if (fileType.startsWith('video/')) {
      return <VideoCameraIcon className="w-5 h-5 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <MusicalNoteIcon className="w-5 h-5 text-green-500" />;
    } else if (fileType.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-purple-500" />;
    } else {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newFiles = files.filter(file => {
      const isDuplicate = documents.some(doc => 
        doc.name === file.name && 
        doc.size === file.size &&
        doc.file instanceof File
      );
      return !isDuplicate;
    });
    
    if (newFiles.length === 0) {
      event.target.value = '';
      return;
    }
    
    const newDocuments = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      type: file.type,
      size: file.size,
      status: 'uploaded'
    }));
    
    setDocuments(prev => [...prev, ...newDocuments]);
    event.target.value = '';
  };

  const handleRemoveDocument = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handlePreviewFile = async (doc) => {
    if (doc.file) {
      setPreviewModal({ isOpen: true, file: doc.file });
    } else if (doc.fileUrl) {
      try {
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;
        
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        
        const blob = await response.blob();
        const fileName = doc.name || doc.fileUrl.split('/').pop() || 'document';
        const file = new File([blob], fileName, { type: blob.type });
        
        setPreviewModal({ isOpen: true, file });
      } catch (error) {
        console.error("Error fetching existing file:", error);
        toast.error("Failed to load file");
      }
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null });
  };

  // Submit Functions - Direct to terms after validation
  const handleSubmit = () => {
    if (validateAllFields() && !isSubmitting) {
    setShowTermsModal(true);
    }
  };

  // Submit Functions
  const handleTermsAccept = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      startLoading();

      const fd = new FormData();
      fd.append("judge_name", judgeInfo.judgeFullName || "");
      fd.append("court_office", judgeInfo.servingPlace || "");
      fd.append("file_number", judgeInfo.caseFileNumber || "");

      // Handle issues
      const existingIssue = existingData?.issues?.[0];
      const issuesPayload = [{
        issue_id: existingIssue?.issue_id || null,
        description: judgeInfo.description || ""
      }];
      fd.append("issues", JSON.stringify(issuesPayload));

      // Prepare evidences
      const textEvidences = [];
      const removeEvidenceIds = [];
      const newFiles = [];

      // Process existing documents / evidences
      documents.forEach((doc) => {
        // Check if this is an existing evidence (has evidence_id or disciplinary_evidence_id)
        const evidenceId = doc.evidence_id || doc.disciplinary_evidence_id || (doc.allEvidenceIds && doc.allEvidenceIds[0]);
        
        if (evidenceId) {
          if (doc.toRemove) {
            // If marked for removal, add to remove list
            const idToRemove = doc.evidence_id || doc.disciplinary_evidence_id || doc.allEvidenceIds?.[0];
            if (idToRemove && !removeEvidenceIds.includes(idToRemove)) {
              removeEvidenceIds.push(idToRemove);
            }
          } else {
            // Keep this evidence - add to textEvidences
            textEvidences.push({
              evidence_id: doc.evidence_id || doc.disciplinary_evidence_id || doc.allEvidenceIds?.[0] || null,
              description: doc.description || "",
              file_url: doc.fileUrl || null
            });
          }
        } else if (doc.file) {
          // New file upload (not an existing evidence)
          newFiles.push(doc);
        }
      });

      // Handle additional information as text evidence
      if (additionalInformation && additionalInformation.trim()) {
        const existingTextEvidence = existingEvidences.find(e => !e.file_url && !e.public_url && e.description);
        textEvidences.push({
          evidence_id: existingTextEvidence?.evidence_id || null,
          description: additionalInformation.trim(),
          file_url: null
        });
      }

      // Check for removed evidences - compare all possible ID combinations
      existingEvidences.forEach(existingEvidence => {
        const evidenceId = existingEvidence.evidence_id || existingEvidence.disciplinary_evidence_id;
        if (!evidenceId) return; // Skip if no ID
        
        // Only check file evidences (not text-only evidences)
        if (!existingEvidence.file_url && !existingEvidence.public_url) {
          return; // Skip text-only evidences
        }
        
        // Check if this evidence still exists in documents by comparing all possible ID fields
        const stillExists = documents.some(doc => {
          // Check evidence_id
          if (doc.evidence_id === existingEvidence.evidence_id && existingEvidence.evidence_id) {
            return true;
          }
          // Check disciplinary_evidence_id
          if (doc.disciplinary_evidence_id === existingEvidence.disciplinary_evidence_id && existingEvidence.disciplinary_evidence_id) {
            return true;
          }
          // Check allEvidenceIds array if it exists
          if (doc.allEvidenceIds && doc.allEvidenceIds.length > 0) {
            if (doc.allEvidenceIds.includes(existingEvidence.evidence_id) || 
                doc.allEvidenceIds.includes(existingEvidence.disciplinary_evidence_id)) {
              return true;
            }
          }
          // Check the id field (which might be set to either evidence_id or disciplinary_evidence_id)
          if (doc.id === existingEvidence.evidence_id || doc.id === existingEvidence.disciplinary_evidence_id) {
            return true;
          }
          return false;
        });
        
        // If evidence doesn't exist anymore, mark for removal
        if (!stillExists) {
          // Use the primary ID (evidence_id takes precedence, then disciplinary_evidence_id)
          const idToRemove = existingEvidence.evidence_id || existingEvidence.disciplinary_evidence_id;
          if (idToRemove && !removeEvidenceIds.includes(idToRemove)) {
            removeEvidenceIds.push(idToRemove);
            console.log("Tracking removed evidence:", idToRemove, existingEvidence);
        }
        }
      });
      
      console.log("Removed evidence IDs to send:", removeEvidenceIds);

      // Append evidences and removals
      fd.append("evidences", JSON.stringify(textEvidences));
      fd.append("remove_evidence_ids", JSON.stringify(removeEvidenceIds));

      // Append new files
      newFiles.forEach((doc) => {
        if (doc.file) {
          fd.append("evidence", doc.file, doc.name || doc.file.name);
        }
      });

      // Handle witnesses
      if (witnessInfo.witnesses && witnessInfo.witnesses.length > 0) {
        const witnessData = witnessInfo.witnesses.map((w) => ({
          witness_name: w.fullName || "",
          witness_address: w.address || "",
          witness_phone_number: w.phoneNumber || "",
          ...(w.complaint_witness_id && { complaint_witness_id: String(w.complaint_witness_id) })
        }));
        fd.append("witnesses", JSON.stringify(witnessData));
      }

      // Handle removal of witnesses
      if (removedWitnessIds.length > 0) {
        fd.append("remove_witness_ids", JSON.stringify(removedWitnessIds));
      }

      // Append signature if exists
      if (signature) {
        fd.append("signature", signature, signature.name);
      }

      console.log("FormData for update:");
      for (let [key, value] of fd.entries()) {
        console.log(key, value);
      }

      // Submit update request
      const result = await DisciplinaryRequestService.updateRequest(fullRequestId, fd);

      console.log("Update successful:", result);
      
      // Close terms modal
      setShowTermsModal(false);
      setIsSubmitting(false);
      stopLoading();
      
      // Navigate with state to show success snack on home page
      navigate("/home/requests", { 
        state: { 
          showSuccessSnack: true,
          successMessage: "Disciplinary case updated successfully"
        } 
      });
    } catch (err) {
      console.error("Submit error:", err);
      setIsSubmitting(false);
      stopLoading();
      
      // Close terms modal on error
      setShowTermsModal(false);
      
      // Show error notification after a small delay to ensure modal is closed
      // Don't show backend error details, just show generic failure message
      setTimeout(() => {
        toast.error("Failed to update", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            backgroundColor: "#ffffff",
            color: "#ef4444",
            border: "none",
            borderBottom: "1px solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999,
          },
          className: "toast-error-custom",
        });
      }, 100);
    }
  };

  const handleTermsClose = () => {
    setShowTermsModal(false);
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate("/home/requests");
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
  };


  const getInputClassName = (field) => {
    return errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <Typography variant="h6" color="gray">
            Loading request data...
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
            Error loading request data
          </Typography>
          <Typography color="gray" className="mb-4">
            {error}
          </Typography>
          <Button onClick={() => navigate("/home/requests")} className="bg-primary">
            Back to Requests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-1 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center">
                <img src={logo} alt="logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  Edit Disciplinary Case
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-primary">
                  Request ID: #{fullRequestId?.toString().slice(0, 8) || shortRequestId}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end w-full sm:w-auto">
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCancel}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <XMarkIcon className="w-3 h-3 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Cancel Request</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
          {/* Left Side - Judge Info & Witnesses */}
            <div className="flex flex-col h-full min-h-[500px] lg:min-h-0">
            {/* Combined Judge Info & Witness Card */}
            <Card className="p-4 sm:p-5 lg:p-6 flex flex-col shadow-lg border border-gray-200 h-full overflow-y-auto">
                <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                  Judge/Case Information
                  </Typography>
                
                <div className="flex flex-col space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                        Judge/Council Name <span className="text-red-500">*</span>
                      </Typography>
                      <Input
                        placeholder="Enter Name"
                        value={judgeInfo.judgeFullName}
                        onChange={(e) => handleJudgeInfoChange('judgeFullName', e.target.value)}
                        className={`w-full max-w-[250px] ${getInputClassName('judgeFullName')}`}
                        containerProps={{ className: "w-full max-w-[250px]" }}
                      />
                      {errors.judgeFullName && (
                        <Typography variant="small" className="text-red-500 mt-1 text-xs">
                          {errors.judgeFullName}
                      </Typography>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                        Court Office <span className="text-red-500">*</span>
                      </Typography>
                      <select
                        value={judgeInfo.servingPlace || ""}
                        onChange={(e) => handleJudgeInfoChange('servingPlace', e.target.value)}
                        className={`w-full max-w-[250px] px-3 py-2.5 text-sm bg-transparent text-gray-700 focus:outline-none border rounded-lg ${getInputClassName('servingPlace')}`}
                        style={{
                          border: errors.servingPlace ? '1px solid #ef4444' : '1px solid #9ca3af',
                          borderRadius: '6px',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <option value="" disabled className="text-gray-400 italic text-sm">
                          Select Court Office
                        </option>
                        {courtOffices.map((office, index) => (
                          <option 
                            key={index} 
                            value={office}
                            className="text-gray-700 text-sm"
                          >
                            {office}
                          </option>
                        ))}
                      </select>
                      {errors.servingPlace && (
                        <Typography variant="small" className="text-red-500 mt-1 text-xs">
                          {errors.servingPlace}
                      </Typography>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                        Case File Number
                      </Typography>
                      <Input
                        placeholder="Enter File Number"
                        value={judgeInfo.caseFileNumber}
                        onChange={(e) => handleJudgeInfoChange('caseFileNumber', e.target.value)}
                        className={`w-full max-w-[250px] ${getInputClassName('caseFileNumber')}`}
                        containerProps={{ className: "w-full max-w-[250px]" }}
                      />
                      {errors.caseFileNumber && (
                        <Typography variant="small" className="text-red-500 mt-1 text-xs">
                          {errors.caseFileNumber}
                      </Typography>
                      )}
                    </div>
                  </div>
                
                  <div className="space-y-1 flex flex-col">
                    <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                      Disciplinary Issue <span className="text-red-500">*</span>
                </Typography>
                    <Textarea
                      placeholder="Describe about the disciplinary issue in detail..."
                      value={judgeInfo.description}
                      onChange={(e) => handleJudgeInfoChange('description', e.target.value)}
                      className={`min-h-[100px] sm:min-h-[120px] ${getInputClassName('description')}`}
                      rows={4}
                    />
                    {errors.description && (
                      <Typography variant="small" className="text-red-500 mt-1 text-xs">
                        {errors.description}
                      </Typography>
                    )}
                  </div>
                </div>

              {/* Witness Information Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Typography variant="h5" className="text-primary font-bold mb-3 sm:mb-4 pb-2 border-b border-gray-200 text-base sm:text-lg">
                  Witness Information <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </Typography>
                
                <div className="flex flex-col space-y-3">
                {/* Add Witness Form */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <div className="flex-1 max-w-[200px] min-h-[70px]">
                      <Typography variant="small" className="text-primary mb-1 font-semibold text-sm">
                        Full Name 
                      </Typography>
                      <Input
                        placeholder="Enter witness full name"
                        value={witnessInfo.currentWitness?.fullName || ""}
                        onChange={(e) => {
                          const currentWitness = witnessInfo.currentWitness || {};
                          const value = e.target.value;
                          handleWitnessChange({
                            ...witnessInfo,
                            currentWitness: { ...currentWitness, fullName: value }
                          });
                          
                          // Real-time validation
                          const newErrors = { ...witnessErrors };
                          if (value.trim() && value.trim().length < 2) {
                            newErrors.fullName = 'Full name should be at least 2 characters';
                          } else if (value.trim() && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(value.trim())) {
                            newErrors.fullName = 'Name should contain only letters and spaces';
                          } else {
                            delete newErrors.fullName;
                          }
                          setWitnessErrors(newErrors);
                        }}
                        className={`w-full max-w-[200px] text-sm ${witnessErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                        containerProps={{ className: "w-full max-w-[200px]" }}
                      />
                      <div className="h-5 mt-0.5">
                        {witnessErrors.fullName && (
                          <Typography variant="small" className="text-red-500 text-xs">
                            {witnessErrors.fullName}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 max-w-[200px] min-h-[70px]">
                      <Typography variant="small" className="text-primary mb-1 font-semibold text-sm">
                        Phone Number
                      </Typography>
                      <Input
                        placeholder="start with 09/07xxxxxxxx"
                        value={witnessInfo.currentWitness?.phoneNumber || ""}
                        onChange={(e) => {
                          const currentWitness = witnessInfo.currentWitness || {};
                          const value = e.target.value;
                          // Only allow digits and spaces
                          let cleanedValue = value.replace(/[^\d\s]/g, '');
                          
                          // Remove spaces to check actual digit count
                          const digitsOnly = cleanedValue.replace(/\s+/g, '');
                          
                          // Limit to exactly 10 digits maximum
                          if (digitsOnly.length > 10) {
                            let result = '';
                            let digitCount = 0;
                            for (let i = 0; i < cleanedValue.length && digitCount < 10; i++) {
                              if (/\d/.test(cleanedValue[i])) {
                                result += cleanedValue[i];
                                digitCount++;
                              } else if (cleanedValue[i] === ' ') {
                                result += cleanedValue[i];
                              }
                            }
                            cleanedValue = result;
                          }
                          
                          handleWitnessChange({
                            ...witnessInfo,
                            currentWitness: { ...currentWitness, phoneNumber: cleanedValue }
                          });
                          
                          // Real-time validation
                          const newErrors = { ...witnessErrors };
                          if (cleanedValue.trim()) {
                            const phoneNumber = cleanedValue.trim().replace(/\s+/g, '');
                            
                            if (!phoneNumber.startsWith('09') && !phoneNumber.startsWith('07')) {
                              newErrors.phoneNumber = 'Phone number must start with 09 or 07';
                            } else if (phoneNumber.length < 10) {
                              newErrors.phoneNumber = 'Phone number must have exactly 10 digits';
                            } else if (phoneNumber.length > 10) {
                              newErrors.phoneNumber = 'Phone number must have exactly 10 digits (no more than 10)';
                            } else if (!/^(09|07)\d{8}$/.test(phoneNumber)) {
                              newErrors.phoneNumber = 'Invalid phone number format';
                            } else {
                              delete newErrors.phoneNumber;
                            }
                          } else {
                            delete newErrors.phoneNumber;
                          }
                          setWitnessErrors(newErrors);
                        }}
                        maxLength={13}
                        className={`w-full max-w-[200px] text-sm ${witnessErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                        containerProps={{ className: "w-full max-w-[200px]" }}
                      />
                      <div className="h-5 mt-0.5">
                        {witnessErrors.phoneNumber && (
                          <Typography variant="small" className="text-red-500 text-xs">
                            {witnessErrors.phoneNumber}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end min-h-[70px]">
                      <Button
                        size="sm"
                        variant="filled"
                        onClick={() => {
                          const currentWitness = witnessInfo.currentWitness || {};
                          const fullName = (currentWitness.fullName || "").trim();
                          const phoneNumber = (currentWitness.phoneNumber || "").trim().replace(/\s+/g, '');

                          const newErrors = {};

                          // Require both fields to be filled
                          if (!fullName) {
                            newErrors.fullName = 'Full name is required';
                          }
                          if (!phoneNumber) {
                            newErrors.phoneNumber = 'Phone number is required';
                          }

                          // Additional validation when values are present
                          if (fullName && fullName.length < 2) {
                            newErrors.fullName = 'Full name should be at least 2 characters';
                          } else if (fullName && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(fullName)) {
                            newErrors.fullName = 'Name should contain only letters and spaces';
                          }

                          if (phoneNumber) {
                            if (!phoneNumber.startsWith('09') && !phoneNumber.startsWith('07')) {
                              newErrors.phoneNumber = 'Phone number must start with 09 or 07';
                            } else if (phoneNumber.length !== 10) {
                              newErrors.phoneNumber = 'Phone number must have exactly 10 digits';
                            } else if (!/^(09|07)\d{8}$/.test(phoneNumber)) {
                              newErrors.phoneNumber = 'Invalid phone number format';
                            }
                          }

                          setWitnessErrors(newErrors);

                          // Only add witness when there are no errors and both fields are filled
                          if (Object.keys(newErrors).length === 0 && fullName && phoneNumber) {
                            const newWitness = {
                              id: Date.now() + Math.random(),
                              fullName: fullName,
                              phoneNumber: phoneNumber
                            };
                            const updatedWitnesses = [...(witnessInfo.witnesses || []), newWitness];
                            handleWitnessChange({
                              ...witnessInfo,
                              witnesses: updatedWitnesses,
                              currentWitness: { fullName: "", phoneNumber: "" }
                            });
                            setWitnessErrors({}); // Clear errors after successful add
                          }
                        }}
                        className="bg-primary text-sm px-3 py-2.5 flex items-center gap-1.5"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Witnesses List - 3 Column Grid */}
                {witnessInfo.witnesses && witnessInfo.witnesses.length > 0 && (
                  <div className="space-y-2">
                    <Typography variant="small" className="text-primary font-semibold text-sm">
                      Added Witnesses ({witnessInfo.witnesses.length})
                    </Typography>
                    <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto">
                      {witnessInfo.witnesses.map((witness) => (
                        <Card key={witness.id} className="p-2 border border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <Typography variant="small" className="font-semibold text-xs truncate" title={witness.fullName || "N/A"}>
                                {witness.fullName || "N/A"}
                              </Typography>
                              <Typography variant="small" className="text-gray-600 text-xs truncate" title={witness.phoneNumber || "N/A"}>
                                {witness.phoneNumber || "N/A"}
                              </Typography>
                            </div>
                            <button
                              onClick={() => {
                                // Track removed witness ID if it exists
                                if (witness.complaint_witness_id || witness.witness_id) {
                                  handleRemoveWitness(witness.complaint_witness_id || witness.witness_id);
                                }
                                // Remove from list
                                const updatedWitnesses = witnessInfo.witnesses.filter(w => w.id !== witness.id);
                                handleWitnessChange({
                                  ...witnessInfo,
                                  witnesses: updatedWitnesses
                                });
                              }}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                              title="Remove"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                </div>
              </Card>
                      ))}
                    </div>
                  </div>
                )}

                {(!witnessInfo.witnesses || witnessInfo.witnesses.length === 0) && (
                  <div className="text-center py-3 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
                    <UserIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <Typography variant="small" className="text-gray-500 text-xs">
                      No witnesses added yet
                    </Typography>
                  </div>
                )}
                </div>
              </div>
            </Card>
            </div>

            {/* Right Side - File Attachments & Additional Information */}
            <div className="flex flex-col h-full min-h-[500px] lg:min-h-0">
              <Card className="p-4 sm:p-5 lg:p-6 h-full flex flex-col shadow-lg border border-gray-200 overflow-hidden">
                <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl flex-shrink-0">
                  Evidence
                </Typography>
                
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className="max-h-[235px] overflow-y-auto min-h-0 pr-1 mb-4">
                    <div className="space-y-2 mb-2 sm:mb-3">
                      <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                        Attach/Upload Your Files <span className="text-gray-500 font-normal">(Optional)</span>
                      </Typography>
                      
                      {documents.length === 0 ? (
                        <Card className="p-2 sm:p-2.5 border-2 border-dashed border-primary bg-gradient-to-br from-blue-50 to-primary/5 hover:from-blue-100 hover:to-primary/10 transition-all cursor-pointer" onClick={() => document.getElementById('file-upload').click()}>
                          <div className="text-center">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 mx-auto mb-1.5 rounded-full bg-primary/10 flex items-center justify-center">
                              <CloudArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                            <Typography variant="small" className="text-gray-700 mb-0.5 font-semibold text-xs">
                              Click here to upload
                            </Typography>
                            <Typography variant="small" className="text-gray-500 text-[9px] sm:text-[10px] mb-1.5">
                              PDF, DOC, Images, Videos, Audio
                            </Typography>
                            
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload"
                            />
                            
                            <Button
                              onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload').click(); }}
                              className="bg-primary mt-1.5"
                              size="sm"
                            >
                              Choose Files
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 sm:p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <CloudArrowUpIcon className="w-4 h-4 text-primary" />
                            <Typography variant="small" className="text-gray-700 font-medium text-xs">
                              {documents.length} file{documents.length > 1 ? 's' : ''} uploaded
                            </Typography>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="flex items-center gap-1.5 border-primary text-primary hover:bg-primary hover:text-white w-full sm:w-auto text-xs"
                          >
                            <CloudArrowUpIcon className="w-3 h-3" />
                            Add More
                          </Button>
                        </div>
                      )}

                      {documents.length > 0 && (
                        <div className="space-y-1.5">
                          <Typography variant="small" className="text-primary font-semibold text-xs">
                            Uploaded Files
                          </Typography>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                            {documents.map((doc) => (
                              <Card key={doc.id} className="p-2 hover:shadow-md transition-all border border-gray-200 hover:border-primary/30">
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
                                    {getFileIcon(doc.type)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Typography variant="small" className="text-gray-900 font-medium truncate text-xs" title={doc.name ? doc.name.split('/').pop().split('\\').pop() : 'Document'}>
                                      {doc.name ? doc.name.split('/').pop().split('\\').pop() : 'Document'}
                                    </Typography>
                                    <Typography variant="small" className="text-gray-500 text-[9px] mt-0.5 truncate">
                                      {formatFileSize(doc.size || 0)}
                                    </Typography>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handlePreviewFile(doc)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                      title="View"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveDocument(doc.id)}
                                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                      title="Remove"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 mt-16 border-t border-gray-200 pt-3 sm:pt-4 flex-shrink-0">
                    <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                      Text Description <span className="text-gray-500 font-normal">(Optional)</span>
                    </Typography>
                    
                    <textarea
                      className={`w-full p-2 border rounded-lg resize-none text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] sm:min-h-[120px] ${getInputClassName('additionalInformation')}`}
                      rows={4}
                      placeholder="Enter any text description..."
                      value={additionalInformation}
                      onChange={(e) => handleAdditionalInformationChange(e.target.value)}
                    />
                    {errors.additionalInformation && (
                      <Typography variant="small" className="text-red-500 mt-0.5 text-xs">
                        {errors.additionalInformation}
                      </Typography>
                    )}
                  </div>

                  <div className="flex justify-end pb-2 flex-shrink-0">
                    <Button
                      variant="filled"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 bg-primary text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 shadow-md hover:shadow-lg transition-all w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </>
                      ) : (
                        "Update"
                      )}
                    </Button>
                  </div>
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

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
        isLoading={isSubmitting}
      />

      {/* Cancel Request Modal */}
      <CancelRequestModal
        isOpen={showCancelModal}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        requestType="disciplinary case request"
      />

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default EditDisciplinary2;

