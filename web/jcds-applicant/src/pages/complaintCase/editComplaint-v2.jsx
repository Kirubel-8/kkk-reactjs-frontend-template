import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Typography, Input } from "@material-tailwind/react";
import {
  XMarkIcon,
  PlusIcon
} from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import ComplaintDescriptionForm from "./steps/complaintDescriptionForm";
import DocumentsStep from "./steps/DocumentsStep";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import complaintService from "@/service/complaint.service";
import customerAuthService from "@/service/customer-auth.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";

const EditComplaintV2 = () => {
    const { complaintId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { startLoading, stopLoading } = useLoading();
    
    const judgeInfoRef = useRef();
    const descriptionRef = useRef();
    const documentsRef = useRef();
    const [formData, setFormData] = useState({
        judgeInfo: {},
        description: {},
        witnessInfo: { witnesses: [], currentWitness: { fullName: "", phoneNumber: "" } },
        documents: []
    });
    const [applicantInfo, setApplicantInfo] = useState({
        fullName: "",
        phoneNumber: "",
        gender: ""
    });
    const [witnessErrors, setWitnessErrors] = useState({});
    const [removedWitnessIds, setRemovedWitnessIds] = useState([]);
    const [removedEvidenceIds, setRemovedEvidenceIds] = useState([]);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [existingEvidences, setExistingEvidences] = useState([]);
    const [initialWitnessIds, setInitialWitnessIds] = useState(new Set());

    // Get the full request ID from location state
    const fullRequestId = location.state?.fullRequestId || complaintId;
    const existingData = location.state?.requestData;

    const logo = "/jcdms-applicant/img/Courts-logo.png";

    // Validate all required fields
    const validateAllFields = () => {
        const judgeValid = judgeInfoRef.current ? judgeInfoRef.current.validateAllFields() : false;
        const descValid = descriptionRef.current ? descriptionRef.current.validateAllFields() : false;
        const docsValid = documentsRef.current ? documentsRef.current.validateAllFields() : false;
        return judgeValid && descValid && docsValid;
    };

    // Fetch customer data on component mount
    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                const customerAccountToken = localStorage.getItem("customerAccountToken");
                if (customerAccountToken) {
                    const decodedToken = jwtDecode(customerAccountToken);
                    const customerId = decodedToken.id;
                    
                    const response = await customerAuthService.getCustomerById(customerId);
                    const customerData = response.data || response;
                    
                    // Update applicantInfo with fetched customer information
                    setApplicantInfo({
                        fullName: customerData.full_name || "",
                        phoneNumber: customerData.phone_number || "",
                        gender: customerData.gender || ""
                    });
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
                    const response = await complaintService.getComplaintById(fullRequestId);
                    requestData = response.data || response;
                }

                console.log("Loading existing complaint data:", requestData);

                // Store existing evidences for tracking removals
                const evidences = requestData.evidences || [];
                setExistingEvidences(evidences);

                // Transform API data to form data structure
                const transformedData = {
                    judgeInfo: {
                        judgeFullName: requestData.judge_name || "",
                        servingPlace: requestData.judge_court || "",
                        caseFileNumber: requestData.case_file_number || "",
                        incidentDate: requestData.act_date || "",
                        caseType: requestData.case_type || "",
                        region: requestData.complainant_address || ""
                    },
                    description: {
                        description: requestData.detailed_description || "",
                        damageDescription: requestData.damage_description || "",
                        additionalExplanation: requestData.additional_explanation || ""
                    },
                    witnessInfo: {
                        witnesses: (requestData.witnesses || []).map((witness, index) => ({
                            id: witness.complaint_witness_id || `witness-${index}`,
                            fullName: witness.witness_name || "",
                            phoneNumber: witness.witness_phone_number || "",
                            complaint_witness_id: witness.complaint_witness_id || null,
                            witness_id: witness.complaint_witness_id || null, // Also store as witness_id for consistency
                            signature: witness.witness_signature ? (witness.witness_signature.startsWith('http') 
                                ? witness.witness_signature 
                                : `${DOCUMENT_URL}${witness.witness_signature.startsWith('/') ? '' : '/'}${witness.witness_signature}`) : null
                        })),
                        currentWitness: { fullName: "", phoneNumber: "" }
                    },
                    documents: {
                        documents: await Promise.all(
                            (requestData.evidences || []).map(async (evidence, index) => {
                                const evidenceId = evidence.complaint_evidence_id;
                                let fileInfo = {
                                    id: evidenceId || `evidence-${index}`,
                                    evidence_id: evidence.complaint_evidence_id || null,
                                    complaint_evidence_id: evidence.complaint_evidence_id || null,
                                    allEvidenceIds: [evidence.complaint_evidence_id].filter(Boolean),
                                    description: evidence.description || "",
                                    fileUrl: evidence.public_url || evidence.file_url || null,
                                    name: evidence.description || `evidence-${index + 1}`,
                                    type: evidence.file_type || null,
                                    size: 0,
                                    isExisting: true
                                };

                                // If there's a file URL, try to get file info
                                if (evidence.public_url || evidence.file_url) {
                                    try {
                                        const fileUrl = evidence.public_url || evidence.file_url;
                                        const fullUrl = fileUrl.startsWith('http') 
                                            ? fileUrl 
                                            : `${DOCUMENT_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                                        
                                        // Fetch file headers to get size and type
                                        const response = await fetch(fullUrl, { method: 'HEAD' });
                                        if (response.ok) {
                                            const fileNameFromUrl = fileUrl.split('/').pop() || `evidence-${index + 1}`;
                                            const fileSize = parseInt(response.headers.get('content-length') || '0');
                                            const fileType = response.headers.get('content-type') || evidence.file_type || 'application/octet-stream';
                                        
                                            fileInfo = {
                                                ...fileInfo,
                                                name: evidence.description || fileNameFromUrl,
                                                size: fileSize,
                                                type: fileType
                                            };
                                        }
                                        
                                    } catch (error) {
                                        console.warn(`Failed to fetch file info for ${evidence.public_url || evidence.file_url}:`, error);
                                        // Fallback to URL-based filename
                                        const fileUrl = evidence.public_url || evidence.file_url;
                                        fileInfo.name = evidence.description || fileUrl.split('/').pop() || `evidence-${index + 1}`;
                                    }
                                }

                                return fileInfo;
                            })
                        ),
                        damageDescription: requestData.additional_explanation || "",
                        signature: null
                    }
                };

                setFormData(transformedData);
                
                // Store initial witness IDs for tracking removals
                const initialWitnessIdSet = new Set();
                (transformedData.witnessInfo.witnesses || []).forEach(w => {
                    const id = w.complaint_witness_id || w.witness_id;
                    if (id) initialWitnessIdSet.add(id);
                });
                setInitialWitnessIds(initialWitnessIdSet);
                
                console.log("Transformed form data:", transformedData);
                console.log("Initial witness IDs:", Array.from(initialWitnessIdSet));
            } catch (error) {
                console.error("Error loading existing data:", error);
                setError(error.message || "Failed to load complaint data");
                toast.error("Failed to load complaint data");
            } finally {
                setLoading(false);
                stopLoading();
            }
        };

        if (fullRequestId) {
            loadExistingData();
        } else {
            setError("No complaint ID provided");
            setLoading(false);
            stopLoading();
        }
    }, [fullRequestId, existingData, stopLoading]);


    const handleFormDataChange = (stepName, data) => {
        console.log(`handleFormDataChange: ${stepName}`, data);
        setFormData(prev => {
            const newFormData = {
                ...prev,
                [stepName]: data
            };
            console.log("Updated formData:", newFormData);
            return newFormData;
        });
    };

    const handleRemoveWitness = (witnessId) => {
        if (witnessId) {
            setRemovedWitnessIds(prev => [...prev, witnessId]);
        }
        // Also remove from witnessInfo
        if (formData.witnessInfo?.witnesses) {
            const updatedWitnesses = formData.witnessInfo.witnesses.filter(w => 
                w.complaint_witness_id !== witnessId && w.witness_id !== witnessId
            );
            handleFormDataChange('witnessInfo', {
                ...formData.witnessInfo,
                witnesses: updatedWitnesses
            });
        }
    };

    const handleRemoveEvidence = (evidenceId) => {
        if (evidenceId) {
            setRemovedEvidenceIds(prev => {
                // Avoid duplicates
                if (!prev.includes(evidenceId)) {
                    return [...prev, evidenceId];
                }
                return prev;
            });
            console.log("Tracking removed evidence ID:", evidenceId);
        }
    };

    const handleSubmit = () => {
        if (validateAllFields() && !isSubmitting) {
        setShowTermsModal(true);
        }
    };

    const handleTermsAccept = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            startLoading();
            
            const judgeInfo = formData.judgeInfo || {};
            const description = formData.description || {};
            const witnessInfo = formData.witnessInfo || {};
            const docsObj = formData.documents || {};
            const documentsArray = Array.isArray(docsObj) ? docsObj : docsObj.documents || [];

            console.log("Form data being submitted:", {
                judgeInfo,
                description,
                witnessInfo,
                documents: docsObj,
                removedWitnessIds,
                removedEvidenceIds
            });

            const fd = new FormData();
            
            // Map judge information
            fd.append("judge_name", judgeInfo.judgeFullName || "");
            fd.append("judge_court", judgeInfo.servingPlace || "");
            fd.append("case_file_number", judgeInfo.caseFileNumber || "");
            fd.append("case_type", judgeInfo.caseType || "");
            fd.append("act_date", judgeInfo.incidentDate || "");
            fd.append("complainant_address", judgeInfo.region || "");
            fd.append("detailed_description", description.description || "");
            fd.append("damage_description", description.damageDescription || "");
            fd.append("additional_explanation", docsObj.damageDescription || description.additionalExplanation || "");

            // Map witness information and track removals
            const witnesses = witnessInfo.witnesses || [];
            const currentWitnessIds = new Set();
            const witnessData = [];
            
            // Process current witnesses
            witnesses.forEach(w => {
                const witnessId = w.complaint_witness_id || w.witness_id;
                if (witnessId) {
                    currentWitnessIds.add(witnessId);
                }
                
                witnessData.push({
                    witness_name: w.fullName,
                    witness_phone_number: w.phoneNumber || "",
                    ...(w.complaint_witness_id && { complaint_witness_id: String(w.complaint_witness_id) })
                });
            });
            
            if (witnessData.length > 0) {
                fd.append("witnesses", JSON.stringify(witnessData));
            }

            // Handle witness signatures - only new files
            witnesses.forEach((witness) => {
                if (witness.signature && witness.signature instanceof File) {
                    fd.append("witness_signatures", witness.signature);
                }
            });

            // Check for removed witnesses by comparing with initial witness data
            // Use the stored initialWitnessIds Set
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
            // Start with the IDs that were tracked when user clicked remove
            const removeEvidenceIds = [...removedEvidenceIds];
            const newFiles = [];
            
            // First, collect all existing evidence IDs that are still present in documentsArray
            const currentEvidenceIds = new Set();
            
            // Process current documents / evidences
            documentsArray.forEach((doc) => {
                // Check if this is an existing evidence (has an ID)
                const evidenceId = doc.evidence_id || doc.complaint_evidence_id || (doc.allEvidenceIds && doc.allEvidenceIds[0]);
                
                if (evidenceId) {
                    // This is an existing evidence that's still present
                    // Add all possible IDs to the set for tracking
                    if (doc.evidence_id) currentEvidenceIds.add(doc.evidence_id);
                    if (doc.complaint_evidence_id) currentEvidenceIds.add(doc.complaint_evidence_id);
                    if (doc.allEvidenceIds && doc.allEvidenceIds.length > 0) {
                        doc.allEvidenceIds.forEach(id => {
                            if (id) currentEvidenceIds.add(id);
                        });
                    }
                    if (doc.id) currentEvidenceIds.add(doc.id);
                    // Existing evidences that are kept don't need to be sent to backend
                } else if (doc.file) {
                    // New file upload (no ID means it's new)
                    newFiles.push(doc);
                }
            });

            // Now check for removed evidences by comparing existingEvidences with current documents
            // This catches any removals that weren't tracked via handleRemoveEvidence
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
                
                // Check if this evidence ID is still in the current documents
                // We check all possible ID fields to be thorough
                const stillExists = 
                    currentEvidenceIds.has(existingEvidence.complaint_evidence_id) ||
                    (existingEvidence.evidence_id && currentEvidenceIds.has(existingEvidence.evidence_id)) ||
                    documentsArray.some(doc => {
                        // Double-check by comparing all possible ID fields
                        return (
                            (doc.evidence_id === existingEvidence.complaint_evidence_id) ||
                            (doc.complaint_evidence_id === existingEvidence.complaint_evidence_id) ||
                            (doc.id === existingEvidence.complaint_evidence_id) ||
                            (doc.allEvidenceIds && doc.allEvidenceIds.includes(existingEvidence.complaint_evidence_id)) ||
                            (existingEvidence.evidence_id && (
                                doc.evidence_id === existingEvidence.evidence_id ||
                                doc.complaint_evidence_id === existingEvidence.evidence_id ||
                                doc.id === existingEvidence.evidence_id ||
                                (doc.allEvidenceIds && doc.allEvidenceIds.includes(existingEvidence.evidence_id))
                            ))
                        );
                    });
                
                // If evidence doesn't exist in current documents, mark for removal
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

            // Handle evidence files - only append new files (like editComplaint.jsx)
            if (newFiles.length > 0) {
                newFiles.forEach((d) => {
                    if (d.file) {
                    fd.append("evidence_files", d.file);
                    if (d.description) {
                        fd.append("evidence_descriptions", d.description);
                        }
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
                    successMessage: "successfully updated"
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
                toast.error("failed to update", {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <Typography variant="h6" color="gray">
                        Loading complaint data...
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
                        Error loading complaint data
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
                        Edit Complaint
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-primary">
                        Complaint ID: #{fullRequestId?.toString().slice(0, 8) || complaintId}
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
                <Card className="p-4 sm:p-5 lg:p-6 shadow-lg border border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left Side - Judge Info & Complaint Description */}
                        <div className="flex flex-col pr-0 lg:pr-6 border-r-0 lg:border-r border-gray-300">
                            <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                                Judge/Case Information
                            </Typography>
                            
                            <div className="mb-6">
                                <JudgeInfoStep
                                    ref={judgeInfoRef}
                                    data={formData.judgeInfo}
                                    onChange={(data) => handleFormDataChange('judgeInfo', data)}
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                                    Complaint Description
                                </Typography>
                                <ComplaintDescriptionForm
                                    ref={descriptionRef}
                                    formData={formData.description}
                                    onChange={(data) => handleFormDataChange('description', data)}
                                />
                          </div>
                        </div>

                        {/* Right Side - Evidence Attachments & Witness Information */}
                        <div className="flex flex-col pl-0 lg:pl-6">
                            <div className="mb-6">
                                <Typography variant="h5" className="text-primary font-bold mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-gray-200 text-lg sm:text-xl">
                                    Evidence
                                </Typography>
                                
                                <div className="max-h-[300px] overflow-y-auto pr-1">
                                    <DocumentsStep
                                        ref={documentsRef}
                                        data={formData.documents}
                                        onChange={(data) => handleFormDataChange('documents', data)}
                                        onRemoveEvidence={handleRemoveEvidence}
                                        hideAdditionalExplanation={true}
                                    />
                </div>
            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 flex-1 flex flex-col min-h-[400px]">
                                <Typography variant="h5" className="text-primary font-bold mb-3 sm:mb-4 pb-2 border-b border-gray-200 text-base sm:text-lg">
                                    Witness Information <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                                </Typography>
                                
                                <div className="flex flex-col space-y-3 flex-1">
                                    {/* Add Witness Form */}
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                                            <div className="flex-1 max-w-[250px] min-h-[70px]">
                                                <Typography variant="small" className="text-primary mb-1 font-semibold text-sm">
                                                    Full Name 
                                                </Typography>
                                                <Input
                                                    placeholder="Enter witness full name"
                                                    value={formData.witnessInfo?.currentWitness?.fullName || ""}
                                                    onChange={(e) => {
                                                        const currentWitness = formData.witnessInfo?.currentWitness || {};
                                                        const value = e.target.value;
                                                        handleFormDataChange('witnessInfo', {
                                                            ...formData.witnessInfo,
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
                                                    className={`w-full max-w-[250px] text-sm ${witnessErrors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
                                                    containerProps={{ className: "w-full max-w-[250px]" }}
                                                />
                                                <div className="h-5 mt-0.5">
                                                    {witnessErrors.fullName && (
                                                        <Typography variant="small" className="text-red-500 text-xs">
                                                            {witnessErrors.fullName}
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 max-w-[250px] min-h-[70px]">
                                                <Typography variant="small" className="text-primary mb-1 font-semibold text-sm">
                                                    Phone Number
                                                </Typography>
                                                <Input
                                                    placeholder="start with 09/07xxxxxxxx"
                                                    value={formData.witnessInfo?.currentWitness?.phoneNumber || ""}
                                                    onChange={(e) => {
                                                        const currentWitness = formData.witnessInfo?.currentWitness || {};
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
                                                        
                                                        handleFormDataChange('witnessInfo', {
                                                            ...formData.witnessInfo,
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
                                                    className={`w-full max-w-[250px] text-sm ${witnessErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                                                    containerProps={{ className: "w-full max-w-[250px]" }}
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
                                                        const currentWitness = formData.witnessInfo?.currentWitness || {};
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
                                                            const updatedWitnesses = [...(formData.witnessInfo?.witnesses || []), newWitness];
                                                            handleFormDataChange('witnessInfo', {
                                                                ...formData.witnessInfo,
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
                                    {formData.witnessInfo?.witnesses && formData.witnessInfo.witnesses.length > 0 && (
                                        <div className="space-y-2">
                                            <Typography variant="small" className="text-primary font-semibold text-sm">
                                                Added Witnesses ({formData.witnessInfo.witnesses.length})
                                            </Typography>
                                            <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto">
                                                {formData.witnessInfo.witnesses.map((witness) => (
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
                                                                    // Track removed witness ID if it exists (only for existing witnesses, not new ones)
                                                                    const witnessId = witness.complaint_witness_id || witness.witness_id;
                                                                    if (witnessId) {
                                                                        // This is an existing witness with an ID - track for removal
                                                                        handleRemoveWitness(witnessId);
                                                                    }
                                                                    // Remove from list (works for both existing and new witnesses)
                                                                    const updatedWitnesses = formData.witnessInfo.witnesses.filter(w => w.id !== witness.id);
                                                                    handleFormDataChange('witnessInfo', {
                                                                        ...formData.witnessInfo,
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

                                    {(!formData.witnessInfo?.witnesses || formData.witnessInfo.witnesses.length === 0) && (
                                        <div className="text-center py-3 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex-1 flex items-center justify-center min-h-[120px]">
                                            <div>
                                                <UserIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                                <Typography variant="small" className="text-gray-500 text-xs">
                                                    No witnesses added yet
                                                </Typography>
                                            </div>
                                        </div>
                                    )}
                        </div>
                                
                                <div className="flex justify-end pb-2 pt-4 flex-shrink-0 mt-auto">
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
                        </div>
                    </div>
                </Card>
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

export default EditComplaintV2;

