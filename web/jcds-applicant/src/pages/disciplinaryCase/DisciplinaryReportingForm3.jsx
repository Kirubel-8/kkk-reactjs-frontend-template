import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Typography, Input, Textarea, Dialog, DialogBody, DialogHeader } from "@material-tailwind/react";
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  EyeIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  PhotoIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import customerAuthService from "@/service/customer-auth.service";
import PreviewModal from "../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../config";
import { PlusIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";

const DisciplinaryReportingForm3 = () => {
  const navigate = useNavigate();
  
  // Applicant Info
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantGender, setApplicantGender] = useState("");

  // Court office options (dummy data)
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
          newErrors.servingPlace = 'court office must be selected';
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
          newErrors.description = 'Description is too short';
        } else {
          delete newErrors.description;
        }
        break;
        
      case 'additionalInformation':
        if (value.trim() && value.trim().length < 10) {
          newErrors.additionalInformation = 'Description is too short';
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
      newErrors.servingPlace = 'court office must be selected';
    }
    
    if (judgeInfo.caseFileNumber.trim() && judgeInfo.caseFileNumber.trim().length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    if (!judgeInfo.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (judgeInfo.description.trim().length < 10) {
      newErrors.description = 'Description is too short';
    }
    
    if (additionalInformation.trim() && additionalInformation.trim().length < 10) {
      newErrors.additionalInformation = 'Description is too short';
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
    
    // Clear previous file size errors
    const newErrors = { ...errors };
    delete newErrors.documents;
    setErrors(newErrors);
    
    // Clear input immediately to prevent showing invalid files
    event.target.value = '';
    
    // File size limits in bytes
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
    
    // File extension mappings
    const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    
    // Helper function to get file extension
    const getFileExtension = (fileName) => {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
    };
    
    const invalidFiles = [];
    const validFiles = [];
    
    // Validate each file BEFORE adding to documents
    files.forEach(file => {
      const fileSize = file.size;
      const fileExtension = getFileExtension(file.name);
      let maxSize = 0;
      let fileType = '';
      let maxSizeMB = 0;
      
      // Determine file type and max size based on file extension
      if (VIDEO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_VIDEO_SIZE;
        fileType = 'video';
        maxSizeMB = 200;
      } else if (AUDIO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_AUDIO_SIZE;
        fileType = 'audio';
        maxSizeMB = 50;
      } else {
        // Documents, images, and other file types
        maxSize = MAX_DOCUMENT_SIZE;
        fileType = 'document';
        maxSizeMB = 10;
      }
      
      // Check file size - REJECT invalid files immediately
      if (fileSize > maxSize) {
        invalidFiles.push({
          name: file.name,
          size: fileSize,
          type: fileType,
          maxSize: maxSizeMB,
          actualSize: formatFileSize(fileSize)
        });
        // Invalid files are NOT added to validFiles - they are completely rejected
      } else {
        // Check for duplicates
        const isDuplicate = documents.some(doc => 
          doc.name === file.name && 
          doc.size === file.size &&
          doc.file instanceof File // Only check against uploaded files, not existing ones
        );
        
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }
    });
    
    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      // Helper function to truncate file name
      const truncateFileName = (fileName, maxLength = 40) => {
        if (fileName.length <= maxLength) return fileName;
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
        return truncatedName + extension;
      };
      
      // Set error message in errors state to display inline like other errors
      const totalFiles = files.length;
      const invalidCount = invalidFiles.length;
      let errorMessage;
      
      if (invalidCount === 1 && totalFiles === 1) {
        // Single file selected and it's too large - show file name
        const fileName = truncateFileName(invalidFiles[0].name);
        errorMessage = `${fileName} is too large`;
      } else if (invalidCount === 1 && totalFiles > 1) {
        // Multiple files selected but only one is too large - show file name
        const fileName = truncateFileName(invalidFiles[0].name);
        errorMessage = `${fileName} is too large`;
      } else {
        // Multiple files are too large - show count format
        errorMessage = `${invalidCount}/${totalFiles} selected file${totalFiles > 1 ? 's' : ''} ${invalidCount > 1 ? 'are' : 'is'} too large`;
      }
      
      setErrors({ ...errors, documents: errorMessage });
      
      // If no valid files, return early
      if (validFiles.length === 0) {
        return;
      }
    }
    
    // If no valid files, return early (input already cleared)
    if (validFiles.length === 0) {
      return;
    }
    
    // Only clear error if there were no invalid files
    // If there were invalid files, keep the error message to inform the user
    if (invalidFiles.length === 0) {
      const updatedErrors = { ...errors };
      delete updatedErrors.documents;
      setErrors(updatedErrors);
    }
    
    // ONLY add valid files to documents - invalid files are never added
    const newDocuments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      file: file,
      type: file.type,
      size: file.size,
      status: 'uploaded'
    }));
    
    setDocuments(prev => [...prev, ...newDocuments]);
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
      const docsObj = { documents, additionalInformation, signature };
      const documentsArray = Array.isArray(docsObj) ? docsObj : docsObj.documents || [];
      const signatureFile = docsObj.signature || null;

      const fd = new FormData();
      fd.append("judge_name", judgeInfo.judgeFullName || "");
      fd.append("court_office", judgeInfo.servingPlace || "");
      fd.append("file_number", judgeInfo.caseFileNumber || "");

      const issuesPayload = [{ description: judgeInfo.description || "" }];
      fd.append("issues", JSON.stringify(issuesPayload));

      // Append witness information if provided
      // Backend expects: witness_name, witness_address, witness_phone_number
      if (witnessInfo.witnesses && witnessInfo.witnesses.length > 0) {
        const witnessData = witnessInfo.witnesses.map((w) => ({
          witness_name: w.fullName || "",
          // No dedicated address field in the UI yet; send empty string so backend/DB accept it
          witness_address: w.address || "",
          witness_phone_number: w.phoneNumber || "",
        }));
        fd.append("witnesses", JSON.stringify(witnessData));
      }

      // Separate text evidences and file evidences
      const textEvidences = [];
      const fileEvidences = [];

      documentsArray.forEach((d) => {
        if (!d.file && d.description) {
          textEvidences.push({
            description: d.description || "",
            file_url: d.fileUrl || null,
          });
        } else if (d.file && !d.description) {
          fileEvidences.push(d.file);
        }
      });

      if (docsObj.additionalInformation) {
        textEvidences.length = 0;
        textEvidences.push({
          description: docsObj.additionalInformation,
          file_url: null,
        });
      } else if (textEvidences.length > 0) {
        const firstTextEvidence = textEvidences[0];
        textEvidences.length = 0;
        textEvidences.push(firstTextEvidence);
      }

      fd.append("evidences", JSON.stringify(textEvidences));

      fileEvidences.forEach((file) => {
        fd.append("evidence", file, file.name || "evidence");
      });

      if (signatureFile) {
        fd.append("signature", signatureFile, signatureFile.name);
      }

      const result = await DisciplinaryRequestService.createRequest(fd);

      console.log("Created:", result);
      
      // Close terms modal
      setShowTermsModal(false);
      setIsSubmitting(false);
      
      // Navigate with state to show success snack on home page
      navigate("/home/requests", { 
        state: { 
          showSuccessSnack: true,
          successMessage: "Complaint is submitted successfully"
        } 
      });
    } catch (err) {
      console.error("Submit error:", err);
      setIsSubmitting(false);
      
      // Close terms modal on error
      setShowTermsModal(false);
      
      // Show error notification after a small delay to ensure modal is closed
      setTimeout(() => {
        toast.error(err.response?.data?.message || err.message || "Complaint is not submitted", {
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

  const handleFinish = () => {
    setShowSuccessModal(false);
    window.location.href = "/jcdms-applicant/home/requests";
  };

  const getInputClassName = (field) => {
    return errors[field] ? 'border-red-500 focus:border-red-500' : '';
  };


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
                <h1 className="text-lg sm:text-xl lg:text-xl font-bold text-primary">
                  Disciplinary Case Reporting Form
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-primary">
                  Submit a new disciplinary case 
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
                <span className="hidden sm:inline">Cancel</span>
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
                {/* Applicant Information - Read Only */}
                {/* <Card className="p-4 border-2 border-gray-200 bg-gray-50 mb-4 sm:mb-6">
                  <Typography variant="h6" className="text-gray-900 mb-4 font-bold">
                    Applicant Information
                  </Typography>
                  <div className="space-y-4">
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium mb-1">
                        Full Name:
                      </Typography>
                      <Typography variant="small" className="text-gray-900">
                        {applicantName || "N/A"}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium mb-1">
                        Phone Number:
                      </Typography>
                      <Typography variant="small" className="text-gray-900">
                        {applicantPhone || "N/A"}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="small" className="text-gray-500 font-medium mb-1">
                        Gender:
                      </Typography>
                      <Typography variant="small" className="text-gray-900">
                        {applicantGender || "N/A"}
                      </Typography>
                    </div>
                  </div>
                </Card> */}
                
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
                            <Typography variant="small" className="text-gray-600 text-[9px] sm:text-[10px] mb-1.5 font-semibold">
                              Size limits: Documents/Images (max 10MB), Audio (max 50MB), Videos (max 200MB)
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
                      
                      {errors.documents && (
                        <Typography variant="small" className="text-red-500 mt-1 text-xs">
                          {errors.documents}
                        </Typography>
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
                          Submitting...
                        </>
                      ) : (
                        "Submit"
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

export default DisciplinaryReportingForm3;
