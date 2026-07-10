import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Typography } from "@material-tailwind/react";
import {
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ScaleIcon
} from "@heroicons/react/24/solid";
import { Stepper } from "@/widgets/stepper";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import SummarySidebar from "./components/SummarySidebar";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";
import { useLoading } from "@/loading-context";
import { DOCUMENT_URL } from "../../../config";

const EditDisciplinary = () => {
  const { t } = useTranslation();
  const { shortRequestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useLoading();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    judgeInfo: {},
    documents: {
      documents: [],
      signature: null
    }
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingEvidences, setExistingEvidences] = useState([]); // Track existing evidence IDs

  const fullRequestId = location.state?.fullRequestId || shortRequestId;
  const existingData = location.state?.requestData;

  const judgeInfoRef = useRef();
  const documentsRef = useRef();

  const steps = [
    {
      title: "Disciplinary Complaint Info",
      description: "Judge/case complaint info",
      icon: <DocumentTextIcon className="w-5 h-5" />
    },
    {
      title: "Attach Documents",
      description: "the documents you upload..",
      icon: <PaperAirplaneIcon className="w-5 h-5" />
    }
  ];

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
      const additionalInfoEvidence = evidences.find(e => !e.file_url && e.description) || null;
      const fileEvidences = evidences.filter(e => e.file_url); // only documents with files

      const documentsArray = await Promise.all(
        fileEvidences.map(async (evidence, index) => {
          let fileInfo = {
            id: evidence.evidence_id || `evidence-${index}`,
            evidence_id: evidence.evidence_id,
            description: evidence.description || "",
            fileUrl: evidence.file_url || null,
            name: `evidence-${index + 1}`,
            type: null,
            size: 0,
            isExisting: true
          };

          // Fetch file info if URL exists
          if (evidence.file_url) {
            try {
              const fullUrl = evidence.file_url.startsWith('http') 
                ? evidence.file_url 
                : `${DOCUMENT_URL}${evidence.file_url.startsWith('/') ? '' : '/'}${evidence.file_url}`;
              
              const response = await fetch(fullUrl, { method: 'HEAD' });
              if (response.ok) {
                const fileNameFromUrl = evidence.file_url.split('/').pop() || `evidence-${index + 1}`;
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
              console.warn(`Failed to fetch file info for ${evidence.file_url}:`, error);
              fileInfo.name = evidence.file_url.split('/').pop() || `evidence-${index + 1}`;
            }
          }

          return fileInfo;
        })
      );

      const transformedData = {
        judgeInfo: {
          judgeFullName: requestData.judge_name || requestData.judgeName || "",
          servingPlace: requestData.court_office || requestData.courtOffice || "",
          caseFileNumber: requestData.file_number || requestData.fileNumber || "",
          description: requestData.issues?.[0]?.description || ""
        },
        documents: {
          documents: documentsArray,
          additionalInformation: additionalInfoEvidence ? additionalInfoEvidence.description : "",
          signature: null
        }
      };

      setFormData(transformedData);
      console.log("Transformed form data:", transformedData);
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


  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
        if (currentStep === 1) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return judgeInfoRef.current?.validateAllFields() || false;
      case 1:
        return documentsRef.current?.validateAllFields() || false;
      default:
        return true;
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleEditStep = (stepIndex) => {
    setCurrentStep(stepIndex);
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

  const handleSubmit = () => {
    setShowTermsModal(true);
  };

const handleTermsAccept = async () => {
  try {
    startLoading();

    const judgeInfo = formData.judgeInfo || {};
    const documentsData = formData.documents || {};
    const documentsArray = documentsData.documents || [];
    const signatureFile = documentsData.signature || null;

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
    documentsArray.forEach((doc) => {
      if (doc.evidence_id) {
        if (doc.toRemove) {
          removeEvidenceIds.push(doc.evidence_id);
        } else {
          textEvidences.push({
            evidence_id: doc.evidence_id,
            description: doc.description || "",
            file_url: doc.fileUrl || null
          });
        }
      } else if (doc.file) {
        // New file upload
        newFiles.push(doc);
      }
    });

    // 
    if (documentsData.additionalInformation && documentsData.additionalInformation.trim()) {
      textEvidences.push({
        evidence_id: null, // new evidence
        description: documentsData.additionalInformation.trim(),
        file_url: null
      });
    }

    
    existingEvidences.forEach(existingEvidence => {
      const stillExists = documentsArray.some(doc => doc.evidence_id === existingEvidence.evidence_id);
      if (!stillExists) {
        removeEvidenceIds.push(existingEvidence.evidence_id);
      }
    });

    // Append evidences and removals
    fd.append("evidences", JSON.stringify(textEvidences));
    fd.append("remove_evidence_ids", JSON.stringify(removeEvidenceIds));

    // Append new files
    newFiles.forEach((doc) => {
      if (doc.file) {
        fd.append("evidence", doc.file, doc.name || doc.file.name);
      }
    });

    // Append signature if exists
    if (signatureFile) {
      fd.append("signature", signatureFile, signatureFile.name);
    }

    // I used this for debug
    console.log("FormData for update:");
    for (let [key, value] of fd.entries()) {
      console.log(key, value);
    }

    // Submit update request
    const result = await DisciplinaryRequestService.updateRequest(fullRequestId, fd);

    console.log("Update successful:", result);
    setShowTermsModal(false);
    setShowSuccessModal(true);

  } catch (err) {
    console.error("Submit error:", err);
    toast.error(err.message || "Failed to update the disciplinary request");
  } finally {
    stopLoading();
  }
};

  const handleTermsClose = () => {
    setShowTermsModal(false);
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
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
          />
        );
      case 1:
        return (
          <DocumentsStep
            ref={documentsRef}
            data={formData.documents}
            onChange={(data) => handleFormDataChange('documents', data)}
            isEditMode={true}
          />
        );
      case 2:
        return (
          <ReviewStep
            formData={formData}
            onEditStep={handleEditStep}
            isEditMode={true}
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#416FE429] rounded-lg flex items-center justify-center">
                  <ScaleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#a8bef0]" />
                </div>
                <div>
                  <Typography variant="h5" className="text-primary sm:text-2xl lg:text-3xl">
                    Edit Disciplinary Case
                  </Typography>
                  <Typography variant="small" color="gray" className="text-xs sm:text-sm">
                    Request ID: #{fullRequestId?.toString().slice(0, 8) || shortRequestId}
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${currentStep === 2 ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Main Form Area */}
          <div className={`${currentStep === 2 ? ' sm:mx-0 lg:mx-48' : 'lg:ml-16'} ${currentStep === 2 ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            {/* Stepper - Hide on review step */}
            {currentStep !== 2 && (
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
                  {currentStep === 1 ? (
                    <Button
                      variant="filled"
                      onClick={handleNext}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:max-w-[130px] max-h-[44px]"
                    >
                      Review
                      <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                    </Button>
                  ) : currentStep === 2 ? (
                    <Button
                      variant="filled"
                      onClick={handleSubmit}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:max-w-[130px] max-h-[44px]"
                    >
                      Update
                      <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
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
          {currentStep !== 2 && (
            <div className="hidden lg:block lg:col-span-1">
              <SummarySidebar formData={formData} currentStep={currentStep} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onFinish={handleFinish}
      />

      <CancelRequestModal
        isOpen={showCancelModal}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        requestType="disciplinary case request"
      />
    </div>
  );
};

export default EditDisciplinary;