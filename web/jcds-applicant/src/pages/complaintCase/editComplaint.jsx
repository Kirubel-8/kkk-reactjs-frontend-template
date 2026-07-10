import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Typography } from "@material-tailwind/react";
import {
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  EyeIcon,
  PencilIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/solid";
import { Stepper } from "@/widgets/stepper";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import ComplaintDescriptionForm from "./steps/complaintDescriptionForm";
import WitnessInfoStep from "./steps/WitnessInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import SummarySidebar from "./components/SummarySidebar";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import complaintService from "@/service/complaint.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";

const EditComplaint = () => {
  const { t } = useTranslation();
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    judgeInfo: {},
    description: {},
    witnessInfo: {},
    documents: []
  });
  const [removedWitnessIds, setRemovedWitnessIds] = useState([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the full request ID from location state
  const fullRequestId = location.state?.fullRequestId || complaintId;
  const existingData = location.state?.requestData;

  // Refs for step components to access their validation methods
  const judgeInfoRef = useRef();
  const descriptionRef = useRef();
  const witnessInfoRef = useRef();
  const documentsRef = useRef();

  const steps = [
    {
      title: "Complaint Info",
      description: "Judge/Case/Personal info",
      icon: <DocumentTextIcon className="w-5 h-5" />
    },
    {
      title: "Description",
      description: "Circumstances and damage",
      icon: <DocumentTextIcon className="w-5 h-5" />
    },
    {
      title: "Witness Info",
      description: "witness information",
      icon: <CheckCircleIcon className="w-5 h-5" />
    },
    {
      title: "Attach Documents",
      description: "the documents you upload..",
      icon: <PaperAirplaneIcon className="w-5 h-5" />
    }
  ];

  const logo = "/jcdms-applicant/img/Courts-logo.png";

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
              id: index,
              fullName: witness.witness_name || witness.name || "",
              address: witness.witness_address || witness.address || "",
              contact: witness.witness_contact || witness.contact || "",
              complaint_witness_id: witness.complaint_witness_id || null,
              signature: witness.witness_signature || witness.public_url || null
            }))
          },
          documents: {
            documents: await Promise.all(
              (requestData.evidences || []).map(async (evidence, index) => {
                let fileInfo = {
                  id: index,
                  description: "", // Evidence files don't have description in backend response
                  fileUrl: evidence.public_url || evidence.file_path || null,
                  name: `evidence-${index + 1}`,
                  type: evidence.file_type || null,
                  size: 0,
                  complaint_evidence_id: evidence.complaint_evidence_id || null
                };

                // If there's a file URL, try to get file info
                if (evidence.public_url || evidence.file_path) {
                  try {
                    const fileUrl = evidence.public_url || evidence.file_path;
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
                        name: fileNameFromUrl,
                        size: fileSize,
                        type: fileType
                      };
                    }
                    
                  } catch (error) {
                    console.warn(`Failed to fetch file info for ${evidence.public_url || evidence.file_path}:`, error);
                    // Fallback to URL-based filename
                    const fileUrl = evidence.public_url || evidence.file_path;
                    fileInfo.name = fileUrl.split('/').pop() || `evidence-${index + 1}`;
                  }
                }

                return fileInfo;
              })
            ),
            damageDescription: requestData.additional_explanation || "", // Map additional_explanation to damageDescription
            signature: null // Signature will be handled separately if needed
          }
        };

        setFormData(transformedData);
        console.log("Transformed form data:", transformedData);
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

  const handleNext = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      if (currentStep < steps.length) { // Allow going to review step
        setCurrentStep(currentStep + 1);

        // Scroll to top when moving to review step
        if (currentStep === steps.length - 1) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Judge Info
        return judgeInfoRef.current?.validateAllFields() || false;
      case 1: // Description
        return descriptionRef.current?.validateAllFields() || false;
      case 2: // Witness Info
        return witnessInfoRef.current?.validateAllFields() || false;
      case 3: // Documents
        return documentsRef.current?.validateAllFields() || false;
      default:
        return true;
    }
  };

  const hasSidebarData = () => {
    // Check if we have any completed step data to show
    return (
      Object.keys(formData.judgeInfo).length > 0 ||
      Object.keys(formData.description).length > 0 ||
      (formData.witnessInfo && formData.witnessInfo.witnesses && formData.witnessInfo.witnesses.length > 0) ||
      (formData.documents && formData.documents.documents && formData.documents.documents.length > 0)
    );
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);

      // Scroll to top when going to previous step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleStepClick = (stepIndex) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);

      // Scroll to top when navigating between steps
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleEditStep = (stepIndex) => {
    // Navigate to specific step for editing
    setCurrentStep(stepIndex);

    // Scroll to top when editing from review step
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFormDataChange = (stepName, data) => {
    setFormData(prev => ({
      ...prev,
      [stepName]: data
    }));
  };

  // Functions to handle removal of witnesses and evidence
  const handleRemoveWitness = (witnessId) => {
    if (witnessId) {
      setRemovedWitnessIds(prev => [...prev, witnessId]);
    }
  };

  const handleRemoveEvidence = (evidenceId) => {
    if (evidenceId) {
      setRemovedEvidenceIds(prev => [...prev, evidenceId]);
    }
  };

  const handleSubmit = () => {
    // Show terms and conditions modal first
    setShowTermsModal(true);
  };

  const handleTermsAccept = async () => {
    try {
      startLoading();
      
      const judgeInfo = formData.judgeInfo || {};
      const description = formData.description || {};
      const witnessInfo = formData.witnessInfo || {};
      const docsObj = formData.documents || {};
      const documentsArray = Array.isArray(docsObj) ? docsObj : docsObj.documents || [];
      const signatureFile = docsObj.signature || null;

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
      fd.append("additional_explanation", description.additionalExplanation || "");

      // Map witness information
      const witnesses = witnessInfo.witnesses || [];
      if (witnesses.length > 0) {
        const witnessData = witnesses.map(w => {
          const witness = {
            witness_name: w.fullName,
            witness_address: w.address
          };
          
          // Only include complaint_witness_id if it exists (for existing witnesses)
          if (w.complaint_witness_id) {
            witness.complaint_witness_id = String(w.complaint_witness_id);
          }
          
          return witness;
        });
        fd.append("witnesses", JSON.stringify(witnessData));
      }

      // Handle witness signatures
      witnesses.forEach((witness, index) => {
        if (witness.signature && witness.signature instanceof File) {
          fd.append("witness_signatures", witness.signature);
        }
      });

      // Handle removal of witnesses (if any are marked for removal)
      if (removedWitnessIds.length > 0) {
        fd.append("remove_witness_ids", JSON.stringify(removedWitnessIds));
      }

      // Handle evidence files - only append new files
      const newEvidenceFiles = documentsArray.filter(d => d.file && d.file instanceof File);
      if (newEvidenceFiles.length > 0) {
        newEvidenceFiles.forEach((d) => {
          fd.append("evidence_files", d.file);
        });
      }

      // Handle removal of evidence files (if any are marked for removal)
      if (removedEvidenceIds.length > 0) {
        fd.append("remove_evidence_ids", JSON.stringify(removedEvidenceIds));
      }

      console.log("FormData contents:");
      for (let [key, value] of fd.entries()) {
        console.log(key, value);
      }

      // Use the service to update the complaint
      const result = await complaintService.updateComplaint(fullRequestId, fd);

      console.log("Updated complaint:", result);
      setShowTermsModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to update the complaint");
    } finally {
      stopLoading();
    }
  };

  const handleTermsClose = () => {
    // User closed terms modal without accepting
    setShowTermsModal(false);
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    // Redirect back to requests
    navigate("/home/requests");
  };

  const handleBack = () => {
    navigate("/home/requests");
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <JudgeInfoStep
            ref={judgeInfoRef}
            data={formData.judgeInfo}
            onChange={(data) => handleFormDataChange('judgeInfo', data)}
            onValidationChange={(isValid) => {
              // Optional: Handle validation state changes
            }}
          />
        );
      case 1:
        return (
          <ComplaintDescriptionForm
            ref={descriptionRef}
            formData={formData.description}
            onChange={(data) => handleFormDataChange('description', data)}
          />
        );
             case 2:
               return (
                 <WitnessInfoStep
                   ref={witnessInfoRef}
                   data={formData.witnessInfo}
                   onChange={(data) => handleFormDataChange('witnessInfo', data)}
                   onRemoveWitness={handleRemoveWitness}
                   onValidationChange={(isValid) => {
                     // Optional: Handle validation state changes
                   }}
                 />
               );
             case 3:
               return (
                 <DocumentsStep
                   ref={documentsRef}
                   data={{
                     documents: formData.documents?.documents || [],
                     damageDescription: formData.documents?.damageDescription || "",
                     signature: formData.documents?.signature || null
                   }}
                   onChange={(data) => handleFormDataChange('documents', data)}
                   onRemoveEvidence={handleRemoveEvidence}
                   onValidationChange={(isValid) => {
                     // Optional: Handle validation state changes
                   }}
                 />
               );
      case steps.length:
        return (
          <ReviewStep
            formData={formData}
            onEditStep={handleEditStep}
          />
        );
      default:
        return null;
    }
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
                    Edit Complaint
                  </Typography>
                  <Typography variant="small" color="gray" className="text-xs sm:text-sm">
                    Complaint ID: #{fullRequestId?.toString().slice(0, 8) || complaintId}
                  </Typography>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end w-full sm:w-auto">
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCancel}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              >
                <ArrowLeftIcon className="w-3 h-3 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Cancel</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${currentStep === steps.length ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Main Form Area */}
          <div className={`${currentStep === steps.length ? 'lg:mx-48' : 'lg:ml-16'} ${currentStep === steps.length ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            {/* Stepper - Hide on review step */}
            {currentStep !== steps.length && (
              <div className="mb-4">
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  orientation="horizontal"
                  size="md"
                  color="blue"
                  onStepClick={handleStepClick}
                />
              </div>
            )}

            {/* Form Content */}
            <Card className="p-4 sm:p-6 lg:p-8 text-sm sm:text-base lg:text-lg">
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 sm:gap-0 mt-8 sm:mt-12 ${currentStep === 0 ? 'sm:justify-end' : 'sm:justify-between'}`}>
                {/* Hide Prev button on first step */}
                {currentStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handlePrev}
                    className="flex items-center justify-center gap-1 sm:gap-2 bg-[#0042674D] text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:w-auto min-w-[110px] max-h-[44px]"
                  >
                    <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Prev
                  </Button>
                )}

                {/* Show Next/Submit button */}
                <div className={`w-full sm:w-auto ${currentStep === 0 ? 'sm:ml-auto' : ''} flex justify-end sm:justify-start`}>
                  {currentStep === steps.length - 1 ? (
                    <Button
                      variant="filled"
                      onClick={handleNext}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:max-w-[130px] max-h-[44px]"
                    >
                      Review
                      <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                    </Button>
                  ) : currentStep === steps.length ? (
                    <Button
                      variant="filled"
                      onClick={handleSubmit}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:max-w-[130px] max-h-[44px]"
                    >
                      Update
                      {/* <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" /> */}
                    </Button>
                  ) : (
                    <Button
                      variant="filled"
                      onClick={handleNext}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:min-w-[110px] max-h-[44px]"
                    >
                      Next
                      <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
                      
          {/* Sidebar - Hide on review step to avoid duplication */}
          {currentStep !== steps.length && (
            <div className="hidden lg:block lg:col-span-1">
              <SummarySidebar formData={formData} currentStep={currentStep} />
            </div>
          )}
        </div>
      </div>

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
        requestType="complaint case request"
      />
    </div>
  );
};

export default EditComplaint;
