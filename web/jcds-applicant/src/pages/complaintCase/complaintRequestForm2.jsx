import React, { useState, useRef } from "react";
import { Button, Card, Typography, Dialog, DialogHeader, DialogBody, DialogFooter } from "@material-tailwind/react";
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
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import ComplaintDescriptionForm from "./steps/complaintDescriptionForm";
import WitnessInfoStep from "./steps/WitnessInfoStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewStep from "./steps/ReviewStep";
import SuccessModal from "./components/SuccessModal";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import complaintService from "@/service/complaint.service";
import CancelRequestModal from "../requestManagement/cancel-request-modal";

const ComplaintRequestForm2 = () => {
    console.log("ComplaintRequestForm2 component is rendering");
    const { t } = useTranslation();
    const navigate = useNavigate();
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
    const [showReviewModal, setShowReviewModal] = useState(false);

    const logo = "/jcdms-applicant/img/Courts-logo.png";

    const handleFormDataChange = (stepName, data) => {
        setFormData(prev => ({
            ...prev,
            [stepName]: data
        }));
    };

    const validateAllSteps = () => {
        let isValid = true;
        const errors = [];

        // Validate Judge Info
        if (judgeInfoRef.current) {
            const judgeValid = judgeInfoRef.current.validateAllFields();
            if (!judgeValid) {
                isValid = false;
                errors.push("Judge Information");
            }
        }

        // Validate Description
        if (descriptionRef.current) {
            const descValid = descriptionRef.current.validateAllFields();
            if (!descValid) {
                isValid = false;
                errors.push("Complaint Description");
            }
        }

        // Validate Witness Info
        if (witnessInfoRef.current) {
            const witnessValid = witnessInfoRef.current.validateAllFields();
            if (!witnessValid) {
                isValid = false;
                errors.push("Witness Information");
            }
        }

        // Validate Documents
        if (documentsRef.current) {
            const docsValid = documentsRef.current.validateAllFields();
            if (!docsValid) {
                isValid = false;
                errors.push("Documents");
            }
        }

        if (!isValid) {
            alert(`Please complete all required fields in: ${errors.join(', ')}`);
        }

        return isValid;
    };

    const handleReview = () => {
        if (validateAllSteps()) {
            setShowReviewModal(true);
        }
    };

    const handleSubmit = () => {
        setShowReviewModal(false);
        // Show terms and conditions modal first
        setShowTermsModal(true);
    };

    const handleTermsAccept = async () => {
        // User accepted terms, proceed with submission
        try {
            const response = await complaintService.createComplaint(formData);
            console.log("Complaint submitted successfully: ", response)
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
                  <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleReview}
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                    >
                      <EyeIcon className="w-3 h-3 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Review</span>
                      <span className="sm:hidden">Review</span>
                    </Button>
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

            {/* Main Content - Three Modal Sections */}
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Modal 1: Judge Info */}
                    <div className="lg:col-span-1">
                        <Card className="p-4 sm:p-6 lg:p-8 text-sm sm:text-base lg:text-lg h-full">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                <DocumentTextIcon className="w-5 h-5 text-primary" />
                                <Typography variant="h5" className="text-primary font-bold">
                                    Judge & Case Information
                                </Typography>
                            </div>
                            
                            <JudgeInfoStep
                                ref={judgeInfoRef}
                                data={formData.judgeInfo}
                                onChange={(data) => handleFormDataChange('judgeInfo', data)}
                            />
                        </Card>
                    </div>

                    {/* Modal 2: Complaint Description & Witness Info */}
                    <div className="lg:col-span-1">
                        <Card className="p-4 sm:p-6 lg:p-8 text-sm sm:text-base lg:text-lg h-full">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                <CheckCircleIcon className="w-5 h-5 text-primary" />
                                <Typography variant="h5" className="text-primary font-bold">
                                    Complaint Description & Witness
                                </Typography>
                            </div>
                            
                            <div className="space-y-6">
                                {/* Description Section */}
                                <div>
                                    {/* <Typography variant="h6" className="mb-3 text-gray-700">
                                        Complaint Description
                                    </Typography> */}
                                    <ComplaintDescriptionForm
                                        ref={descriptionRef}
                                        formData={formData.description}
                                        onChange={(data) => handleFormDataChange('description', data)}
                                    />
                                </div>

                                {/* Witness Info Section */}
                                <div className="mt-6 pt-6 border-t">
                                    <Typography variant="h6" className="mb-3 text-gray-700">
                                        Witness Information
                                    </Typography>
                                    <WitnessInfoStep
                                        ref={witnessInfoRef}
                                        data={formData.witnessInfo}
                                        onChange={(data) => handleFormDataChange('witnessInfo', data)}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Modal 3: Documents */}
                    <div className="lg:col-span-1">
                        <Card className="p-4 sm:p-6 lg:p-8 text-sm sm:text-base lg:text-lg h-full">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                <PaperAirplaneIcon className="w-5 h-5 text-primary" />
                                <Typography variant="h5" className="text-primary font-bold">
                                    Evidence & Documents
                                </Typography>
                            </div>
                            
                            <DocumentsStep
                                ref={documentsRef}
                                data={formData.documents}
                                onChange={(data) => handleFormDataChange('documents', data)}
                            />
                        </Card>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-center">
                    <Button
                        variant="filled"
                        onClick={handleSubmit}
                        className="flex items-center justify-center gap-2 bg-primary text-base px-8 py-3 min-w-[200px]"
                    >
                        Submit Complaint
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Review Modal */}
            <Dialog 
                open={showReviewModal} 
                handler={() => setShowReviewModal(false)}
                size="xl"
                className="max-h-[90vh] overflow-y-auto"
            >
                <DialogHeader>
                    <Typography variant="h4" className="text-primary">
                        Review Your Complaint
                    </Typography>
                </DialogHeader>
                <DialogBody>
                    <ReviewStep
                        formData={formData}
                        onEditStep={() => setShowReviewModal(false)}
                    />
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setShowReviewModal(false)}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="filled"
                        color="primary"
                        onClick={handleSubmit}
                    >
                        Submit Complaint
                    </Button>
                </DialogFooter>
            </Dialog>

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

export default ComplaintRequestForm2;
