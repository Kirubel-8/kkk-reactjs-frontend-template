import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpTrayIcon, PlusIcon, DocumentIcon, EyeIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import { FaFileUpload, FaFileAlt, FaLessThan, FaRegFile } from "react-icons/fa";
import { MdDelete, MdArrowDropDown } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import caseTypeService from "@/service/caseType.service";
import complaintService from "@/service/complaint.service";
import courtCategoryService from "@/service/courtCategory.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import PreviewModal from "../requestManagement/document-preview-modal";
import EtDatePicker, { EtLocalizationProvider } from "habesha-datepicker-v2";
import { PiLessThanBold } from "react-icons/pi";

const NewEditComplaint = () => {
  const navigate = useNavigate();
  const { complaintId } = useParams();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [selectedTab, setSelectedTab] = useState("Files");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form fields
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
  
  // Witnesses - store both existing and new
  const [witnesses, setWitnesses] = useState([]);
  
  // Files - can be File objects (new) or file info objects (existing)
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const fileInputRef = useRef(null);
  const leftCardRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [witnessErrors, setWitnessErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [caseTypes, setCaseTypes] = useState([]);
  const [courtCategories, setCourtCategories] = useState([]);
  const [courtOffices, setCourtOffices] = useState([]);
  
  // Tracking removed items
  const [removedWitnessIds, setRemovedWitnessIds] = useState([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState([]);
  const [existingEvidences, setExistingEvidences] = useState([]);
  const [initialWitnessIds, setInitialWitnessIds] = useState(new Set());
  
  // Modals
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null, title: null });
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Get court category from court office ID (for loading existing data)
  const getCourtCategoryFromOffice = (officeId) => {
    if (!officeId) return "";
    const office = courtOffices.find(off => off.court_office_id === officeId);
    return office?.category?.court_category_id || "";
  };

  // Get the full request ID from location state
  const fullRequestId = location.state?.fullRequestId || location.state?.fullComplaintId || complaintId;
  const existingData = location.state?.requestData;

  const handleBack = () => {
    navigate("/home/requests");
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    
    const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
    
    const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v'];
    const AUDIO_EXTENSIONS = ['.mp3', '.mpeg', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    
    const getFileExtension = (fileName) => {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
    };
    
    const invalidFiles = [];
    const validFiles = [];
    
    files.forEach(file => {
      const fileSize = file.size;
      const fileExtension = getFileExtension(file.name);
      let maxSize = 0;
      let fileType = '';
      let maxSizeMB = 0;
      
      if (VIDEO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_VIDEO_SIZE;
        fileType = 'video';
        maxSizeMB = 200;
      } else if (AUDIO_EXTENSIONS.includes(fileExtension)) {
        maxSize = MAX_AUDIO_SIZE;
        fileType = 'audio';
        maxSizeMB = 50;
      } else {
        maxSize = MAX_DOCUMENT_SIZE;
        fileType = 'document';
        maxSizeMB = 10;
      }
      
      if (fileSize > maxSize) {
        invalidFiles.push({
          name: file.name,
          size: fileSize,
          type: fileType,
          maxSize: maxSizeMB,
          actualSize: formatFileSize(fileSize)
        });
      } else {
        const isDuplicate = selectedFiles.some(doc => {
          // Check if it's a File object
          if (doc instanceof File) {
            return doc.name === file.name && doc.size === file.size;
          }
          // Check if it's a file info object
          return doc.name === file.name && doc.size === file.size;
        });
        
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }
    });
    
    if (invalidFiles.length > 0) {
      const totalFiles = files.length;
      const invalidCount = invalidFiles.length;
      const errorMessage = totalFiles > 1 
        ? `${invalidCount}/${totalFiles} selected file${totalFiles > 1 ? 's' : ''} ${invalidCount > 1 ? 'are' : 'is'} too large`
        : 'Selected file is too large';
      setFormErrors((prev) => ({ ...prev, documents: errorMessage }));
      
      if (validFiles.length === 0) {
        return;
      }
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    if (invalidFiles.length === 0) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.documents;
        return updated;
      });
    }
    
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
    const file = selectedFiles[index];
    // Track removed evidence ID if it's an existing file
    if (file && file.isExisting && (file.evidence_id || file.complaint_evidence_id || file.id)) {
      const evidenceId = file.evidence_id || file.complaint_evidence_id || file.id;
      if (evidenceId) {
        setRemovedEvidenceIds(prev => {
          if (!prev.includes(evidenceId)) {
            return [...prev, evidenceId];
          }
          return prev;
        });
        console.log("Tracking removed evidence ID:", evidenceId);
      }
    }
    // Remove from list
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewFile = async (file, index) => {
    if (!file) {
      toast.error("No file provided");
      return;
    }
    
    // Find the index of the file in selectedFiles to determine evidence number
    const fileIndex = index !== undefined ? index : selectedFiles.findIndex(f => {
      if (file.isExisting) {
        return (f.id === file.id) || 
               (f.evidence_id === file.evidence_id) || 
               (f.complaint_evidence_id === file.complaint_evidence_id) ||
               (f.allEvidenceIds && file.allEvidenceIds && 
                f.allEvidenceIds.some(id => file.allEvidenceIds.includes(id)));
      } else {
        return f === file || (f.name === file.name && f.size === file.size);
      }
    });
    const evidenceNumber = fileIndex !== -1 ? fileIndex + 1 : 1;
    const evidenceTitle = `Evidence ${evidenceNumber}`;
    
    try {
      setPreviewLoading(true);
      
      let fileUrl = null;
      let fileExtension = null;
      let fileName = null;
      let fileType = null;

      if (file.fileUrl) {
        // Existing file with URL - ensure it's a full URL
        const rawUrl = file.fileUrl;
        fileUrl = rawUrl.startsWith('http') 
          ? rawUrl 
          : `${DOCUMENT_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
        fileName = file.name || rawUrl.split('/').pop() || 'document';
        // Extract extension more reliably
        const lastDot = fileName.lastIndexOf('.');
        fileExtension = lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : null;
        fileType = file.type || 'application/octet-stream';
      } else if (file instanceof File) {
        // New file (File object)
        fileUrl = URL.createObjectURL(file);
        fileName = file.name;
        const lastDot = fileName.lastIndexOf('.');
        fileExtension = lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : null;
        fileType = file.type;
      } else {
        console.error("Invalid file object:", file);
        console.error("File properties:", {
          hasFileUrl: !!file.fileUrl,
          fileUrl: file.fileUrl,
          isFile: file instanceof File,
          isExisting: file.isExisting,
          keys: Object.keys(file || {})
        });
        toast.error("Invalid file - file must have fileUrl or be a File object");
        setPreviewLoading(false);
        return;
      }

      // Check if file type can be determined from content-type if extension is missing
      if (!fileExtension && fileType) {
        if (fileType.startsWith('image/')) {
          fileExtension = fileType.split('/')[1];
        } else if (fileType === 'application/pdf') {
          fileExtension = 'pdf';
        } else if (fileType.startsWith('video/')) {
          fileExtension = fileType.split('/')[1];
        } else if (fileType.startsWith('audio/')) {
          fileExtension = fileType.split('/')[1];
        }
      }

      const isImage = fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf';
      const isVideo = fileExtension && ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(fileExtension) || fileType?.startsWith('video/');
      const isAudio = fileExtension && ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'].includes(fileExtension) || fileType?.startsWith('audio/');
      
      if (isImage || isPdf || isVideo || isAudio) {
        // For existing files (with fileUrl), fetch and create File object for modal
        if (file.fileUrl && !(file instanceof File)) {
          try {
            const response = await fetch(fileUrl, { 
              method: 'GET', 
              headers: { 'Accept': '*/*' } 
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            const contentType = response.headers.get('content-type') || blob.type || fileType || 'application/octet-stream';
            const fileObj = new File([blob], fileName, { type: contentType });
            setPreviewModal({ isOpen: true, file: fileObj, title: evidenceTitle });
            setPreviewLoading(false);
          } catch (error) {
            console.error("Error fetching file for preview:", error);
            // Fallback: try to open URL directly
            try {
              setPreviewModal({ isOpen: true, file: fileUrl, title: evidenceTitle });
              setPreviewLoading(false);
            } catch (fallbackError) {
              console.error("Error with URL fallback:", fallbackError);
              setPreviewLoading(false);
              toast.error("Failed to open file. Please try downloading it.");
            }
          }
      } else {
          // New file (File object) - use directly
          setPreviewModal({ isOpen: true, file, title: evidenceTitle });
          setPreviewLoading(false);
        }
      } else {
        // Download non-previewable files
        if (file.fileUrl && !(file instanceof File)) {
          // For existing files, fetch and download
          try {
            const response = await fetch(fileUrl, { 
              method: 'GET', 
              headers: { 'Accept': '*/*' } 
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
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
            console.error("Error downloading file:", error);
            setPreviewLoading(false);
            toast.error(error.message || "Failed to download file");
          }
        } else {
          // For new File objects
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
    
    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    }
    if (!phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
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
    
    if (Object.keys(newErrors).length === 0 && fullName && phoneNumber) {
      const newWitness = {
        id: Date.now() + Math.random(),
        name: fullName,
        phone: phoneNumber
      };
      setWitnesses((prev) => [...prev, newWitness]);
      setWitnessFullName("");
      setWitnessPhoneNumber("");
      setWitnessErrors({});
      setSelectedTab("Witness");
    }
  };

  const handleDeleteWitness = (id) => {
    // Find the witness to check if it has a complaint_witness_id
    const witness = witnesses.find(w => w.id === id);
    if (witness && witness.complaint_witness_id) {
      // Track removed witness ID if it exists
      setRemovedWitnessIds(prev => {
        if (!prev.includes(witness.complaint_witness_id)) {
          return [...prev, witness.complaint_witness_id];
        }
        return prev;
      });
    }
    // Remove from list
    setWitnesses((prev) => prev.filter((witness) => witness.id !== id));
  };

  // Load all initial data (case types, court categories, offices, and complaint data) in one go
  useEffect(() => {
    const loadAllData = async () => {
      if (!fullRequestId) {
        setError("No complaint ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }, 0);

        // Fetch all data in parallel
        const [caseTypesResponse, categoriesResponse, officesResponse, complaintResponse] = await Promise.all([
          caseTypeService.getAllCaseTypes().catch(() => ({
            data: [
              { case_type_id: 'fallback-1', name: 'Criminal Case' },
              { case_type_id: 'fallback-2', name: 'Civil Case' },
              { case_type_id: 'fallback-3', name: 'Administrative Case' },
              { case_type_id: 'fallback-4', name: 'Constitutional Case' },
              { case_type_id: 'fallback-5', name: 'Commercial Case' }
            ]
          })),
          courtCategoryService.getCategories().catch(() => ({ categories: [] })),
          courtCategoryService.getOffices().catch(() => ({ offices: [] })),
          existingData 
            ? Promise.resolve({ data: existingData })
            : complaintService.getComplaintById(fullRequestId).catch((err) => {
                console.error("Error fetching complaint:", err);
                throw err;
              })
        ]);

        // Set case types
        const caseTypes = caseTypesResponse.data || caseTypesResponse;
        setCaseTypes(Array.isArray(caseTypes) ? caseTypes : []);

        // Set court categories and offices
        const categories = categoriesResponse.categories || [];
        const offices = officesResponse.offices || [];
        setCourtCategories(categories);
        setCourtOffices(offices);

        // Process complaint data
        const requestData = complaintResponse.data || complaintResponse;

        console.log("Loading existing complaint data:", requestData);

        // Store existing evidences for tracking removals
        const evidences = requestData.evidences || [];
        setExistingEvidences(evidences);

        // Populate form fields
        setJudgeFullName(requestData.judge_name || "");
        
        // Handle court office - use court_office_id if available, otherwise fallback to court_office name
        if (requestData.court_office_id && requestData.courtOffice) {
          // Use the ID and find the category from the office's category relationship
          const officeId = requestData.court_office_id;
          const office = requestData.courtOffice;
          const categoryId = office.category?.court_category_id || null;
          
          setCourtOffice(officeId);
          setCourtLocation(categoryId || "");
        } else if (requestData.court_office_id) {
          // If we have the ID but not the full office object, find it in our loaded offices
          const foundOffice = offices.find(off => off.court_office_id === requestData.court_office_id);
          if (foundOffice) {
            setCourtOffice(foundOffice.court_office_id);
            setCourtLocation(foundOffice.category?.court_category_id || "");
          } else {
            setCourtOffice("");
            setCourtLocation("");
          }
        } else if (requestData.court_office || requestData.judge_court) {
          // Fallback: try to find office by name
          const officeName = requestData.court_office || requestData.judge_court;
          const foundOffice = offices.find(off => off.name === officeName);
          if (foundOffice) {
            setCourtOffice(foundOffice.court_office_id);
            setCourtLocation(foundOffice.category?.court_category_id || "");
          } else {
            // Last resort: set empty (old data without ID)
            setCourtOffice("");
            setCourtLocation("");
          }
        } else {
          setCourtOffice("");
          setCourtLocation("");
        }
        
        setCaseType(requestData.case_type || "");
        setCaseFileNumber(requestData.case_file_number || "");
        
        // Format date for date input
        if (requestData.act_date) {
          const date = new Date(requestData.act_date);
          const formattedDate = date.toISOString().split('T')[0];
          setDateOfOffense(formattedDate);
        } else {
          setDateOfOffense("");
        }
        
        setActDetails(requestData.detailed_description || "");
        setDamageDetail(requestData.damage_description || "");

        // Load witnesses
        const loadedWitnesses = (requestData.witnesses || []).map((witness, index) => ({
          id: witness.complaint_witness_id || `witness-${Date.now()}-${index}`,
          name: witness.witness_name || "",
          phone: witness.witness_phone_number || "",
          complaint_witness_id: witness.complaint_witness_id || null
        }));
        setWitnesses(loadedWitnesses);
        
        // Store initial witness IDs for tracking removals
        const initialWitnessIdSet = new Set();
        loadedWitnesses.forEach(w => {
          if (w.complaint_witness_id) {
            initialWitnessIdSet.add(w.complaint_witness_id);
          }
        });
        setInitialWitnessIds(initialWitnessIdSet);
        console.log("Initial witness IDs:", Array.from(initialWitnessIdSet));

        // Load evidences/files
        const documentsArray = (requestData.evidences || []).map((evidence, index) => {
            const evidenceId = evidence.complaint_evidence_id;
            const fileUrl = evidence.public_url || evidence.file_url || evidence.file_path;
            
            // Extract file name from URL if available, otherwise use description or default
            let fileName = `Evidence ${index + 1}`;
            if (fileUrl) {
              const urlParts = fileUrl.split('/');
              const urlFileName = urlParts[urlParts.length - 1];
              if (urlFileName && urlFileName.includes('.')) {
                fileName = urlFileName;
              } else if (evidence.file_name) {
                fileName = evidence.file_name;
              } else if (evidence.description) {
                fileName = evidence.description;
              }
            } else if (evidence.file_name) {
              fileName = evidence.file_name;
            } else if (evidence.description) {
              fileName = evidence.description;
            }
            
            // Construct full URL if needed
            const fullFileUrl = fileUrl ? (fileUrl.startsWith('http') 
              ? fileUrl 
              : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`) : null;
            
          return {
              id: evidenceId || `evidence-${index}`,
              evidence_id: evidence.complaint_evidence_id || null,
              complaint_evidence_id: evidence.complaint_evidence_id || null,
              allEvidenceIds: [evidence.complaint_evidence_id].filter(Boolean),
              name: fileName,
              type: evidence.file_type || "application/octet-stream",
              size: 0,
              isExisting: true,
              fileUrl: fullFileUrl,
              // Also store the raw URL for reference
              rawFileUrl: fileUrl
            };
        });
        setSelectedFiles(documentsArray);

      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message || "Failed to load complaint data");
        toast.error("Failed to load complaint data");
      } finally {
        setLoading(false);
      }
    };

    if (fullRequestId) {
      loadAllData();
    }
  }, [fullRequestId, existingData]);

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
      startLoading();
      
      // Get the court office name from the selected ID
      const courtOfficeName = getCourtOfficeName(courtOffice);
      
      console.log("Court Office Debug:", {
        courtLocation,
        courtOffice,
        courtOfficeName,
        availableOffices: courtLocation ? getAvailableCourtOffices() : []
      });
      
      const fd = new FormData();
      
      // Map judge information
      fd.append("judge_name", judgeFullName.trim() || "");
      fd.append("judge_court", courtOfficeName);
      fd.append("court_office_id", courtOffice || "");
      fd.append("case_file_number", caseFileNumber.trim() || "");
      fd.append("case_type", caseType || "");
      fd.append("act_date", dateOfOffense || "");
      fd.append("complainant_address", ""); // Not in this form
      fd.append("detailed_description", actDetails.trim() || "");
      fd.append("damage_description", damageDetail.trim() || "");
      fd.append("additional_explanation", ""); // Not in this form

      // Map witness information and track removals
      const currentWitnessIds = new Set();
      const witnessData = [];
      
      // Process current witnesses
      witnesses.forEach(w => {
        const witnessId = w.complaint_witness_id;
        if (witnessId) {
          currentWitnessIds.add(witnessId);
        }
        
        witnessData.push({
          witness_name: w.name,
          witness_phone_number: w.phone || "",
          ...(w.complaint_witness_id && { complaint_witness_id: String(w.complaint_witness_id) })
        });
      });
      
      if (witnessData.length > 0) {
        fd.append("witnesses", JSON.stringify(witnessData));
      }

      // Check for removed witnesses by comparing with initial witness data
      const finalRemovedWitnessIds = [...removedWitnessIds];
      
      // Compare initial witnesses with current witnesses
      initialWitnessIds.forEach(initialId => {
        if (!currentWitnessIds.has(initialId) && !finalRemovedWitnessIds.includes(initialId)) {
          finalRemovedWitnessIds.push(initialId);
          console.log("Tracking removed witness:", initialId);
        }
      });

      // Handle removal of witnesses
      if (finalRemovedWitnessIds.length > 0) {
        fd.append("remove_witness_ids", JSON.stringify(finalRemovedWitnessIds));
        console.log("Removed witness IDs to send:", finalRemovedWitnessIds);
      }

      // Prepare evidences - track existing and new
      const removeEvidenceIds = [...removedEvidenceIds];
      const newFiles = [];
      
      // First, collect all existing evidence IDs that are still present
      const currentEvidenceIds = new Set();
      
      // Process current files
      selectedFiles.forEach((file) => {
        // Check if this is an existing evidence (has an ID)
        const evidenceId = file.evidence_id || file.complaint_evidence_id || (file.allEvidenceIds && file.allEvidenceIds[0]) || file.id;
        
        if (evidenceId && file.isExisting) {
          // This is an existing evidence that's still present
          if (file.evidence_id) currentEvidenceIds.add(file.evidence_id);
          if (file.complaint_evidence_id) currentEvidenceIds.add(file.complaint_evidence_id);
          if (file.allEvidenceIds && file.allEvidenceIds.length > 0) {
            file.allEvidenceIds.forEach(id => {
              if (id) currentEvidenceIds.add(id);
            });
          }
          if (file.id && file.isExisting) currentEvidenceIds.add(file.id);
        } else if (file instanceof File) {
          // New file upload (File object means it's new)
          newFiles.push({
            file: file,
            description: file.name
          });
        }
      });

      // Now check for removed evidences by comparing existingEvidences with current files
      existingEvidences.forEach(existingEvidence => {
        const evidenceId = existingEvidence.complaint_evidence_id;
        if (!evidenceId) return; // Skip if no ID
        
        // Only check file evidences (skip text-only evidences)
        if (!existingEvidence.file_url && !existingEvidence.public_url) {
          return;
        }
        
        // Skip if this evidence ID is already in the removal list
        if (removeEvidenceIds.includes(evidenceId)) {
          return;
        }
        
        // Check if this evidence ID is still in the current files
        const stillExists = 
          currentEvidenceIds.has(existingEvidence.complaint_evidence_id) ||
          (existingEvidence.evidence_id && currentEvidenceIds.has(existingEvidence.evidence_id)) ||
          selectedFiles.some(file => {
            const fileId = file.evidence_id || file.complaint_evidence_id || (file.allEvidenceIds && file.allEvidenceIds[0]) || file.id;
            return (
              (fileId === existingEvidence.complaint_evidence_id) ||
              (existingEvidence.evidence_id && fileId === existingEvidence.evidence_id)
            );
          });
        
        // If evidence doesn't exist in current files, mark for removal
        if (!stillExists) {
          const idToRemove = existingEvidence.complaint_evidence_id || existingEvidence.evidence_id;
          if (idToRemove && !removeEvidenceIds.includes(idToRemove)) {
            removeEvidenceIds.push(idToRemove);
            console.log("Tracking removed evidence (from comparison):", idToRemove, existingEvidence);
          }
        }
      });
      
      console.log("Current evidence IDs:", Array.from(currentEvidenceIds));
      console.log("Removed evidence IDs to send:", removeEvidenceIds);

      // Handle removal of evidence files (if any are marked for removal)
      if (removeEvidenceIds.length > 0) {
        fd.append("remove_evidence_ids", JSON.stringify(removeEvidenceIds));
      }

      // Handle evidence files - only append new files
      if (newFiles.length > 0) {
        newFiles.forEach((d) => {
          if (d.file) {
            fd.append("evidence_files", d.file);
          }
        });
      }

      console.log("FormData contents:");
      for (let [key, value] of fd.entries()) {
        console.log(key, value);
      }

      // Use the service to update the complaint
      const result = await complaintService.updateComplaint(fullRequestId, fd);

      console.log("Updated complaint:", result);
      
      // Close terms modal
      setShowTermsModal(false);
      setIsSubmitting(false);
      stopLoading();
      
      // Navigate with state to show success snack on home page
      navigate("/home/requests", { 
        state: { 
          showSuccessSnack: true,
          successMessage: "Your complaint is updated successfully"
        } 
      });
    } catch (err) {
      console.error("Submit error:", err);
      setIsSubmitting(false);
      stopLoading();
      
      // Close terms modal on error
      setShowTermsModal(false);
      
      // Show error notification after a small delay to ensure modal is closed
      setTimeout(() => {
        toast.error("Failed to update your complaint", {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-10 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-['Montserrat'] font-normal text-base text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#215167] text-white rounded hover:opacity-90"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-[clamp(32px,2.22vh,32px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(32px,1.67vw,32px)] lg:px-[clamp(48px,2.5vw,48px)]">
      {/* Header with back button */}
      {/* <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <FaLessThan className="text-[#143481]" />
          </button>
          
          <h1 className="font-['Montserrat'] font-bold text-xl text-[#11255A]">
          Edit Complaint Report
          </h1>
      </div> */}

      <div className="justify-center flex flex-col lg:flex-row lg:items-start gap-[clamp(24px,1.67vh,24px)]">
        {/* Left card */}
        <div 
          ref={leftCardRef}
          className="max-w-[clamp(320px,69.06vw,1326px)] mx-auto lg:mx-0 lg:flex-1 max-h-[963px] rounded-xl bg-[#FFFFFF] backdrop-blur-lg overflow-auto pb-[clamp(20px,2vh,32px)] mb-[clamp(24px,1.67vh,24px)] lg:mb-0"
        >
          {/* Left card header & subtitle */}
          <div className="mt-[clamp(24px,1.67vh,24px)] ml-[clamp(16px,0.83vw,16px)] md:ml-[clamp(32px,1.67vw,32px)] lg:ml-[clamp(48px,2.55vw,49px)]">
            <div className="flex items-center gap-[clamp(16px,0.83vw,16px)]">
            <button
                onClick={handleBack}
                className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity bg-[#eaeaee] p-[clamp(8px,0.42vw,8px)] rounded-md"
              >
                <FaLessThan className="text-[#2C2C2C] text-[clamp(18px,1.04vw,20px)]" />
              </button>
            <h2
                className="leading-none tracking-normal text-[#2C2C2C] text-[clamp(20px,1.25vw,24px)]"
                style={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  lineHeight: '100%',
                  letterSpacing: '0%'
                }}
            >
                Edit Complaint Reporting
            </h2>
            </div>
            {/* <p
              className="mt-1 font-['Montserrat'] font-normal text-base leading-none tracking-normal text-[#959595]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Edit complaint Report
            </p> */}
          </div>

          {/* Internal separator line */}
          <div className="mt-[clamp(20px,1.39vh,20px)] border-t border-[#CFCFCF]" />

          <div className="ml-[clamp(16px,2.55vw,49px)] mt-[clamp(36px,2.78vh,36px)] mr-[clamp(16px,9.17vw,176px)] ">
            <h3
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
            </h3>

            {/* Form fields in 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,1.67vh,24px)]">
              {/* Judge Full Name */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Full Name <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <input
                  type="text"
                  value={judgeFullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJudgeFullName(value);
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
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
                    formErrors.judgeFullName ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.judgeFullName ? 'clamp(0.5px,0.05vw,1px) solid #ef4444' : 'clamp(0.5px,0.03vw,0.5px) solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.judgeFullName && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.judgeFullName}
                    </span>
                  )}
                </div>
              </div>

              {/* Court Category */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Category <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <div className="relative w-full max-w-[clamp(280px,16.67vw,320px)]">
                  <select
                    value={courtLocation}
                    onChange={(e) => {
                      const value = e.target.value;
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
                    disabled={courtCategories.length === 0}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none ${
                      courtCategories.length === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: 'clamp(0.5px,0.03vw,0.5px) solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                  >
                    <option value="" disabled className="text-[#BCBCBC]">
                      {courtCategories.length === 0 ? "Loading..." : "Select Court Category"}
                    </option>
                    {courtCategories.map((category) => (
                      <option key={category.court_category_id} value={category.court_category_id} className="text-[#747171]">
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <MdArrowDropDown 
                    className="absolute right-[clamp(12px,0.63vw,12px)] top-1/2 -translate-y-1/2 w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] text-[#949494] pointer-events-none" 
                  />
                </div>
              </div>

              {/* Court Office */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Office <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <div className="relative w-full max-w-80">
                  <select
                    value={courtOffice}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCourtOffice(value);
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
                    disabled={!courtLocation || courtOffices.length === 0}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none ${
                      !courtLocation || courtOffices.length === 0 ? "cursor-not-allowed" : "cursor-pointer"
                    } ${formErrors.courtOffice ? "border-red-500" : ""} text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: formErrors.courtOffice ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                  >
                    <option value="" disabled className="text-[#BCBCBC]">
                      {courtOffices.length === 0 
                        ? "Loading..." 
                        : !courtLocation 
                          ? "Select Court Category First" 
                          : getAvailableCourtOffices().length === 0
                            ? "No offices available"
                            : "Select Court Office"}
                    </option>
                    {getAvailableCourtOffices().map((office) => (
                      <option key={office.value} value={office.value} className="text-[#747171]">
                        {office.label}
                      </option>
                    ))}
                  </select>
                  <MdArrowDropDown 
                    className="absolute right-[clamp(12px,0.63vw,12px)] top-1/2 -translate-y-1/2 w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] text-[#949494] pointer-events-none" 
                  />
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.courtOffice && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.courtOffice}
                    </span>
                  )}
                </div>
              </div>

              {/* Case Type */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Case Type <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <div className="relative w-full max-w-[clamp(280px,16.67vw,320px)]">
                  <select
                    value={caseType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCaseType(value);
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
                    disabled={caseTypes.length === 0}
                    className={`w-full h-[clamp(44px,4.07vh,48px)] rounded-md pl-[clamp(16px,0.83vw,16px)] pr-[clamp(40px,2.08vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none cursor-pointer ${formErrors.caseType ? "border-red-500" : ""} text-[#393838] ${caseTypes.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: formErrors.caseType ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                  >
                    <option value="" disabled className="text-[#747171]">
                      {caseTypes.length === 0 ? 'Loading...' : 'Select Case Type'}
                    </option>
                    {caseTypes.map((caseTypeOption) => (
                      <option 
                        key={caseTypeOption.case_type_id} 
                        value={caseTypeOption.name}
                        className="text-[#747171]"
                      >
                        {caseTypeOption.name}
                      </option>
                    ))}
                  </select>
                  <MdArrowDropDown 
                    className="absolute right-[clamp(12px,0.63vw,12px)] top-1/2 -translate-y-1/2 w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] text-[#949494] pointer-events-none" 
                  />
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.caseType && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.caseType}
                    </span>
                  )}
                </div>
              </div>

              {/* Case File Number */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Case File Number <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <input
                  type="text"
                  value={caseFileNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCaseFileNumber(value);
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
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
                    formErrors.caseFileNumber ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.caseFileNumber ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.caseFileNumber && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.caseFileNumber}
                    </span>
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
                  <span
                    className="absolute right-[clamp(12px,0.63vw,12px)] top-1/2 -translate-y-1/2 font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#747171] pointer-events-none"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    EC
                  </span>
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.dateOfOffense && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.dateOfOffense}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Act Details and Damage Detail in 2-column flex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,1.67vh,24px)]">
              {/* Act Details */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Act Details <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <textarea
                  value={actDetails}
                  onChange={(e) => {
                    const value = e.target.value;
                    setActDetails(value);
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
                  className={`w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-md p-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none resize-none ${
                    formErrors.actDetails ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.actDetails ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.actDetails && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.actDetails}
                    </span>
                  )}
                </div>
              </div>

              {/* Damage Detail */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Damage Detail <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400, fontStyle: "normal", fontSize: "clamp(12px,0.73vw,14px)", lineHeight: "100%", letterSpacing: "0%", color: "#FF4C4C" }}>*</span>
                </label>
                <textarea
                  value={damageDetail}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDamageDetail(value);
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
                  className={`w-full h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-md p-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none resize-none ${
                    formErrors.damageDetail ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.damageDetail ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.damageDetail && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.damageDetail}
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence Attachment */}
              <div className="flex flex-col flex-1 w-full md:col-span-2 lg:col-span-1">
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
                          <div key={file.id || index} className="w-full h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(8px,0.69vh,10px)] px-[clamp(12px,0.73vw,14px)]">
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
                                  {file.size > 0 ? formatFileSize(file.size) : (file.isExisting ? "Existing file" : "File")}
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
                  <div className="mt-2">
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.documents}
                    </span>
                  </div>
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
            <h3
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
            </h3>

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
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={witnessFullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWitnessFullName(value);
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
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
                    witnessErrors.fullName ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: witnessErrors.fullName ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {witnessErrors.fullName && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {witnessErrors.fullName}
                    </span>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  value={witnessPhoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    let cleanedValue = value.replace(/[^\d\s]/g, '');
                    const digitsOnly = cleanedValue.replace(/\s+/g, '');
                    
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
                  className={`w-full max-w-[clamp(280px,16.67vw,320px)] h-[clamp(44px,4.07vh,48px)] rounded-md px-[clamp(16px,0.83vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
                    witnessErrors.phoneNumber ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: witnessErrors.phoneNumber ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {witnessErrors.phoneNumber && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.63vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {witnessErrors.phoneNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <div className="flex flex-col">
                <label className="mb-[clamp(8px,0.42vw,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838] opacity-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Action
                </label>
              <button
                type="button"
                onClick={handleAddWitness}
                className="w-[clamp(72px,4.17vw,80px)] h-[clamp(44px,4.07vh,48px)] rounded-lg bg-[#215167] flex items-center justify-center gap-[clamp(8px,0.65vw,10px)] py-[clamp(10px,0.69vh,10px)] px-[clamp(6px,0.31vw,6px)] hover:bg-[#1a4050] transition-colors"
              >
                <PlusIcon className="w-[clamp(18px,1.04vw,20px)] h-[clamp(18px,1.04vw,20px)] text-white" />
                <span
                  className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Add
                </span>
              </button>
              </div>
            </div>

            {/* Cancel and Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-[clamp(8px,0.65vw,10px)] mt-[clamp(48px,3.33vh,56px)]">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-[clamp(180px,9.38vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg border border-[#9CA2AB] flex items-center justify-center px-[clamp(32px,1.67vw,32px)] sm:px-[clamp(32px,5.83vw,112px)] py-[clamp(16px,1.48vh,16px)] hover:bg-gray-50 transition-colors"
              >
                <span
                  className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#094C81]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Cancel
                </span>
              </button>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full sm:w-[clamp(180px,9.38vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#215167] flex items-center justify-center px-[clamp(32px,1.67vw,32px)] sm:px-[clamp(32px,5.83vw,112px)] py-[clamp(16px,1.48vh,16px)] hover:bg-[#1a4050] transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    Updating...
                  </span>
                ) : (
                  <span
                    className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-white"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Update
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div
          className="hidden lg:block lg:sticky lg:top-[clamp(112px,12.96vh,148px)] rounded-xl border bg-[#FFFFFF] w-[clamp(280px,24.79vw,476px)] h-[clamp(600px,69.44vh,750px)] overflow-hidden"
        >
          {/* Button Group */}
          <div className="mt-[clamp(20px,1.39vh,20px)] mx-[clamp(16px,0.83vw,16px)]">
            <div className="w-full h-[clamp(44px,4.07vh,48px)] rounded-md border border-[#CCCCCC] bg-white p-[clamp(4px,0.21vw,4px)] flex gap-[clamp(4px,0.21vw,4px)]">
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

          {/* Internal separator line */}
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
                  <div key={file.id || index} className="w-full h-[clamp(56px,5.19vh,64px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(20px,1.39vh,20px)] px-[clamp(16px,0.83vw,16px)]">
                    <div className="flex items-center flex-1">
                      <div className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] rounded flex items-center justify-center flex-shrink-0 relative">
                        <FaFileAlt className="w-[clamp(20px,1.25vw,24px)] h-[clamp(28px,2.59vh,32px)] text-[#215167] absolute top-[clamp(8px,0.42vw,8px)] left-[clamp(12px,0.63vw,12px)]" />
                      </div>
                      
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
                          {file.size > 0 ? formatFileSize(file.size) : (file.isExisting ? "Existing file" : "File")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-[clamp(8px,0.42vw,8px)] ml-[clamp(16px,0.83vw,16px)]">
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
                      <div 
                        className="w-[clamp(44px,2.29vw,48px)] h-[clamp(44px,4.07vh,48px)] rounded-lg flex-shrink-0 relative"
                        style={{ backgroundColor: 'rgba(65, 111, 228, 0.18)' }}
                      >
                        <UserIcon 
                          className="w-[clamp(18px,1.04vw,20px)] h-[clamp(20px,1.25vw,24px)] text-[#4475F2] absolute top-[clamp(12px,0.69vh,12px)] left-[clamp(16px,0.83vw,16px)] opacity-30" 
                        />
                      </div>
                      
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

      {/* Toast Container */}
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

export default NewEditComplaint;
