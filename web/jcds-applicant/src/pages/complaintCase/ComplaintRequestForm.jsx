import React, { useState, useRef } from "react";
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
  XMarkIcon
} from "@heroicons/react/24/solid";
import { Stepper } from "@/widgets/stepper";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import ComplaintDescriptionForm from "./steps/complaintDescriptionForm";
import WitnessInfoStep from "./steps/WitnessInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import SummarySidebar from "./components/SummarySidebar";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import complaintService from "@/service/complaint.service";
import CancelRequestModal from "../requestManagement/cancel-request-modal";



const ComplaintRequestForm = () => {
    console.log("ComplaintRequestForm component is rendering");
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const judgeInfoRef = useRef();
    const descriptionRef = useRef();
    const witnessInfoRef = useRef();
    const documentsRef = useRef();
    const [formData, setFormData] = useState({
        judgeInfo: {},
        description: {},
        witnessInfo: {},
        documents: []
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [stepValidation, setStepValidation] = useState({
        0: false, // JudgeInfoStep
        1: false, // DescriptionStep
        2: false, // WitnessInfoStep
        3: false  // DocumentsStep
    });

    const logo = "/jcdms-applicant/img/Courts-logo.png";

    const steps = [
        {
            title: "Complaint Info",
            // description: "Judge/Case/Personal info",
            icon: <DocumentTextIcon className="w-5 h-5" />
        },
        {
            title: "Complaint Info",
            // description: "Circumstances and damage",
            icon: <DocumentTextIcon className="w-5 h-5" />
        },
        {
            title: "Witness Info",
            // description: "Witness information",
            icon: <CheckCircleIcon className="w-5 h-5" />
        },
        {
            title: "Evidences",
            // description: "Evidences Supporting the Claim ",
            icon: <PaperAirplaneIcon className="w-5 h-5" />
        }
    ];

    const handleNext = () => {
        // For each step, trigger validation using refs
        let isValid = false;
        
        if (currentStep === 0 && judgeInfoRef.current) {
            isValid = judgeInfoRef.current.validateAllFields();
        } else if (currentStep === 1 && descriptionRef.current) {
            isValid = descriptionRef.current.validateAllFields();
        } else if (currentStep === 2 && witnessInfoRef.current) {
            isValid = witnessInfoRef.current.validateAllFields();
        } else if (currentStep === 3 && documentsRef.current) {
            isValid = documentsRef.current.validateAllFields();
        }
        
        if (isValid) {
            if (currentStep < 4) { // Allow going to step 4 (Review)
                setCurrentStep(currentStep + 1);
                
                // Scroll to top when moving to review step
                if (currentStep === 3) {
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
                return validateJudgeInfo();
            case 1: // Description
                return validateDescription();
            case 2: // Witness Info
                return validateWitnessInfo();
            case 3: // Documents
                return validateDocuments();
            default:
                return true;
        }
    };

    const validateJudgeInfo = () => {
        const required = ['judgeFullName', 'servingPlace', 'caseFileNumber', 'incidentDate'];
        const missing = required.filter(field => !formData.judgeInfo[field]);
        
        if (missing.length > 0) {
            alert(`Please fill in all required fields: ${missing.join(', ')}`);
            return false;
        }
        return true;
    };

    const validateDescription = () => {
        const required = ['description', 'damageDescription'];
        const missing = required.filter(field => !formData.description[field]);
        
        if (missing.length > 0) {
            alert(`Please fill in all required fields: ${missing.join(', ')}`);
            return false;
        }
        return true;
    };

    const validateWitnessInfo = () => {
        if (!formData.witnessInfo.witnesses || formData.witnessInfo.witnesses.length === 0) {
            alert('Please add at least one witness');
            return false;
        }
        return true;
    };

    const validateDocuments = () => {
        if (!formData.documents || !formData.documents.documents || formData.documents.documents.length === 0) {
            alert('Please upload at least one document');
            return false;
        }
        if (!formData.documents.damageDescription) {
            alert('Please provide a description of the damage');
            return false;
        }
        return true;
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

    const handleValidationChange = (stepIndex, isValid) => {
        setStepValidation(prev => ({
            ...prev,
            [stepIndex]: isValid
        }));
    };

    const handleSubmit = () => {
        // Show terms and conditions modal first
        setShowTermsModal(true);
    };

    const handleTermsAccept = async () => {
        // User accepted terms, proceed with submission
        try {
            const response = await complaintService.createComplaint(formData);
            console.log("Complaint submited successfully: ", response)
        } catch (error) {
            console.error("Error submitting complaint: ", error)
            if (error.message.includes("Unauthorized")) {
                alert("Please log in to submit a complaint.");
            } else {
                alert("Failed to submit complaint. Please try again.");
            }
        }
        setShowTermsModal(false);
        setShowSuccessModal(true);
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

    const handleFinish = async () => {
        setShowSuccessModal(false);

        try {
            // Just redirect to the requests page - complaint was already created in handleTermsAccept
            window.location.href = "/jcdms-applicant/home/requests";
        } catch (error) {
            console.error("Error during navigation:", error);
            // Still redirect even if there's an error
            window.location.href = "/jcdms-applicant/home/requests";
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <JudgeInfoStep
                        ref={judgeInfoRef}
                        data={formData.judgeInfo}
                        onChange={(data) => handleFormDataChange('judgeInfo', data)}
                        onValidationChange={(isValid) => handleValidationChange(0, isValid)}
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
                        onValidationChange={(isValid) => handleValidationChange(2, isValid)}
                    />
                );
            case 3:
                return (
                    <DocumentsStep
                        ref={documentsRef}
                        data={formData.documents}
                        onChange={(data) => handleFormDataChange('documents', data)}
                        onValidationChange={(isValid) => handleValidationChange(3, isValid)}
                    />
                );
            case 4:
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
                        Complaint Reporting Form
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-primary">
                        Submit a new complaint for review
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
                <div className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${currentStep === 4 ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
                    {/* Main Form Area */}
                    <div className={`${currentStep === 4 ? 'lg:mx-48' : 'lg:ml-16'} ${currentStep === 4 ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                      {/* Stepper - Hide on review step */}
                      {currentStep !== 4 && (
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
                          {/* Hide Prev button on first step (PersonalInfoStep) */}
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
                          <div className={`w-full sm:w-auto ${currentStep === 0 ? 'sm:ml-auto' : ''}`}>
                            {currentStep === 3 ? (
                              <Button
                                variant="filled"
                                onClick={handleNext}
                                className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full max-w-[130px] max-h-[44px]"
                              >
                                Next
                                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                              </Button>
                            ) : currentStep === 4 ? (
                              <Button
                                variant="filled"
                                onClick={handleSubmit}
                                className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full max-w-[130px] max-h-[44px]"
                              >
                                Submit
                                <ArrowLeftIcon className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                              </Button>
                            ) : (
                              <Button
                                variant="filled"
                                onClick={handleNext}
                                className="flex items-center justify-center gap-1 sm:gap-2 bg-primary text-xs sm:text-base px-4 sm:px-8 py-2 sm:py-3 w-full min-w-[110px] max-h-[44px]"
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
                    {currentStep !== 4 && (
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

export default ComplaintRequestForm;
