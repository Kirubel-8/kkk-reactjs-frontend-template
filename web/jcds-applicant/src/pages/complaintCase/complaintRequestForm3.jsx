import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Typography, Input } from "@material-tailwind/react";
import {
  XMarkIcon,
  PlusIcon
} from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import JudgeInfoStep from "./steps/JudgeInfoStep";
import ComplaintDescriptionForm from "./steps/complaintDescriptionForm";
import DocumentsStep from "./steps/DocumentsStep";
import TermsAndConditionsModal from "../requestManagement/terms-and-conditions-modal";
import complaintService from "@/service/complaint.service";
import customerAuthService from "@/service/customer-auth.service";
import CancelRequestModal from "../requestManagement/cancel-request-modal";

const ComplaintRequestForm3 = () => {
    const navigate = useNavigate();
    const judgeInfoRef = useRef();
    const descriptionRef = useRef();
    const documentsRef = useRef();
    const [formData, setFormData] = useState({
        applicantInfo: {},
        judgeInfo: {},
        description: {},
        witnessInfo: { witnesses: [], currentWitness: { fullName: "", phoneNumber: "" } },
        documents: []
    });
    const [witnessErrors, setWitnessErrors] = useState({});
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    
                    // Update formData with fetched customer information
                    setFormData(prev => ({
                        ...prev,
                        applicantInfo: {
                            ...prev.applicantInfo,
                            fullName: customerData.full_name || "",
                            phoneNumber: customerData.phone_number || "",
                            gender: customerData.gender || ""
                        }
                    }));
                }
            } catch (error) {
                console.error("Error fetching customer data:", error);
            }
        };

        fetchCustomerData();
    }, []);

    const logo = "/jcdms-applicant/img/Courts-logo.png";

    // Validate all required fields
    const validateAllFields = () => {
            const judgeValid = judgeInfoRef.current ? judgeInfoRef.current.validateAllFields() : false;
            const descValid = descriptionRef.current ? descriptionRef.current.validateAllFields() : false;
            const docsValid = documentsRef.current ? documentsRef.current.validateAllFields() : false;
        return judgeValid && descValid && docsValid;
    };

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

    const handleSubmit = () => {
        if (validateAllFields() && !isSubmitting) {
        setShowTermsModal(true);
        }
    };

    const handleTermsAccept = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
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
                    successMessage: "complaint is successfully sent"
                } 
            });
        } catch (error) {
            console.error("Error submitting complaint: ", error);
            setIsSubmitting(false);
            
            // Close terms modal on error
            setShowTermsModal(false);
            
            // Show error notification after a small delay to ensure modal is closed
            setTimeout(() => {
                toast.error("failed to sent", {
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
                      <h1 className="text-lg sm:text-xl lg:text-xl font-bold text-primary">
                        Complaint Reporting Form
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-primary">
                        Submit a new complaint 
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
                      <span className="hidden sm:inline">Cancel</span>
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
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit"
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

export default ComplaintRequestForm3;

