import React, { useState, useRef } from "react";
import { Button, Card, Typography } from "@material-tailwind/react";
import {
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ArrowLeftIcon,
  PencilIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import { Stepper } from "@/widgets/stepper";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import SummarySidebar from "./components/SummarySidebar";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import CancelRequestModal from "../requestManagement/cancel-request-modal";
import DisciplinaryRequestService from "@/service/desciplinary.request.service";

const DisciplinaryCaseReportingForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    judgeInfo: {},
    documents: []
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Refs for step components to access their validation methods
  const judgeInfoRef = useRef();
  const documentsRef = useRef();

  const steps = [
    {
      title: "Disciplinary Complaint Info",
      description: "Judge/case complaint info",
      icon: <DocumentTextIcon className="w-5 h-5" />
    },
    {
      title: "Evidences",
      description: "Relevant evindence for Complaint",
      icon: <PaperAirplaneIcon className="w-5 h-5" />
    }
  ];

  const logo = "/jcdms-applicant/img/Courts-logo.png";

  const handleNext = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      if (currentStep < 2) { // Allow going to step 2 (Review)
        setCurrentStep(currentStep + 1);

        // Scroll to top when moving to review step
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
      case 0: // Judge Info
        return judgeInfoRef.current?.validateAllFields() || false;
      case 1: // Documents
        return documentsRef.current?.validateAllFields() || false;
      default:
        return true;
    }
  };


  const hasSidebarData = () => {
    // Check if we have any completed step data to show
    return (
      Object.keys(formData.judgeInfo).length > 0 ||
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

  const handleSubmit = () => {
    // Show terms and conditions modal first
    setShowTermsModal(true);
  };

const handleTermsAccept = async () => {
  try {
    const judgeInfo = formData.judgeInfo || {};
    const docsObj = formData.documents || {};
    const documentsArray = Array.isArray(docsObj) ? docsObj : docsObj.documents || [];
    const signatureFile = docsObj.signature || null;

    const fd = new FormData();
    fd.append("judge_name", judgeInfo.judgeFullName || "");
    fd.append("court_office", judgeInfo.servingPlace || "");
    fd.append("file_number", judgeInfo.caseFileNumber || "");

    console.log("Documents Object:", docsObj);

    // ✅ Prepare issues
    const issuesPayload = [{ description: judgeInfo.description || "" }];
    fd.append("issues", JSON.stringify(issuesPayload));

    // ✅ Separate text evidences and file evidences
    const textEvidences = [];
    const fileEvidences = [];

    documentsArray.forEach((d) => {
      if (!d.file && d.description) {
        // Text-only evidence
        textEvidences.push({
          description: d.description || "",
          file_url: d.fileUrl || null,
        });
      } else if (d.file && !d.description) {
        // File-only evidence
        fileEvidences.push(d.file);
      }
      // If both file and description exist, treat it as file-only
    });

    // ✅ Handle additional information as the single allowed description evidence
    if (docsObj.additionalInformation) {
      // Override other text evidences with this
      textEvidences.length = 0;
      textEvidences.push({
        description: docsObj.additionalInformation,
        file_url: null,
      });
    } else if (textEvidences.length > 0) {
      // Only keep the first one if multiple
      const firstTextEvidence = textEvidences[0];
      textEvidences.length = 0;
      textEvidences.push(firstTextEvidence);
    }

    // ✅ Append text evidence(s)
    fd.append("evidences", JSON.stringify(textEvidences));

    // ✅ Append file evidences (only once!)
    fileEvidences.forEach((file) => {
      fd.append("evidence", file, file.name || "evidence");
    });

    // ✅ Append signature if available
    if (signatureFile) {
      fd.append("signature", signatureFile, signatureFile.name);
    }

    // ✅ Submit request
    const result = await DisciplinaryRequestService.createRequest(fd);

    console.log("Created:", result);
    setShowTermsModal(false);
    setShowSuccessModal(true);
  } catch (err) {
    console.error("Submit error:", err);
    alert(err.message || "Failed to submit the disciplinary request");
  }
};


  const handleTermsClose = () => {
    // User closed terms modal without accepting
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
    // Redirect or reset form
    // window.location.href = "/home";
    window.location.href = "/jcdms-applicant/home/requests";
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
          <DocumentsStep
            ref={documentsRef}
            data={formData.documents}
            onChange={(data) => handleFormDataChange('documents', data)}
            onValidationChange={(isValid) => {
              // Optional: Handle validation state changes
            }}
          />
        );
      case 2:
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${currentStep === 2 ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
          {/* Main Form Area */}
          <div className={`${currentStep === 2 ? 'lg:mx-48' : 'lg:ml-16'} ${currentStep === 2 ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
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
            {/* <Card className={`${currentStep === 2 ? 'p-4 sm:px-0 md:px-14 lg:px-96 xl:px-24' : 'p-4 sm:p-6 lg:p-96'} text-sm sm:text-base lg:text-lg`}> */}
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 sm:gap-0 mt-8 sm:mt-12 ${currentStep === 0 ? 'sm:justify-end' : 'sm:justify-between'}`}>
                {/* Hide Prev button on first step */}
                {currentStep > 0  && (
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
                      Next
                      <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                    </Button>
                  ) : currentStep === 2 ? (
                    <Button
                      variant="filled"
                      onClick={handleSubmit}
                      className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full sm:max-w-[130px] max-h-[44px]"
                    >
                      Submit
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
          {currentStep !== 2 && (
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
        requestType="disciplinary case request"
      />
    </div>
  );
};

export default DisciplinaryCaseReportingForm;
