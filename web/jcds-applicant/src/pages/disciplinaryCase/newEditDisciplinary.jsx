import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpTrayIcon, PlusIcon, EyeIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import { FaFileUpload, FaFileAlt, FaLessThan, FaRegFile } from "react-icons/fa";
import { MdDelete, MdArrowDropDown } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import PreviewModal from "../requestManagement/document-preview-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import courtCategoryService from "@/service/courtCategory.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";
import { PiLessThanBold } from "react-icons/pi";

const NewEditDisciplinary = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const [selectedTab, setSelectedTab] = useState("Files");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [judgeFullName, setJudgeFullName] = useState("");
  const [courtOffice, setCourtOffice] = useState("");
  const [courtLocation, setCourtLocation] = useState("");
  const [caseFileNumber, setCaseFileNumber] = useState("");
  const [disciplinaryIssue, setDisciplinaryIssue] = useState("");
  const [witnessFullName, setWitnessFullName] = useState("");
  const [witnessPhoneNumber, setWitnessPhoneNumber] = useState("");
  const [witnesses, setWitnesses] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const leftCardRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const [witnessErrors, setWitnessErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null, title: null });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [courtCategories, setCourtCategories] = useState([]);
  const [courtOffices, setCourtOffices] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);
  
  // Track existing and removed items
  const [existingEvidences, setExistingEvidences] = useState([]);
  const [existingWitnesses, setExistingWitnesses] = useState([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState([]);
  const [removedWitnessIds, setRemovedWitnessIds] = useState([]);

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

  // Fetch court categories and offices from backend (parallel requests)
  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        setLoadingCategories(true);
        setLoadingOffices(true);

        // Fetch categories and offices in parallel
        const [categoriesResponse, officesResponse] = await Promise.all([
          courtCategoryService.getCategories(),
          courtCategoryService.getOffices()
        ]);

        const categories = categoriesResponse.categories || [];
        const offices = officesResponse.offices || [];
        setCourtCategories(categories);
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

  // Fetch court offices based on selected category
  useEffect(() => {
    if (courtLocation) {
      // Offices are already loaded, just filter them
      // This effect ensures the office dropdown updates when category changes
    }
  }, [courtLocation]);

  const fullRequestId = location.state?.fullRequestId || requestId;
  const existingData = location.state?.requestData;

  // Fetch existing data
  const fetchExistingData = useCallback(async () => {
    if (!fullRequestId) {
      setError("No request ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let requestData;
      if (existingData) {
        requestData = existingData;
      } else {
        const response = await DisciplinaryRequestService.getRequestById(fullRequestId);
        requestData = response.data || response;
      }

      console.log("Loading existing data:", requestData);

      // Set form fields
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
        const foundOffice = courtOffices.find(off => off.court_office_id === requestData.court_office_id);
        if (foundOffice) {
          setCourtOffice(foundOffice.court_office_id);
          setCourtLocation(foundOffice.category?.court_category_id || "");
        } else {
          setCourtOffice("");
          setCourtLocation("");
        }
      } else if (requestData.court_office) {
        // Fallback: try to find office by name
        const officeName = requestData.court_office;
        const foundOffice = courtOffices.find(off => off.name === officeName);
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
      
      setCaseFileNumber(requestData.file_number || "");
      setDisciplinaryIssue(requestData.issues?.[0]?.description || "");

      // Handle evidences
      const evidences = requestData.evidences || [];
      setExistingEvidences(evidences);

      // Separate file evidences (those with file_url or public_url)
      const fileEvidences = evidences.filter(e => e.public_url || e.file_url);
      const documentsArray = fileEvidences.map((evidence, index) => {
          const evidenceId = evidence.evidence_id || evidence.disciplinary_evidence_id;
        const fileUrl = evidence.public_url || evidence.file_url;
        const fileNameFromUrl = fileUrl ? fileUrl.split('/').pop() || `evidence-${index + 1}` : `evidence-${index + 1}`;
        
        return {
            id: evidenceId || `evidence-${index}`,
            evidence_id: evidence.evidence_id || null,
            disciplinary_evidence_id: evidence.disciplinary_evidence_id || null,
            // Store both IDs for proper tracking
            allEvidenceIds: [evidence.evidence_id, evidence.disciplinary_evidence_id].filter(Boolean),
            description: null, // File evidences should not have description
          fileUrl: fileUrl || null,
          name: fileNameFromUrl,
            type: null,
            size: 0,
            isExisting: true
          };
      });
      setSelectedFiles(documentsArray);

      // Transform witness data
      const witnessesData = (requestData.witnesses || []).map((witness, index) => ({
        id: witness.complaint_witness_id || witness.witness_id || `witness-${index}`,
        fullName: witness.witness_name || "",
        phoneNumber: witness.witness_phone_number || "",
        address: witness.witness_address || "",
        complaint_witness_id: witness.complaint_witness_id || witness.witness_id || null,
        isExisting: true
      }));
      setWitnesses(witnessesData);
      setExistingWitnesses(witnessesData);

    } catch (error) {
      console.error("Error fetching existing data:", error);
      setError(error.message || "Failed to load request data");
      toast.error(error.message || "Failed to load request data");
    } finally {
      setLoading(false);
    }
  }, [fullRequestId, existingData, courtOffices]);

  // Fetch existing data after court offices are loaded
  useEffect(() => {
    // Only fetch if we have a request ID and court offices are loaded (or loading is complete)
    if (fullRequestId && (courtOffices.length > 0 || !loadingOffices)) {
      fetchExistingData();
    }
  }, [fullRequestId, courtOffices.length, loadingOffices, fetchExistingData]);

  // Removed unnecessary customer data fetch - not needed for edit form

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
        const isDuplicate = selectedFiles.some(doc => 
          doc.name === file.name && 
          doc.size === file.size &&
          !doc.isExisting
        );
        
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
    
    // If it's an existing file, mark for removal
    if (file.isExisting) {
      const idToRemove = file.evidence_id || file.disciplinary_evidence_id || (file.allEvidenceIds && file.allEvidenceIds[0]);
      if (idToRemove) {
        setRemovedEvidenceIds((prev) => {
          // Check if already in the list
          if (!prev.includes(idToRemove)) {
            return [...prev, idToRemove];
          }
          return prev;
        });
      }
    }
    
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
        fullName: fullName,
        phoneNumber: phoneNumber,
        address: "",
        isExisting: false
      };
      setWitnesses((prev) => [...prev, newWitness]);
      setWitnessFullName("");
      setWitnessPhoneNumber("");
      setWitnessErrors({});
      setSelectedTab("Witness");
    }
  };

  const handleDeleteWitness = (id) => {
    const witness = witnesses.find(w => w.id === id);
    
    // If it's an existing witness, add to removed list
    if (witness && witness.isExisting && witness.complaint_witness_id) {
      setRemovedWitnessIds((prev) => {
        // Check if already in the list
        if (!prev.includes(witness.complaint_witness_id)) {
          return [...prev, witness.complaint_witness_id];
        }
        return prev;
      });
    }
    
    setWitnesses((prev) => prev.filter((w) => w.id !== id));
  };

  const validateAllFields = () => {
    const newErrors = {};
    
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
    
    if (!courtOffice) {
      newErrors.courtOffice = 'court office must be selected';
    }
    
    const caseFileNumberTrimmed = caseFileNumber.trim();
    if (caseFileNumberTrimmed && caseFileNumberTrimmed.length < 3) {
      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
    }
    
    if (!disciplinaryIssue || disciplinaryIssue.trim() === "") {
      newErrors.disciplinaryIssue = "Disciplinary issue description is required";
    } else if (disciplinaryIssue.trim().length < 10) {
      newErrors.disciplinaryIssue = "Description is too short";
    }
    
    if (selectedFiles.length === 0) {
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
    startLoading();
    try {
      // Get the court office name from the selected ID
      const courtOfficeName = getCourtOfficeName(courtOffice);
      
      console.log("Court Office Debug:", {
        courtLocation,
        courtOffice,
        courtOfficeName,
        availableOffices: courtLocation ? getAvailableCourtOffices() : []
      });
      
      const fd = new FormData();
      fd.append("judge_name", judgeFullName.trim() || "");
      fd.append("court_office", courtOfficeName); // Backend expects court_office as string (name)
      fd.append("court_office_id", courtOffice || ""); // Store the ID
      fd.append("file_number", caseFileNumber.trim() || "");

      // Handle issues
      const existingIssue = existingData?.issues?.[0];
      const issuesPayload = [{
        issue_id: existingIssue?.issue_id || null,
        description: disciplinaryIssue.trim() || ""
      }];
      fd.append("issues", JSON.stringify(issuesPayload));

      // Prepare evidences
      const textEvidences = [];
      const removeEvidenceIds = [...removedEvidenceIds]; // Start with already tracked removals
      const newFiles = [];

      // Process existing documents / evidences
      selectedFiles.forEach((doc) => {
        // Check if this is an existing evidence (has evidence_id or disciplinary_evidence_id)
        const evidenceId = doc.evidence_id || doc.disciplinary_evidence_id || (doc.allEvidenceIds && doc.allEvidenceIds[0]);
        
        if (evidenceId) {
          // Keep this evidence - add to textEvidences
          // For file evidences (those with file_url), description should be null
          const isFileEvidence = doc.fileUrl || (doc instanceof File);
          textEvidences.push({
            evidence_id: doc.evidence_id || doc.disciplinary_evidence_id || doc.allEvidenceIds?.[0] || null,
            description: isFileEvidence ? null : (doc.description || ""),
            file_url: doc.fileUrl || null
          });
        } else if (doc instanceof File) {
          // New file upload (not an existing evidence)
          newFiles.push(doc);
        }
      });

      // Check for removed evidences - compare all possible ID combinations
      existingEvidences.forEach(existingEvidence => {
        const evidenceId = existingEvidence.evidence_id || existingEvidence.disciplinary_evidence_id;
        if (!evidenceId) return; // Skip if no ID
        
        // Only check file evidences (not text-only evidences)
        if (!existingEvidence.file_url && !existingEvidence.public_url) {
          return; // Skip text-only evidences
        }
        
        // Check if this evidence still exists in selectedFiles by comparing all possible ID fields
        const stillExists = selectedFiles.some(doc => {
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
      console.log("Removed evidence IDs from state:", removedEvidenceIds);

      // Append evidences and removals
      fd.append("evidences", JSON.stringify(textEvidences));
      fd.append("remove_evidence_ids", JSON.stringify(removeEvidenceIds));

      // Append new files
      newFiles.forEach((doc) => {
        if (doc instanceof File) {
          fd.append("evidence", doc, doc.name || "evidence");
        }
      });

      // Check for removed witnesses - compare existing witnesses with current witnesses
      const finalRemovedWitnessIds = [...removedWitnessIds]; // Start with already tracked removals
      
      existingWitnesses.forEach(existingWitness => {
        const witnessId = existingWitness.complaint_witness_id;
        if (!witnessId) return; // Skip if no ID
        
        // Check if this witness still exists in current witnesses
        const stillExists = witnesses.some(w => {
          return w.complaint_witness_id === witnessId || w.id === witnessId;
        });
        
        // If witness doesn't exist anymore, mark for removal
        if (!stillExists && !finalRemovedWitnessIds.includes(witnessId)) {
          finalRemovedWitnessIds.push(witnessId);
          console.log("Tracking removed witness:", witnessId, existingWitness);
        }
      });
      
      console.log("Removed witness IDs to send:", finalRemovedWitnessIds);
      console.log("Removed witness IDs from state:", removedWitnessIds);

      // Handle witnesses
      if (witnesses && witnesses.length > 0) {
        const witnessData = witnesses.map((w) => ({
          witness_name: w.fullName || "",
          witness_address: w.address || "",
          witness_phone_number: w.phoneNumber || "",
          ...(w.complaint_witness_id && { complaint_witness_id: String(w.complaint_witness_id) })
        }));
        fd.append("witnesses", JSON.stringify(witnessData));
      }

      // Handle removal of witnesses
      if (finalRemovedWitnessIds.length > 0) {
        fd.append("remove_witness_ids", JSON.stringify(finalRemovedWitnessIds));
      }

      const result = await DisciplinaryRequestService.updateRequest(fullRequestId, fd);

      console.log("Updated:", result);
      
      setShowTermsModal(false);
      setIsSubmitting(false);
      stopLoading();
      
      navigate("/home/requests", { 
        state: { 
          showSuccessSnack: true,
          successMessage: "Your disciplinary report is updated successfully"
        } 
      });
    } catch (err) {
      console.error("Update error:", err);
      setIsSubmitting(false);
      stopLoading();
      
      setShowTermsModal(false);
      
      setTimeout(() => {
        toast.error("Failed to update your disciplinary report", {
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
    navigate("/home/requests");
  };

  const handleViewFile = async (file) => {
    if (!file) {
      toast.error("No file provided");
      return;
    }

    try {
      setPreviewLoading(true);
      
      // Determine file URL and extension
      let fileUrl = null;
      let fileExtension = null;
      let fileName = null;
      
      // Find the index of the file in selectedFiles to determine evidence number
      const fileIndex = selectedFiles.findIndex(f => {
        if (file.isExisting) {
          return (f.id === file.id) || 
                 (f.evidence_id === file.evidence_id) || 
                 (f.disciplinary_evidence_id === file.disciplinary_evidence_id) ||
                 (f.allEvidenceIds && file.allEvidenceIds && 
                  f.allEvidenceIds.some(id => file.allEvidenceIds.includes(id)));
        } else {
          return f === file || (f.name === file.name && f.size === file.size);
        }
      });
      const evidenceNumber = fileIndex !== -1 ? fileIndex + 1 : 1;
      const evidenceTitle = `Evidence ${evidenceNumber}`;
      
      if (file.isExisting && file.fileUrl) {
        // Existing file from server
        fileUrl = file.fileUrl.startsWith('http') 
          ? file.fileUrl 
          : `${DOCUMENT_URL}${file.fileUrl.startsWith('/') ? '' : '/'}${file.fileUrl}`;
        fileName = file.name || fileUrl.split('/').pop() || 'document';
        fileExtension = fileName.split('.').pop()?.toLowerCase();
      } else if (file instanceof File) {
        // New file upload
        fileUrl = URL.createObjectURL(file);
        fileName = file.name;
        fileExtension = fileName.split('.').pop()?.toLowerCase();
      } else {
        toast.error("Invalid file");
        setPreviewLoading(false);
        return;
      }

      // Check if file is previewable
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf';
      const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(fileExtension);
      const isAudio = ['mp3', 'mpeg', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'm4b', 'm4p'].includes(fileExtension);
      
      if (isImage || isPdf || isVideo || isAudio) {
        // Previewable files - show in modal
        if (file.isExisting && file.fileUrl) {
          // For existing files, fetch and create File object for modal
          try {
            const response = await fetch(fileUrl, {
              method: 'GET',
              headers: {
                'Accept': '*/*',
              },
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream';
            const fileObj = new File([blob], fileName, { type: contentType });
            
            setPreviewModal({ isOpen: true, file: fileObj, title: evidenceTitle });
            setPreviewLoading(false);
          } catch (error) {
            console.error("Error fetching file for preview:", error);
            // Fallback to direct URL
            setPreviewModal({ isOpen: true, file: fileUrl, title: evidenceTitle });
            setPreviewLoading(false);
          }
        } else {
          // New file - use directly
          setPreviewModal({ isOpen: true, file, title: evidenceTitle });
          setPreviewLoading(false);
        }
      } else {
        // Non-previewable files - download
        if (file.isExisting && file.fileUrl) {
          // Download existing file
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setPreviewLoading(false);
        } else if (file instanceof File) {
          // Download new file
          const link = document.createElement('a');
          link.href = URL.createObjectURL(file);
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/home/requests")}
            className="px-4 py-2 bg-primary text-white rounded hover:opacity-90"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-[clamp(32px,2.22vh,32px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(32px,1.67vw,32px)] lg:px-[clamp(48px,2.5vw,48px)]">
      <div className="justify-center flex flex-col lg:flex-row lg:items-start gap-[clamp(24px,1.67vh,24px)]">
        {/* Left card (approx. 1326 x 1098) */}
        <div 
          ref={leftCardRef}
          className="max-w-[clamp(320px,69.06vw,1326px)] mx-auto lg:mx-0 lg:flex-1 max-h-[885px] rounded-xl bg-[#FFFFFF] backdrop-blur-lg overflow-auto pb-[clamp(20px,2vh,32px)] mb-[clamp(24px,1.67vh,24px)] lg:mb-0"
        >
          {/* Left card header & subtitle (20px from top, 49px from left) */}
          <div className="mt-[clamp(24px,2.78vh,30px)] ml-[clamp(16px,2.55vw,49px)]">
            <div className="flex items-center gap-[clamp(16px,2.08vw,16px)]">
            <button
                onClick={handleBack}
                className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity bg-[#eaeaee] p-[clamp(8px,0.83vw,8px)] rounded-md"
              >
                <FaLessThan className="text-[#2C2C2C] text-[clamp(16px,1.25vw,24px)]" />
              </button>
            <h2
                className="leading-none tracking-normal text-[#2C2C2C] font-['Montserrat'] font-semibold text-[clamp(18px,1.25vw,24px)]"
                style={{ 
                  fontFamily: "'Montserrat', sans-serif",
                  lineHeight: '100%',
                  letterSpacing: '0%'
                }}
            >
                Edit Disciplinary Report
            </h2>
            </div>
            {/* <p
              className="mt-1 font-['Montserrat'] font-normal text-base leading-none tracking-normal text-[#959595]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Edit your disciplinary Report
            </p> */}
          </div>

          {/* Internal separator line under header block */}
          <div className="mt-[clamp(20px,1.85vh,20px)] border-t border-[#CFCFCF]" />

          <div className="ml-[clamp(16px,2.55vw,49px)] mt-[clamp(36px,3.33vh,36px)] mr-[clamp(16px,9.17vw,176px)] ">
            <h3
              className="leading-none tracking-normal font-['Montserrat'] font-semibold text-[clamp(18px,1.25vw,24px)] text-[#215167]"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              Judge Information
            </h3>

            {/* Form fields in 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,2.78vh,24px)]">
              {/* Judge Full Name */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Full Name <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#FF4C4C]" style={{ fontFamily: "'Montserrat', sans-serif" }}>*</span>
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
                  className={`w-full max-w-[clamp(280px,41.67vw,320px)] h-[clamp(40px,3.7vh,48px)] rounded-md px-[clamp(16px,2.08vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
                    formErrors.judgeFullName ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.judgeFullName ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.judgeFullName && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
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
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Category <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#FF4C4C]" style={{ fontFamily: "'Montserrat', sans-serif" }}>*</span>
                </label>
                <div className="relative w-full max-w-[clamp(280px,41.67vw,320px)]">
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
                    disabled={loadingCategories}
                    className={`w-full h-[clamp(40px,3.7vh,48px)] rounded-md pl-[clamp(16px,2.08vw,16px)] pr-[clamp(40px,5.21vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none ${
                      loadingCategories ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                  >
                    <option value="" disabled className="text-[#BCBCBC]">
                      {loadingCategories ? "Loading categories..." : "Select Court Category"}
                    </option>
                    {courtCategories.map((category) => (
                      <option key={category.court_category_id} value={category.court_category_id} className="text-[#747171]">
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <MdArrowDropDown 
                    className="absolute right-[clamp(12px,1.56vw,12px)] top-1/2 -translate-y-1/2 w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] text-[#949494] pointer-events-none" 
                  />
                </div>
              </div>

              {/* Court Office */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Court Office <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#FF4C4C]" style={{ fontFamily: "'Montserrat', sans-serif" }}>*</span>
                </label>
                <div className="relative w-full max-w-[clamp(280px,41.67vw,320px)]">
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
                    disabled={!courtLocation || loadingOffices}
                    className={`w-full h-[clamp(40px,3.7vh,48px)] rounded-md pl-[clamp(16px,2.08vw,16px)] pr-[clamp(40px,5.21vw,40px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal outline-none appearance-none ${
                      !courtLocation || loadingOffices ? "cursor-not-allowed" : "cursor-pointer"
                    } ${formErrors.courtOffice ? "border-red-500" : ""} text-[#393838]`}
                    style={{ 
                      fontFamily: "'Montserrat', sans-serif",
                      background: '#F9F9F9',
                      border: formErrors.courtOffice ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                    }}
                  >
                    <option value="" disabled className="text-[#BCBCBC]">
                      {loadingOffices 
                        ? "Loading offices..." 
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
                    className="absolute right-[clamp(12px,1.56vw,12px)] top-1/2 -translate-y-1/2 w-[clamp(20px,1.25vw,24px)] h-[clamp(20px,1.25vw,24px)] text-[#949494] pointer-events-none" 
                  />
                </div>
                <div className="min-h-0 mt-0">
                  {formErrors.courtOffice && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.courtOffice}
                    </span>
                  )}
                </div>
              </div>

              {/* Case File Number */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Case File Number <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#747171]" style={{ fontFamily: "'Montserrat', sans-serif" }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={caseFileNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCaseFileNumber(value);
                    
                    const newErrors = { ...formErrors };
                    const trimmedValue = value.trim();
                    if (trimmedValue && trimmedValue.length < 3) {
                      newErrors.caseFileNumber = 'Case file number should be at least 3 characters';
                    } else {
                      delete newErrors.caseFileNumber;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("caseFileNumber")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter File Number"
                  className={`w-full max-w-[clamp(280px,41.67vw,320px)] h-[clamp(40px,3.7vh,48px)] rounded-md px-[clamp(16px,2.08vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
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
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.caseFileNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Disciplinary Issue and Evidence Attachment in 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,2.78vh,24px)]">
              {/* Disciplinary Issue */}
              <div className="flex flex-col flex-1">
                <label
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Disciplinary Issue <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#FF4C4C]" style={{ fontFamily: "'Montserrat', sans-serif" }}>*</span>
                </label>
                <textarea
                  value={disciplinaryIssue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisciplinaryIssue(value);
                    
                    const newErrors = { ...formErrors };
                    if (!value || value.trim() === "") {
                      newErrors.disciplinaryIssue = "Disciplinary issue description is required";
                    } else if (value.trim().length < 10) {
                      newErrors.disciplinaryIssue = "Description is too short";
                    } else {
                      delete newErrors.disciplinaryIssue;
                    }
                    setFormErrors(newErrors);
                  }}
                  onFocus={() => setFocusedField("disciplinaryIssue")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Eg. details here"
                  className={`w-full h-[clamp(96px,7.41vh,112px)] rounded-md p-[clamp(16px,2.08vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none resize-none ${
                    formErrors.disciplinaryIssue ? "border-red-500" : ""
                  } text-[#393838]`}
                  style={{ 
                    fontFamily: "'Montserrat', sans-serif",
                    background: '#F9F9F9',
                    border: formErrors.disciplinaryIssue ? '1px solid #ef4444' : '0.5px solid var(--Stroke-Fjacs, #0000004D)'
                  }}
                />
                <div className="min-h-0 mt-0">
                  {formErrors.disciplinaryIssue && (
                    <span
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formErrors.disciplinaryIssue}
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence Attachment */}
              <div className="flex flex-col flex-1">
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
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full max-w-[clamp(320px,33.33vw,576px)] h-[clamp(80px,7.41vh,96px)] md:h-[clamp(96px,8.33vh,112px)] rounded-lg border-x-[clamp(1px,0.1vw,2px)] border-y-[clamp(1px,0.1vh,2px)] border-dashed border-[#1E5166] bg-[#F2F2F2] flex flex-col items-center justify-center gap-[clamp(8px,0.42vw,8px)] py-[clamp(10px,0.69vh,10px)] px-[clamp(16px,0.83vw,16px)] md:px-[clamp(24px,1.25vw,24px)] cursor-pointer hover:bg-[#E8E8E8] transition-colors"
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
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'} selected. Click to add more`
                      : 'Upload Files (PDF, DOC, Images, Video, Audio)'
                    }
                  </span>
                </div>
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
              className="mt-[clamp(24px,2.78vh,24px)] leading-none tracking-normal font-['Montserrat'] font-semibold text-[clamp(18px,1.25vw,24px)] text-[#215167]"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                lineHeight: '100%',
                letterSpacing: '0%'
              }}
            >
              Witness Information <span className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#747171]" style={{ fontFamily: "'Montserrat', sans-serif" }}>(Optional)</span>
            </h3>

            {/* Witness Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(20px,1.3vw,25px)] mt-[clamp(24px,2.78vh,24px)]">
              {/* Full Name */}
              <div className="flex flex-col">
                <label
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
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
                  className={`w-full max-w-[clamp(280px,41.67vw,320px)] h-[clamp(40px,3.7vh,48px)] rounded-md px-[clamp(16px,2.08vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
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
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
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
                  className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838]"
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
                  className={`w-full max-w-[clamp(280px,41.67vw,320px)] h-[clamp(40px,3.7vh,48px)] rounded-md px-[clamp(16px,2.08vw,16px)] font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal placeholder:text-[#BCBCBC] outline-none ${
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
                      className="font-['Montserrat'] font-normal text-[clamp(10px,0.69vw,12px)] leading-none tracking-normal text-red-500"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {witnessErrors.phoneNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <div className="flex flex-col">
                <label className="mb-[clamp(8px,0.74vh,8px)] font-['Montserrat'] font-medium text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#393838] opacity-0" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Action
                </label>
              <button
                type="button"
                onClick={handleAddWitness}
                className="w-[clamp(60px,4.17vw,80px)] h-[clamp(40px,3.7vh,48px)] rounded-lg bg-[#215167] flex items-center justify-center gap-[clamp(8px,0.52vw,10px)] py-[clamp(10px,0.93vh,10px)] px-[clamp(6px,0.78vw,6px)] hover:bg-[#1a4050] transition-colors"
              >
                <PlusIcon className="w-[clamp(16px,1.04vw,20px)] h-[clamp(16px,1.04vw,20px)] text-white" />
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
            <div className="flex flex-col sm:flex-row justify-end gap-[clamp(10px,0.65vw,10px)] mt-[clamp(48px,4.44vh,56px)]">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-[clamp(160px,10vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg border border-[#9CA2AB] flex items-center justify-center px-[clamp(24px,1.67vw,32px)] sm:px-[clamp(24px,5.83vw,112px)] py-[clamp(16px,1.48vh,16px)] hover:bg-gray-50 transition-colors"
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
                className={`w-full sm:w-[clamp(160px,10vw,192px)] h-[clamp(48px,4.44vh,56px)] rounded-lg bg-[#215167] flex items-center justify-center px-[clamp(24px,1.67vw,32px)] sm:px-[clamp(24px,5.83vw,112px)] py-[clamp(16px,1.48vh,16px)] hover:bg-[#1a4050] transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span
                    className="font-['Montserrat'] font-semibold text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-white flex items-center gap-[clamp(8px,1.04vw,8px)]"
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

        {/* Right card (476 x 885) */}
        <div
          className="hidden lg:block lg:sticky lg:top-[clamp(112px,12.96vh,148px)] rounded-xl border bg-[#FFFFFF] w-[clamp(280px,24.79vw,476px)] h-[clamp(600px,69.44vh,750px)] overflow-hidden"
        >
          {/* Button Group */}
          <div className="mt-[clamp(20px,1.85vh,20px)] ml-[clamp(16px,3.33vw,16px)]">
            <div className="w-full max-w-[clamp(280px,19.27vw,370px)] h-[clamp(40px,3.7vh,48px)] rounded-md border border-[#CCCCCC] bg-white p-[clamp(4px,0.52vw,4px)] flex gap-[clamp(4px,0.52vw,4px)]">
              {/* Files Button */}
              <button
                type="button"
                onClick={() => setSelectedTab("Files")}
                className={`h-[clamp(32px,2.96vh,40px)] rounded flex-1 p-[clamp(8px,0.65vw,10px)] flex items-center justify-center font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-center transition-all ${
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
                className={`h-[clamp(32px,2.96vh,40px)] rounded flex-1 p-[clamp(8px,0.65vw,10px)] flex items-center justify-center font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-center transition-all ${
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
          <div className="mt-[clamp(12px,1.11vh,12px)] border-t border-[#CFCFCF]" />

          {/* Files Content */}
          {selectedTab === "Files" && (
            <div className="mt-[clamp(24px,2.78vh,24px)] p-[clamp(16px,2.6vw,20px)] flex flex-col gap-[clamp(8px,0.74vh,8px)]">
              {selectedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[clamp(300px,37.04vh,400px)]">
                  <FaRegFile className="w-[clamp(40px,2.5vw,48px)] h-[clamp(40px,2.5vw,48px)] text-[#949494] mb-[clamp(12px,1.11vh,12px)]" />
                  <span
                    className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    No files uploaded yet
                  </span>
                </div>
              ) : (
                selectedFiles.map((file, index) => {
                  // Get file name - handle both existing files and new File objects
                  const fileName = file.name || (file instanceof File ? file.name : `Evidence ${index + 1}`);
                  
                  return (
                    <div key={file.id || file.evidence_id || file.disciplinary_evidence_id || index} className="w-full h-[clamp(48px,4.44vh,64px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(16px,1.85vh,20px)] px-[clamp(16px,2.08vw,16px)]">
                      <div className="flex items-center flex-1">
                        <div className="w-[clamp(40px,2.5vw,48px)] h-[clamp(40px,2.5vw,48px)] rounded flex items-center justify-center flex-shrink-0 relative">
                          <FaFileAlt className="w-[clamp(20px,1.25vw,24px)] h-[clamp(28px,1.85vh,32px)] text-[#215167] absolute top-[clamp(8px,0.74vh,8px)] left-[clamp(12px,1.56vw,12px)]" />
                        </div>
                        
                        <div className="flex flex-col flex-1 ml-[clamp(16px,2.08vw,16px)] min-w-0">
                          <span
                            className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#0A1D39]"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                            title={fileName}
                          >
                            {fileName.length > 15 ? `${fileName.substring(0, 15)}...` : fileName}
                          </span>
                          <span
                            className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494] mt-[clamp(4px,0.37vh,4px)]"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {file.isExisting ? 'Existing file' : formatFileSize(file.size || (file instanceof File ? file.size : 0))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-[clamp(8px,1.04vw,8px)] ml-[clamp(16px,2.08vw,16px)]">
                        <button
                          type="button"
                          onClick={() => handleViewFile(file)}
                          disabled={previewLoading}
                          className="w-[clamp(16px,1.04vw,20px)] h-[clamp(14px,0.93vh,16px)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                          title="View/Download file"
                        >
                          {previewLoading ? (
                            <div className="animate-spin rounded-full h-[clamp(14px,0.83vw,16px)] w-[clamp(14px,0.83vw,16px)] border-b-2 border-[#215167]"></div>
                          ) : (
                            <EyeIcon className="w-[clamp(20px,1.25vw,24px)] h-[clamp(18px,1.11vh,20px)] text-[#215167]" />
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
                  );
                })
              )}
            </div>
          )}

          {/* Witness Content */}
          {selectedTab === "Witness" && (
            <div className="mt-[clamp(24px,2.78vh,24px)] p-[clamp(16px,2.6vw,20px)] flex flex-col gap-[clamp(8px,0.74vh,8px)]">
              {witnesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[clamp(300px,37.04vh,400px)]">
                  <CiUser className="w-[clamp(40px,2.5vw,48px)] h-[clamp(40px,2.5vw,48px)] text-[#949494] mb-[clamp(12px,1.11vh,12px)]" />
                  <span
                    className="font-['Montserrat'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    No witnesses added yet
                  </span>
                </div>
              ) : (
                witnesses.map((witness) => (
                  <div key={witness.id} className="w-full h-[clamp(48px,4.44vh,64px)] rounded-lg bg-[#E8EEFD] flex items-center justify-between py-[clamp(16px,1.85vh,20px)] px-[clamp(16px,2.08vw,16px)]">
                    <div className="flex items-center flex-1">
                      <div 
                        className="w-[clamp(40px,2.5vw,48px)] h-[clamp(40px,2.5vw,48px)] rounded-lg flex items-center justify-center flex-shrink-0 relative"
                        style={{ backgroundColor: 'rgba(65, 111, 228, 0.18)' }}
                      >
                        <UserIcon 
                          className="w-[clamp(18px,1.04vw,20px)] h-[clamp(20px,1.11vh,24px)] text-[#4475F2] absolute top-[clamp(10px,0.93vh,12px)] left-[clamp(14px,1.56vw,16px)] opacity-30" 
                        />
                      </div>
                      
                      <div className="flex flex-col flex-1 ml-[clamp(16px,2.08vw,16px)]">
                        <span
                          className="font-['Montserrat'] font-normal text-[clamp(14px,0.83vw,16px)] leading-none tracking-normal text-[#0A1D39]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {witness.fullName || witness.name}
                        </span>
                        <span
                          className="font-['Pretendard'] font-normal text-[clamp(12px,0.73vw,14px)] leading-none tracking-normal text-[#949494] mt-[clamp(4px,0.37vh,4px)]"
                          style={{ fontFamily: "'Pretendard', sans-serif" }}
                        >
                          {witness.phoneNumber || witness.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-[clamp(8px,1.04vw,8px)] ml-[clamp(16px,2.08vw,16px)]">
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
        requestType="disciplinary case request"
      />

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
          title={previewModal.title}
          customStyle={true}
        />
      )}

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
    </div>
  );
};

export default NewEditDisciplinary;
