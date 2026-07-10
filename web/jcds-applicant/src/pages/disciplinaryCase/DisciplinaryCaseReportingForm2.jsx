import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Typography, Input, Textarea } from "@material-tailwind/react";
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  EyeIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  PhotoIcon
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import customerAuthService from "@/service/customer-auth.service";
import PreviewModal from "../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../config";

const DisciplinaryCaseReportingForm2 = () => {
  const navigate = useNavigate();
  
  // Applicant Info
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantAddress, setApplicantAddress] = useState(""); // Address is optional
  const [applicantGender, setApplicantGender] = useState(""); // Gender from backend

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

  // Errors State
  const [errors, setErrors] = useState({});
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
          console.log("Customer data response:", response);
          const customerData = response.data || response;
          console.log("Customer data:", customerData);
          console.log("Gender value:", customerData.gender);
          
          setApplicantName(customerData.full_name || "");
          setApplicantPhone(customerData.phone_number || "");
          setApplicantAddress(customerData.address || "");
          setApplicantGender(customerData.gender || "");
          
          console.log("Set gender state:", customerData.gender || "");
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        // Set fallback values if fetch fails
        setApplicantName("John Doe");
        setApplicantPhone("+2519000000");
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
          newErrors.servingPlace = 'Serving place is required';
        } else {
          delete newErrors.servingPlace;
        }
        break;
        
      case 'caseFileNumber':
        // Case file number is optional, but if provided, must be at least 3 characters
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
    
    // Validate judge info
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
    
    // Validate caseFileNumber (optional, but if provided, must be at least 3 characters)
    if (judgeInfo.caseFileNumber.trim() && judgeInfo.caseFileNumber.trim().length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    if (!judgeInfo.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (judgeInfo.description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters';
    }
    
    // Validate additional information (optional)
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

  // Submit Functions
  const handleSubmit = () => {
    if (validateAllFields()) {
      setShowTermsModal(true);
    }
  };

  const handleTermsAccept = async () => {
    try {
      const docsObj = { documents, additionalInformation, signature };
      const documentsArray = Array.isArray(docsObj) ? docsObj : docsObj.documents || [];
      const signatureFile = docsObj.signature || null;

      const fd = new FormData();
      fd.append("judge_name", judgeInfo.judgeFullName || "");
      fd.append("court_office", judgeInfo.servingPlace || "");
      fd.append("file_number", judgeInfo.caseFileNumber || "");

      // Prepare issues
      const issuesPayload = [{ description: judgeInfo.description || "" }];
      fd.append("issues", JSON.stringify(issuesPayload));

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

      // Handle additional information as the single allowed description evidence
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

      // Append text evidence(s)
      fd.append("evidences", JSON.stringify(textEvidences));

      // Append file evidences
      fileEvidences.forEach((file) => {
        fd.append("evidence", file, file.name || "evidence");
      });

      // Append signature if available
      if (signatureFile) {
        fd.append("signature", signatureFile, signatureFile.name);
      }

      // Submit request
      const result = await DisciplinaryRequestService.createRequest(fd);

      console.log("Created:", result);
      setShowTermsModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to submit the disciplinary request");
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
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">
                  Disciplinary Case Reporting Form
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-primary">
                  Submit a new disciplinary case for review
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
          {/* Left Side - Judge Info */}
          <div className="flex flex-col h-full min-h-[500px] lg:min-h-0">
            <Card className="p-4 sm:p-5 lg:p-6 h-full flex flex-col shadow-lg border border-gray-200">
              {/* Applicant Info */}
              <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                Applicant
              </Typography>
              
              <div className="flex flex-row gap-6 mb-4 sm:mb-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex flex-col gap-2 flex-1">
                  <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm mb-1">
                    Full Name
                  </Typography>
                  <Typography variant="h6" className="text-gray-600 text-xs sm:text-sm">
                    {applicantName}
                  </Typography>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm mb-1">
                    Phone Number
                  </Typography>
                  <Typography variant="h6" className="text-gray-600 text-xs sm:text-sm">
                    {applicantPhone}
                  </Typography>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm mb-1">
                    Gender
                  </Typography>
                  <Typography variant="h6" className="text-gray-600 text-xs sm:text-sm">
                    {applicantGender || "N/A"}
                  </Typography>
                </div>
                {applicantAddress && (
                  <div className="flex flex-col gap-2 flex-1">
                    <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm mb-1">
                      Address
                    </Typography>
                    <Typography variant="h6" className="text-gray-600 text-xs sm:text-sm">
                      {applicantAddress}
                    </Typography>
                  </div>
                )}
              </div>
              
              <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                Judge/Case Information
              </Typography>
              
              <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
                {/* Three Column Grid for Judge Info Fields - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:col-span-1">
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

                  <div className="space-y-1 sm:col-span-1">
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

                  <div className="space-y-1 sm:col-span-2 xl:col-span-1">
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

                {/* Disciplinary Issue - Full Width */}
                <div className="space-y-1 flex-1 flex flex-col">
                  <Typography variant="small" className="text-primary font-semibold text-xs sm:text-sm">
                    Disciplinary Issue <span className="text-red-500">*</span>
                  </Typography>
                  <Textarea
                    placeholder="Describe about the disciplinary issue in detail..."
                    value={judgeInfo.description}
                    onChange={(e) => handleJudgeInfoChange('description', e.target.value)}
                    className={`flex-1 min-h-[100px] sm:min-h-[120px] ${getInputClassName('description')}`}
                    rows={4}
                  />
                  {errors.description && (
                    <Typography variant="small" className="text-red-500 mt-1 text-xs">
                      {errors.description}
                    </Typography>
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
                {/* Scrollable Evidence Section */}
                <div className="max-h-[235px] overflow-y-auto min-h-0 pr-1 mb-4">
                  {/* Document Upload Section */}
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

                    {/* Uploaded Documents */}
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

                {/* Text Description - Dynamic (not fixed) */}
                <div className="space-y-1.5 mb-4 border-t border-gray-200 pt-3 sm:pt-4 flex-shrink-0">
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

                {/* Submit Button - Dynamic (not fixed) */}
                <div className="flex justify-end pb-2 flex-shrink-0">
                  <Button
                    variant="filled"
                    onClick={handleSubmit}
                    className="flex items-center justify-center gap-2 bg-primary text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                  >
                    Submit Request
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
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onFinish={handleFinish}
      />

      {/* Cancel Request Modal */}
      <CancelRequestModal
        isOpen={showCancelModal}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        requestType="disciplinary case request"
      />
    </div>
  );
};

export default DisciplinaryCaseReportingForm2;
