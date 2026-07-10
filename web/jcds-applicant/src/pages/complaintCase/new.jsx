import React, { useState, useRef, useEffect } from "react";
import { ArrowUpTrayIcon, PlusIcon, DocumentIcon, EyeIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import { FaFileUpload, FaFileAlt, FaLessThan, FaRegFile } from "react-icons/fa";
import { MdDelete, MdArrowDropDown } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { Input, Button, Typography, Select, Option, Textarea } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import PreviewModal from "../requestManagement/document-preview-modal";
import complaintService from "@/service/complaint.service";
import caseTypeService from "@/service/caseType.service";
import courtCategoryService from "@/service/courtCategory.service";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import EtDatePicker, { EtLocalizationProvider } from "habesha-datepicker-v2";
import { PiLessThanBold } from "react-icons/pi";

const NewComplaintRequestForm = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("Files");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgeFullName, setJudgeFullName] = useState("");
  const [courtOffice, setCourtOffice] = useState("");
  const [courtLocation, setCourtLocation] = useState("");
  const [caseType, setCaseType] = useState("");
  const [caseFileNumber, setCaseFileNumber] = useState("");
  const [dateOfOffense, setDateOfOffense] = useState("");
  const [actDetails, setActDetails] = useState("");
  const [damageDetail, setDamageDetail] = useState("");
  const [witnessFullName, setWitnessFullName] = useState("");
  const [witnessPhoneNumber, setWitnessPhoneNumber] = useState("");
  const [witnesses, setWitnesses] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const leftCardRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [witnessErrors, setWitnessErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [caseTypes, setCaseTypes] = useState([]);
  const [loadingCaseTypes, setLoadingCaseTypes] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null, title: null });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [courtCategories, setCourtCategories] = useState([]);
  const [courtOffices, setCourtOffices] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  // Get available court offices based on selected category
  const getAvailableCourtOffices = () => {
    if (!courtLocation) return [];
    // Filter offices by selected category
    return courtOffices
      .filter(office => office.category?.court_category_id === courtLocation)
      .map(office => ({
        value: office.court_office_id,
        label: office.name
      }));
  };

  // Get court office name by ID
  const getCourtOfficeName = (officeId) => {
    if (!officeId) return "";
    const office = courtOffices.find(off => off.court_office_id === officeId);
    return office ? office.name : "";
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Clear input immediately to prevent showing invalid files
    e.target.value = '';
    
    // File size limits in bytes
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
    
    // File extension mappings
    const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
    const AUDIO_EXTENSIONS = ['.mp3', '.mpeg', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    
    // Helper function to get file extension
    const getFileExtension = (fileName) => {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
    };
    
    const invalidFiles = [];
    const validFiles = [];
    
    // Validate each file BEFORE adding to selectedFiles
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
      } else {
        // Check for duplicates
        const isDuplicate = selectedFiles.some(doc => 
          doc.name === file.name && 
          doc.size === file.size
        );
        
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }
    });
    
    // Show error messages for invalid files
    if (invalidFiles.length > 0) {
      const totalFiles = files.length;
      const invalidCount = invalidFiles.length;
      const errorMessage = totalFiles > 1 
        ? `${invalidCount}/${totalFiles} selected file${totalFiles > 1 ? 's' : ''} ${invalidCount > 1 ? 'are' : 'is'} too large`
        : 'Selected file is too large';
      setFormErrors((prev) => ({ ...prev, documents: errorMessage }));
      
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
    if (invalidFiles.length === 0) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.documents;
        return updated;
      });
    }
    
    // ONLY add valid files to selectedFiles - invalid files are never added
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setSelectedTab("Files");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleDeleteFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewFile = async (file, index) => {
    if (!file) {
      toast.error("No file provided");
      return;
    }

    try {
      setPreviewLoading(true);
      
      // Calculate evidence number (index + 1)
      const evidenceNumber = index !== undefined ? index + 1 : 1;
      const evidenceTitle = `Evidence ${evidenceNumber}`;
      
      let fileUrl = null;
      let fileExtension = null;
      let fileName = null;
      let fileType = null;

      if (file instanceof File) {
        fileUrl = URL.createObjectURL(file);
        fileName = file.name;
        fileExtension = fileName.split('.').pop()?.toLowerCase();
        fileType = file.type;
      } else {
        toast.error("Invalid file");
        setPreviewLoading(false);
        return;
      }

      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf';
      const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(fileExtension) || fileType?.startsWith('video/');
      const isAudio = ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'].includes(fileExtension) || fileType?.startsWith('audio/');
      
      if (isImage || isPdf || isVideo || isAudio) {
        setPreviewModal({ isOpen: true, file, title: evidenceTitle });
        setPreviewLoading(false);
      } else {
        // Download non-previewable files
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileUrl);
        setPreviewLoading(false);
      }
    } catch (error) {
      console.error("Error handling file:", error);
      setPreviewLoading(false);
      toast.error(error.message || "Failed to open file");
    }
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, file: null, title: null });
  };

  const handleAddWitness = () => {
    const fullName = (witnessFullName || "").trim();
    const phoneNumber = (witnessPhoneNumber || "").trim().replace(/\s+/g, '');
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
    } else if (fullName && !/\s/.test(fullName)) {
      newErrors.fullName = 'Please enter full name (first name and last name)';
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
        name: fullName,
        phone: phoneNumber
      };
      setWitnesses((prev) => [...prev, newWitness]);
      setWitnessFullName("");
      setWitnessPhoneNumber("");
      setWitnessErrors({}); // Clear errors after successful add
      setSelectedTab("Witness");
    }
  };

  const handleDeleteWitness = (id) => {
    setWitnesses((prev) => prev.filter((witness) => witness.id !== id));
  };

  // Fetch case types from backend
  useEffect(() => {
    const fetchCaseTypes = async () => {
      try {
        setLoadingCaseTypes(true);
        const response = await caseTypeService.getAllCaseTypes();
        console.log("Case types response:", response);
        // Handle response structure - service returns response.data, so check both
        setCaseTypes(response.data || response);
        console.log("Case types set:", response.data || response);
      } catch (error) {
        console.error('Error fetching case types:', error);
        // Set fallback case types
        setCaseTypes([
          { case_type_id: 'fallback-1', name: 'Criminal Case' },
          { case_type_id: 'fallback-2', name: 'Civil Case' },
          { case_type_id: 'fallback-3', name: 'Administrative Case' },
          { case_type_id: 'fallback-4', name: 'Constitutional Case' },
          { case_type_id: 'fallback-5', name: 'Commercial Case' }
        ]);
      } finally {
        setLoadingCaseTypes(false);
      }
    };

    fetchCaseTypes();
  }, []);

  // Fetch court categories and offices from backend
  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingOffices(true);

        // Fetch categories
        const categoriesResponse = await courtCategoryService.getCategories();
        const categories = categoriesResponse.categories || [];
        setCourtCategories(categories);

        // Fetch all offices
        const officesResponse = await courtCategoryService.getOffices();
        const offices = officesResponse.offices || [];
        setCourtOffices(offices);
      } catch (error) {
        console.error("Error fetching court data:", error);
        toast.error("Failed to load court categories and offices");
      } finally {
        setLoadingCategories(false);
        setLoadingOffices(false);
      }
    };

    fetchCourtData();
  }, []);

  // Validate all required fields
  const validateAllFields = () => {
    const newErrors = {};
    
    // Validate judgeFullName
    const judgeFullNameTrimmed = judgeFullName.trim();
    if (!judgeFullNameTrimmed) {
      newErrors.judgeFullName = 'Full Name is required';
    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(judgeFullNameTrimmed)) {
      newErrors.judgeFullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
    } else if (judgeFullNameTrimmed.length < 2) {
      newErrors.judgeFullName = 'Name should be at least 2 characters';
    } else if (!/\s/.test(judgeFullNameTrimmed)) {
      newErrors.judgeFullName = 'Please enter full name (first name and last name)';
    }
    
    // Validate courtOffice
    if (!courtOffice) {
      newErrors.courtOffice = 'court office must be selected';
    }
    
    // Validate caseFileNumber
    const caseFileNumberTrimmed = caseFileNumber.trim();
    if (!caseFileNumberTrimmed) {
      newErrors.caseFileNumber = 'Case file number is required';
    } else if (caseFileNumberTrimmed.length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    // Validate dateOfOffense
    if (!dateOfOffense) {
      newErrors.dateOfOffense = 'Time of incident is required';
    }
    
    // Validate caseType
    if (!caseType) {
      newErrors.caseType = 'Case type must be selected';
    }
    
    // Validate actDetails
    if (!actDetails || actDetails.trim() === "") {
      newErrors.actDetails = "Description is required";
    } else if (actDetails.trim().length < 10) {
      newErrors.actDetails = "Description is too short";
    }
    
    // Validate damageDetail
    if (!damageDetail || damageDetail.trim() === "") {
      newErrors.damageDetail = "Damage description is required";
    } else if (damageDetail.trim().length < 10) {
      newErrors.damageDetail = "Description is too short";
    }
    
    // Validate documents
    if (!selectedFiles || selectedFiles.length === 0) {
      newErrors.documents = 'Please upload at least one document';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateAllFields() && !isSubmitting) {
      setShowTermsModal(true);
    } else {
      // Scroll to top of the card when validation fails
      if (leftCardRef.current) {
        leftCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleTermsAccept = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Get the court office name from the selected ID
      const courtOfficeName = getCourtOfficeName(courtOffice);
      
      console.log("Court Office Debug:", {
        courtLocation,
        courtOffice,
        courtOfficeName,
        availableOffices: courtLocation ? getAvailableCourtOffices() : []
      });
      
      // Format form data to match backend structure
      const formData = {
        judgeInfo: {
          judgeFullName: judgeFullName.trim(),
          servingPlace: courtOfficeName,
          caseFileNumber: caseFileNumber.trim(),
          caseType: caseType || "",
          incidentDate: dateOfOffense,
          courtOfficeId: courtOffice || "", // Include court_office_id
        },
        description: {
          description: actDetails.trim(),
          damageDescription: damageDetail.trim(),
        },
        documents: {
          documents: selectedFiles.map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            file: file,
            type: file.type,
            size: file.size,
            status: 'uploaded'
          }))
        },
        witnessInfo: {
          witnesses: witnesses.map((witness) => ({
            id: witness.id,
            fullName: witness.name,
            phoneNumber: witness.phone
          }))
        }
      };

      console.log("=== Submitting Complaint ===");
      console.log("Form Data:", formData);
      
      const response = await complaintService.createComplaint(formData);
      console.log("Complaint submitted successfully: ", response);
      
      // Close terms modal
      setShowTermsModal(false);
      setIsSubmitting(false);
      
      // Navigate with state to show success snack on home page
      navigate("/home/requests", { 
        state: { 
          showSuccessSnack: true,
          successMessage: "Your complaint is submitted successfully",
          requestType: "complaint"
        } 
      });
    } catch (error) {
      console.error("Error submitting complaint: ", error);
      setIsSubmitting(false);
      
      // Close terms modal on error
      setShowTermsModal(false);
      
      // Show error notification after a small delay to ensure modal is closed
      setTimeout(() => {
        toast.error("Failed to submit complaint", {
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
            borderBottom: "clamp(0.5px,0.05vw,1px) solid #ef4444",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            zIndex: 9999999999,
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

  const handleBack = () => {
    navigate("/home/landing");
  };

  return (
    <div className="w-full mt-[clamp(32px,2.22vh,32px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(32px,1.67vw,32px)] lg:px-[clamp(48px,2.5vw,48px)]">
      <div className=" justify-center flex flex-col lg:flex-row gap-[clamp(24px,1.67vh,24px)]">
        {/* Left card (approx. 1326 x 1098) */}
        <div 
          ref={leftCardRef}
          className="max-w-[clamp(320px,69.06vw,1326px)] mx-auto lg:mx-0 lg:flex-1 h-auto lg:h-[clamp(600px,82vh,885px)] rounded-xl bg-[#FFFFFF] backdrop-blur-lg overflow-visible lg:overflow-auto pb-[clamp(20px,2vh,32px)] mb-[clamp(24px,1.67vh,24px)] lg:mb-0"
        >
          {/* Left card header & subtitle (20px from top, 49px from left) */}
          <div className="mt-[clamp(24px,1.67vh,24px)] ml-[clamp(16px,0.83vw,16px)] md:ml-[clamp(32px,1.67vw,32px)] lg:ml-[clamp(48px,2.55vw,49px)]">
            <div className="flex items-center gap-[clamp(16px,0.83vw,16px)]">
            <Button
                onClick={handleBack}
                className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity bg-[#eaeaee] p-[clamp(8px,0.42vw,8px)] rounded-md"
                style={{ backgroundColor: '#eaeaee' }}
              >
                <FaLessThan className="text-[#2C2C2C] text-[clamp(18px,1.04vw,20px)]" />
              </Button>
            <Typography
                className="leading-none tracking-normal text-[#2C2C2C] text-[clamp(20px,1.25vw,24px)]"
                style={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  lineHeight: '100%',
                  letterSpacing: '0%'
                }}
            >
              Complaint Reporting
            </Typography>
            </div>
            {/* <p
              className="mt-1 font-['Montserrat'] font-normal text-base leading-none tracking-normal text-[#959595]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Submit a new complaint Report
            </p> */}
          </div>

          {/* Internal separator line under header block */}
          <div className="mt-[clamp(20px,1.39vh,20px)] border-t border-[#CFCFCF]" />

          <div className="ml-[clamp(16px,2.55vw,49px)] mt-[clamp(36px,2.78vh,36px)] mr-[clamp(16px,9.17vw,176px)] ">
            <Typography
              className="leading-none tracking-normal text-[clamp(20px,1.25vw,24px)]"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#215167'
              }}
            >
              Judge Information
            </Typography>

            {/* Form fields in 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,1.67vh,24px)]">
              {/* Judge Full Name */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Full Name <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <Input
                  type="text"
                  value={judgeFullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJudgeFullName(value);
                    
                    // Real-time validation
                    const newErrors = { ...formErrors };
                    const trimmedValue = value.trim();
                    if (!trimmedValue) {
                      newErrors.judgeFullName = 'Judge Full Name is required';
                    } else if (!/^[a-zA-Z\s\u1200-\u137F/]+$/.test(trimmedValue)) {
                      newErrors.judgeFullName = 'availabled characters are "a-zA-Z", " ", amharic letters, "/"';
                    } else if (trimmedValue.length < 2) {
                      newErrors.judgeFullName = 'Name should be at least 2 characters';
                    } else if (!/\s/.test(trimmedValue)) {
                      newErrors.judgeFullName = 'Please enter full name (first name and last name)';
                    } else {
                      delete newErrors.judgeFullName;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("judgeFullName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter Full Name"
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    formErrors.judgeFullName ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.judgeFullName ? 'clamp(0.5px,0.05vw,1px) solid #ef4444' : 'clamp(0.5px,0.03vw,0.5px) solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.judgeFullName && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.judgeFullName}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Court Category */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Category <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <div className="relative w-full max-w-[clamp(280px,16.67vw,320px)]">
                  <Select
                    value={courtLocation}
                    onChange={(value) => {
                      setCourtLocation(value);
                      // Clear court office when category changes
                      setCourtOffice("");
                      // Clear court office error
                      setFormErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.courtOffice;
                        return updated;
                      });
                    }}
                    onFocus={() => setFocusedField("courtLocation")}
                    onBlur={() => setFocusedField(null)}
                    disabled={loadingCategories}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                      loadingCategories ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: 'clamp(0.5px,0.03vw,0.5px) solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                    labelProps={{
                      className: "hidden"
                    }}
                    containerProps={{
                      className: "!min-w-0"
                    }}
                  >
                    <Option value="" disabled className="text-[#BCBCBC]">
                      {loadingCategories ? "Loading categories..." : "Select Court Category"}
                    </Option>
                    {courtCategories.map((category) => (
                      <Option key={category.court_category_id} value={category.court_category_id} className="text-[#747171]">
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Court Office */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Office <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <div className="relative w-full max-w-80">
                  <Select
                    value={courtOffice}
                    onChange={(value) => {
                      setCourtOffice(value);
                      
                      // Real-time validation
                      const newErrors = { ...formErrors };
                      if (!value) {
                        newErrors.courtOffice = 'court office must be selected';
                      } else {
                        delete newErrors.courtOffice;
                      }
                      setFormErrors(newErrors);
                    }}
                    onFocus={() => setFocusedField("courtOffice")}
                    onBlur={() => setFocusedField(null)}
                    disabled={!courtLocation || loadingOffices}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                      !courtLocation || loadingOffices ? "cursor-not-allowed" : "cursor-pointer"
                    } ${formErrors.courtOffice ? "!border-red-500" : ""} text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: formErrors.courtOffice ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                    labelProps={{
                      className: "hidden"
                    }}
                    containerProps={{
                      className: "!min-w-0"
                    }}
                  >
                    <Option value="" disabled className="text-[#BCBCBC]">
                      {loadingOffices 
                        ? "Loading offices..." 
                        : !courtLocation 
                          ? "Select Court Category First" 
                          : getAvailableCourtOffices().length === 0
                            ? "No offices available"
                            : "Select Court Office"}
                    </Option>
                    {getAvailableCourtOffices().map((office) => (
                      <Option key={office.value} value={office.value} className="text-[#747171]">
                        {office.label}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.courtOffice && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.courtOffice}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Case Type */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Case Type <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <div className="relative w-full max-w-[clamp(280px,16.67vw,320px)]">
                  <Select
                    value={caseType}
                    onChange={(value) => {
                      setCaseType(value);
                      
                      // Real-time validation
                      const newErrors = { ...formErrors };
                      if (!value) {
                        newErrors.caseType = 'Case type must be selected';
                      } else {
                        delete newErrors.caseType;
                      }
                      setFormErrors(newErrors);
                    }}
                    onFocus={() => setFocusedField("caseType")}
                    onBlur={() => setFocusedField(null)}
                    disabled={loadingCaseTypes}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none cursor-pointer !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${formErrors.caseType ? "!border-red-500" : ""} text-[#393838] ${loadingCaseTypes ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: formErrors.caseType ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                    labelProps={{
                      className: "hidden"
                    }}
                    containerProps={{
                      className: "!min-w-0"
                    }}
                  >
                    <Option value="" disabled className="text-[#747171]">
                      {loadingCaseTypes ? 'Loading case types...' : 'Select Case Type'}
                    </Option>
                    {caseTypes.map((caseTypeOption) => (
                      <Option 
                        key={caseTypeOption.case_type_id} 
                        value={caseTypeOption.name}
                        className="text-[#747171]"
                      >
                        {caseTypeOption.name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.caseType && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.caseType}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Case File Number */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Case File Number <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <Input
                  type="text"
                  value={caseFileNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCaseFileNumber(value);
                    
                    // Real-time validation
                    const newErrors = { ...formErrors };
                    const trimmedValue = value.trim();
                    if (!trimmedValue) {
                      newErrors.caseFileNumber = 'Case file number is required';
                    } else if (trimmedValue.length < 3) {
                      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
                    } else {
                      delete newErrors.caseFileNumber;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("caseFileNumber")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter File Number"
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    formErrors.caseFileNumber ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.caseFileNumber ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.caseFileNumber && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.caseFileNumber}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Date of Offense */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Date of Offense <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <div className="w-full relative">
                  <EtLocalizationProvider localType="EC">
                    <EtDatePicker
                      placeholder="Select Date"
                      value={dateOfOffense ? (() => {
                        try {
                          if (dateOfOffense.includes('T')) {
                            const date = new Date(dateOfOffense);
                            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
                          } else {
                            const [year, month, day] = dateOfOffense.split('-').map(Number);
                            return new Date(year, month - 1, day);
                          }
                        } catch (e) {
                          return null;
                        }
                      })() : null}
                      onChange={(date) => {
                        let processedValue = '';
                        if (date instanceof Date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          processedValue = `${year}-${month}-${day}`;
                        } else if (date === null) {
                          processedValue = '';
                        }
                        
                        setDateOfOffense(processedValue);
                      
                      // Real-time validation
                      const newErrors = { ...formErrors };
                        if (!processedValue) {
                        newErrors.dateOfOffense = 'Time of incident is required';
                      } else {
                        delete newErrors.dateOfOffense;
                      }
                      setFormErrors(newErrors);
                    }}
                      minDate={new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000)}
                      maxDate={new Date()}
                      sx={{
                        width: '100%',
                      '& .MuiOutlinedInput-root': {
                        height: 'clamp(44px,4.07vh,48px)',
                        fontSize: 'clamp(12px,0.73vw,14px)',
                        borderRadius: '6px',
                        borderColor: formErrors.dateOfOffense ? '#ef4444' : '#0000004D',
                        backgroundColor: '#F9F9F9',
                        fontFamily: "'Montserrat', sans-serif",
                        paddingRight: 'clamp(36px,2.08vw,40px)',
                        '& fieldset': {
                          borderColor: formErrors.dateOfOffense ? '#ef4444' : '#0000004D',
                          borderWidth: 'clamp(0.5px,0.03vw,0.5px)',
                        },
                        '&:hover fieldset': {
                          borderColor: formErrors.dateOfOffense ? '#ef4444' : '#0000004D',
                          borderWidth: 'clamp(0.5px,0.03vw,0.5px)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: formErrors.dateOfOffense ? '#ef4444' : '#0000004D',
                          borderWidth: 'clamp(0.5px,0.03vw,0.5px)',
                        },
                        '& input': {
                          padding: 'clamp(10px,0.69vh,12px) clamp(12px,0.73vw,14px)',
                          fontSize: 'clamp(12px,0.73vw,14px)',
                          height: '100%',
                          color: '#393838',
                          fontFamily: "'Montserrat', sans-serif",
                          textAlign: 'left',
                          '&::placeholder': {
                            color: '#BCBCBC',
                            opacity: 1,
                            textAlign: 'left',
                          },
                        },
                        '& .MuiInputAdornment-root': {
                          marginRight: '0px',
                          marginLeft: '0px',
                          '& .MuiIconButton-root': {
                            padding: '0px',
                            display: 'none',
                          },
                          '& .MuiTypography-root, & span, & p, & div': {
                            display: 'none !important',
                            visibility: 'hidden !important',
                            opacity: '0 !important',
                            width: '0 !important',
                            height: '0 !important',
                            overflow: 'hidden !important',
                          }
                        }
                      },
                      '& .MuiInputLabel-root': {
                        display: 'none',
                      }
                    }}
                      onFocus={() => setFocusedField("dateOfOffense")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </EtLocalizationProvider>
                  <Typography
                    className="absolute right-[clamp(12px,0.63vw,12px)] top-1/2 -translate-y-1/2 font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#747171] pointer-events-none"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    EC
                  </Typography>
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.dateOfOffense && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.dateOfOffense}
                    </Typography>
                  )}
                </div>
              </div>
            </div>

            {/* Act Details and Damage Detail in 2-column flex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,1.67vh,24px)]">
              {/* Act Details */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Act Details <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <Textarea
                  value={actDetails}
                  onChange={(e) => {
                    const value = e.target.value;
                    setActDetails(value);
                    
                    // Real-time validation
                    const newErrors = { ...formErrors };
                    if (!value || value.trim() === "") {
                      newErrors.actDetails = "Description is required";
                    } else if (value.trim().length < 10) {
                      newErrors.actDetails = "Description is too short";
                    } else {
                      delete newErrors.actDetails;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("actDetails")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Eg. details here"
                  className={`w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-md p-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none resize-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    formErrors.actDetails ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.actDetails ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.actDetails && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.actDetails}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Damage Detail */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Damage Detail <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </Typography>
                <Textarea
                  value={damageDetail}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDamageDetail(value);
                    
                    // Real-time validation
                    const newErrors = { ...formErrors };
                    if (!value || value.trim() === "") {
                      newErrors.damageDetail = "Damage description is required";
                    } else if (value.trim().length < 10) {
                      newErrors.damageDetail = "Description is too short";
                    } else {
                      delete newErrors.damageDetail;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("damageDetail")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Eg. details here"
                  className={`w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-md p-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none resize-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    formErrors.damageDetail ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.damageDetail ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.damageDetail && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.damageDetail}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Evidence Attachment */}
              <div className="flex flex-col w-full md:col-span-2 lg:col-span-1">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] block font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Evidence Attachment <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v,.mp3,.mpeg,.wav,.ogg,.aac,.flac,.m4a,.wma"
                  className="hidden"
                />
                {selectedFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-lg border-x-[clamp(1px,0.1vw,2px)] border-y-[clamp(1px,0.1vh,2px)] border-dashed border-[#1E5166] bg-[#F2F2F2] flex flex-col items-center justify-center gap-[clamp(8px,0.42vw,8px)] py-[clamp(10px,0.69vh,10px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(24px,1.25vw,24px)] cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                  >
                    {/* Upload Icon */}
                    <div className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] md:w-[clamp(44px,2.29vw,48px)] md:h-[clamp(44px,4.07vh,48px)] text-[#215167] rounded flex items-center justify-center">
                      <FaFileUpload className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] md:w-[clamp(44px,2.29vw,48px)] md:h-[clamp(44px,4.07vh,48px)] text-[#215167]" />
                    </div>
                    {/* Label */}
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] md:text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#6D6D6D] text-center px-[clamp(8px,0.42vw,8px)]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Upload Files (PDF, DOC, Images, Video, Audio)
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Files Grid - Only for md and sm screens */}
                    <div className="w-full lg:hidden">
                      {/* Files Grid - 2 columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(12px,0.83vw,16px)] mb-[clamp(12px,0.83vw,16px)]">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="w-full h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(8px,0.69vh,10px)] px-[clamp(12px,0.73vw,14px)]">
                            <div className="flex items-center flex-1 min-w-0">
                              {/* Attachment Icon */}
                              <div className="w-[clamp(32px,1.88vw,36px)] h-[clamp(32px,2.96vh,36px)] rounded flex items-center justify-center flex-shrink-0 relative">
                                <FaFileAlt className="w-[clamp(16px,0.94vw,18px)] h-[clamp(20px,1.85vh,22px)] text-[#215167] absolute top-[clamp(6px,0.42vw,7px)] left-[clamp(8px,0.52vw,9px)]" />
                              </div>
                              
                              {/* File Name and Size */}
                              <div className="flex flex-col flex-1 ml-[clamp(8px,0.52vw,10px)] min-w-0">
                                <span
                                  className="font-['Montserrat'] font-normal text-[clamp(11px,0.68vw,13px)] leading-none tracking-normal text-[#0A1D39] truncate"
                                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                                <span
                                  className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-[#949494] mt-[clamp(2px,0.21vw,3px)]"
                                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>

                            {/* View and Delete Icons */}
                            <div className="flex items-center gap-[clamp(6px,0.42vw,8px)] ml-[clamp(8px,0.52vw,10px)] flex-shrink-0">
                              {/* View Icon */}
                              <button
                                type="button"
                                onClick={() => handleViewFile(file, index)}
                                disabled={previewLoading}
                                className="w-[clamp(16px,0.94vw,18px)] h-[clamp(16px,0.94vw,18px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                                title="View/Download file"
                              >
                                {previewLoading ? (
                                  <div className="animate-spin rounded-full h-[clamp(12px,0.73vw,14px)] w-[clamp(12px,0.73vw,14px)] border-b-[clamp(1px,0.1vh,1px)] border-[#215167]"></div>
                                ) : (
                                  <EyeIcon className="w-[clamp(16px,0.94vw,18px)] h-[clamp(16px,0.94vw,18px)] text-[#215167]" />
                                )}
                              </button>

                              {/* Delete Icon */}
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(index)}
                                className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <MdDelete className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#FF4C4C]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Add More Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-[clamp(40px,3.7vh,44px)] rounded-lg border border-[#1E5166] bg-[#F2F2F2] flex items-center justify-center gap-[clamp(8px,0.42vw,8px)] py-[clamp(8px,0.69vh,10px)] px-[clamp(16px,0.83vw,16px)] cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                      >
                        <PlusIcon className="w-[clamp(16px,0.94vw,18px)] h-[clamp(16px,0.94vw,18px)] text-[#215167]" />
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#215167]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          Add Evidence Files
                        </span>
                      </button>
                    </div>
                    {/* Evidence Count - Only for lg screens */}
                    <div className="hidden lg:block">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-lg border-x-[clamp(1px,0.1vw,2px)] border-y-[clamp(1px,0.1vh,2px)] border-dashed border-[#1E5166] bg-[#F2F2F2] flex flex-col items-center justify-center gap-[clamp(8px,0.42vw,8px)] py-[clamp(10px,0.69vh,10px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(24px,1.25vw,24px)] cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                      >
                        {/* Upload Icon */}
                        <div className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] md:w-[clamp(44px,2.29vw,48px)] md:h-[clamp(44px,4.07vh,48px)] text-[#215167] rounded flex items-center justify-center">
                          <FaFileUpload className="w-[clamp(36px,2.08vw,40px)] h-[clamp(36px,3.33vh,40px)] md:w-[clamp(44px,2.29vw,48px)] md:h-[clamp(44px,4.07vh,48px)] text-[#215167]" />
                        </div>
                        {/* Count Display */}
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#215167] text-center"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected. Click to add more
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {formErrors.documents && (
                  <Typography
                    className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500 mt-2"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {formErrors.documents}
                  </Typography>
                )}
              </div>
            </div>

            {/* Horizontal Line under Evidence Attachment */}
            <div 
              className="mt-[clamp(36px,2.5vh,45px)] h-0 rounded w-full max-w-[clamp(320px,57.34vw,1101px)]"
              style={{
                border: 'clamp(0.5px,0.05vw,1px) solid #E5E5EA',
                opacity: 1
              }}
            />

            {/* Witness Information */}
            <Typography
              className="mt-[clamp(24px,1.67vh,24px)] leading-none tracking-normal text-[clamp(20px,1.25vw,24px)]"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#215167'
              }}
            >
              Witness Information <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#747171" }}>(Optional)</span>
            </Typography>

            {/* Witness Display - Only for md and sm screens */}
            {witnesses.length > 0 && (
              <div className="w-full lg:hidden mt-[clamp(24px,1.67vh,24px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(12px,0.83vw,16px)]">
                  {witnesses.map((witness) => (
                    <div key={witness.id} className="w-full h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(8px,0.69vh,10px)] px-[clamp(12px,0.73vw,14px)]">
                      <div className="flex items-center flex-1 min-w-0">
                        {/* User Icon Container */}
                        <div 
                          className="w-[clamp(32px,1.88vw,36px)] h-[clamp(32px,2.96vh,36px)] rounded-lg flex-shrink-0 relative"
                          style={{ backgroundColor: 'rgba(65, 111, 228, 0.18)' }}
                        >
                          <UserIcon 
                            className="w-[clamp(14px,0.83vw,16px)] h-[clamp(16px,0.94vw,18px)] text-[#4475F2] absolute top-[clamp(8px,0.42vw,9px)] left-[clamp(9px,0.52vw,10px)] opacity-30" 
                          />
                        </div>
                        
                        {/* Full Name and Phone Number */}
                        <div className="flex flex-col flex-1 ml-[clamp(8px,0.52vw,10px)] min-w-0">
                          <span
                            className="font-['Montserrat'] font-normal text-[clamp(11px,0.68vw,13px)] leading-none tracking-normal text-[#0A1D39] truncate"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                            title={witness.name}
                          >
                            {witness.name}
                          </span>
                          <span
                            className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-[#949494] mt-[clamp(2px,0.21vw,3px)]"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {witness.phone}
                          </span>
                        </div>
                      </div>

                      {/* Delete Icon */}
                      <div className="flex items-center gap-[clamp(6px,0.42vw,8px)] ml-[clamp(8px,0.52vw,10px)] flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteWitness(witness.id)}
                          className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <MdDelete className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#FF4C4C]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Witness Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,1.67vh,24px)]">
              {/* Full Name */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Full Name
                </Typography>
                <Input
                  type="text"
                  value={witnessFullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWitnessFullName(value);
                    
                    // Real-time validation
                    const newErrors = { ...witnessErrors };
                    const trimmedValue = value.trim();
                    if (trimmedValue && trimmedValue.length < 2) {
                      newErrors.fullName = 'Full name should be at least 2 characters';
                    } else if (trimmedValue && !/^[a-zA-Z\s\u1200-\u137F]+$/.test(trimmedValue)) {
                      newErrors.fullName = 'Name should contain only letters and spaces';
                    } else if (trimmedValue && !/\s/.test(trimmedValue)) {
                      newErrors.fullName = 'Please enter full name (first name and last name)';
                    } else {
                      delete newErrors.fullName;
                    }
                    setWitnessErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("witnessFullName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter Full Name"
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    witnessErrors.fullName ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: witnessErrors.fullName ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {witnessErrors.fullName && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {witnessErrors.fullName}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <Typography
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Phone Number
                </Typography>
                <Input
                  type="text"
                  value={witnessPhoneNumber}
                  onChange={(e) => {
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
                    
                    setWitnessPhoneNumber(cleanedValue);
                    
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
                  onFocus={() => setFocusedField("witnessPhoneNumber")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="start with 09/07xxxxxxxx"
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none !border-t-[#0000004D] !border-r-[#0000004D] !border-b-[#0000004D] !border-l-[#0000004D] focus:!border-[#CFCFCF] ${
                    witnessErrors.phoneNumber ? "!border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: witnessErrors.phoneNumber ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                  labelProps={{
                    className: "hidden"
                  }}
                  containerProps={{
                    className: "!min-w-0"
                  }}
                />
                <div className="min-h-0 mt-0">
                  {witnessErrors.phoneNumber && (
                    <Typography
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {witnessErrors.phoneNumber}
                    </Typography>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <div className="flex flex-col">
                <Typography className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838] opacity-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Action
                </Typography>
              <Button
                type="button"
                onClick={handleAddWitness}
                className="w-[clamp(72px,4.17vw,80px)] h-[clamp(44px,4.07vh,48px)] rounded-lg bg-[#215167] flex items-center justify-center gap-[clamp(8px,0.65vw,10px)] py-[clamp(10px,0.69vh,10px)] px-[clamp(6px,0.31vw,6px)] hover:bg-[#1a4050] transition-colors"
                style={{ backgroundColor: '#215167' }}
              >
                <PlusIcon className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] text-white" />
                <span
                  className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Add
                </span>
              </Button>
              </div>
            </div>

            {/* Cancel and Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-[clamp(8px,0.65vw,10px)] mt-[clamp(48px,3.33vh,56px)]">
              {/* Cancel Button */}
              <Button
                type="button"
                onClick={handleCancel}
                variant="outlined"
                className="w-full sm:w-[clamp(180px,9.38vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg border border-[#9CA2AB] flex items-center justify-center px-[clamp(32px,1.67vw,32px)] sm:px-[clamp(112px,5.83vw,112px)] py-[clamp(16px,1.11vh,16px)] hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#9CA2AB' }}
              >
                <span
                  className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#094C81]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Cancel
                </span>
              </Button>

              {/* Submit Button */}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full sm:w-[clamp(180px,9.38vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#215167] flex items-center justify-center px-[clamp(32px,1.67vw,32px)] sm:px-[clamp(112px,5.83vw,112px)] py-[clamp(16px,1.11vh,16px)] hover:bg-[#1a4050] transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: '#215167' }}
              >
                {isSubmitting ? (
                  <span
                    className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-white flex items-center gap-[clamp(8px,0.42vw,8px)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    <svg className="animate-spin h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)] text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span
                    className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-white"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Submit
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right card (476 x 885) */}
        <div
          className="hidden lg:block rounded-xl border bg-[#FFFFFF] w-[clamp(280px,24.79vw,476px)] h-[clamp(600px,69.44vh,750px)] overflow-hidden"
        >
          {/* Button Group */}
          <div className="mt-[clamp(20px,1.39vh,20px)] mx-[clamp(16px,0.83vw,16px)]">
            <div className="w-full  h-[clamp(44px,4.07vh,48px)] rounded-md border border-[#CCCCCC] bg-white p-[clamp(4px,0.21vw,4px)] flex gap-[clamp(4px,0.21vw,4px)]">
              {/* Files Button */}
              <button
                type="button"
                onClick={() => setSelectedTab("Files")}
                className={`h-[clamp(36px,3.33vh,40px)] rounded flex-1 p-[clamp(10px,0.69vh,10px)] flex items-center justify-center font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-center transition-all ${
                  selectedTab === "Files"
                    ? " bg-[#215167] text-white"
                    : "bg-[#F2F2F2] text-[#020101]"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Files
              </button>

              {/* Witness Button */}
              <button
                type="button"
                onClick={() => setSelectedTab("Witness")}
                className={`h-[clamp(36px,3.33vh,40px)] rounded flex-1 p-[clamp(10px,0.69vh,10px)] flex items-center justify-center font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-center transition-all ${
                  selectedTab === "Witness"
                    ? " bg-[#215167] text-white"
                    : "bg-[#F2F2F2] text-[#020101]"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Witness
              </button>
            </div>
          </div>

          {/* Internal separator line 92px from top border */}
          <div className="mt-[clamp(12px,0.69vh,12px)] border-t border-[#CFCFCF]" />

          {/* Files Content */}
          {selectedTab === "Files" && (
            <div className="mt-[clamp(24px,1.67vh,24px)] p-[clamp(20px,1.04vw,20px)] flex flex-col gap-[clamp(8px,0.42vw,8px)]">
              {selectedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[clamp(300px,37.04vh,400px)]">
                  <FaRegFile className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] text-[#949494] mb-[clamp(12px,0.69vh,12px)]" />
                  <span
                    className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    No files uploaded yet
                  </span>
                </div>
              ) : (
                selectedFiles.map((file, index) => (
                  <div key={index} className="w-full h-[clamp(56px,5.19vh,64px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(20px,1.39vh,20px)] px-[clamp(16px,0.83vw,16px)]">
                    <div className="flex items-center flex-1">
                      {/* Attachment Icon */}
                      <div className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] rounded flex items-center justify-center flex-shrink-0 relative">
                        <FaFileAlt className="w-[clamp(20px,1.25vw,24px)] h-[clamp(28px,2.59vh,32px)] text-[#215167] absolute top-[clamp(8px,0.42vw,8px)] left-[clamp(12px,0.63vw,12px)]" />
                      </div>
                      
                      {/* File Name and Size */}
                      <div className="flex flex-col flex-1 ml-[clamp(16px,0.83vw,16px)] min-w-0">
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#0A1D39]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                          title={file.name}
                        >
                          {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                        </span>
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494] mt-[clamp(4px,0.21vw,4px)]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>

                    {/* View and Delete Icons */}
                    <div className="flex items-center gap-[clamp(8px,0.42vw,8px)] ml-[clamp(16px,0.83vw,16px)]">
                      {/* View Icon */}
                      <button
                        type="button"
                        onClick={() => handleViewFile(file, index)}
                        disabled={previewLoading}
                        className="w-[clamp(18px,1.04vw,20px)] h-[clamp(14px,0.83vw,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                        title="View/Download file"
                      >
                        {previewLoading ? (
                          <div className="animate-spin rounded-full h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)] border-b-[clamp(1px,0.1vh,2px)] border-[#215167]"></div>
                        ) : (
                          <EyeIcon className="w-[clamp(20px,1.25vw,24px)] h-[clamp(18px,1.04vw,20px)] text-[#215167]" />
                        )}
                      </button>

                      {/* Delete Icon */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(index)}
                        className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <MdDelete className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#FF4C4C]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Witness Content */}
          {selectedTab === "Witness" && (
            <div className="mt-[clamp(24px,1.67vh,24px)] p-[clamp(20px,1.04vw,20px)] flex flex-col gap-[clamp(8px,0.42vw,8px)]">
              {witnesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[clamp(300px,37.04vh,400px)]">
                  <CiUser className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] text-[#949494] mb-[clamp(12px,0.69vh,12px)]" />
                  <span
                    className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    No witnesses added yet
                  </span>
                </div>
              ) : (
                witnesses.map((witness) => (
                  <div key={witness.id} className="w-full h-[clamp(56px,5.19vh,64px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(20px,1.39vh,20px)] px-[clamp(16px,0.83vw,16px)]">
                    <div className="flex items-center flex-1">
                      {/* User Icon Container */}
                      <div 
                        className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] rounded-lg flex-shrink-0 relative"
                        style={{ backgroundColor: 'rgba(65, 111, 228, 0.18)' }}
                      >
                        <UserIcon 
                          className="w-[clamp(18px,1.04vw,20px)] h-[clamp(20px,1.25vw,24px)] text-[#4475F2] absolute top-[clamp(12px,0.69vh,12px)] left-[clamp(16px,0.83vw,16px)] opacity-30" 
                        />
                      </div>
                      
                      {/* Full Name and Phone Number */}
                      <div className="flex flex-col flex-1 ml-[clamp(16px,0.83vw,16px)]">
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#0A1D39]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {witness.name}
                        </span>
                        <span
                          className="font-['Pretendard'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494] mt-[clamp(4px,0.21vw,4px)]"
                          style={{ fontFamily: "'Pretendard', sans-serif" }}
                        >
                          {witness.phone}
                        </span>
                      </div>
                    </div>

                    {/* Delete Icon */}
                    <div className="flex items-center gap-[clamp(8px,0.42vw,8px)] ml-[clamp(16px,0.83vw,16px)]">
                      <button
                        type="button"
                        onClick={() => handleDeleteWitness(witness.id)}
                        className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <MdDelete className="w-[clamp(14px,0.83vw,16px)] h-[clamp(14px,0.83vw,16px)] text-[#FF4C4C]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

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
        requestType="complaint case request"
      />

      {/* Toast Container for notifications */}
      {createPortal(
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
          containerClassName="!fixed !top-0 !right-0 !z-[9999999999]"
          toastClassName="!z-[9999999999]"
          style={{ zIndex: 9999999999 }}
        />,
        document.body
      )}

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
          title={previewModal.title}
          customStyle={true}
        />
      )}
    </div>
  );
};

export default NewComplaintRequestForm;

