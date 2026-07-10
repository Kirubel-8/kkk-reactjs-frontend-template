import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import AccordionSections from './accordion-sections';

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept, isLoading = false }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (e) => {
        setIsChecked(e.target.checked);
    };

    const handleAcceptClick = () => {
        if (isChecked && !isLoading) {
            onAccept();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-[clamp(12px,2vw,20px)]" style={{ zIndex: 100 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[clamp(320px,80vw,760px)] max-h-[clamp(400px,80vh,720px)] border border-gray-100 overflow-hidden transform transition-all duration-300 ease-in-out">
                <div className="rounded-t-xl px-[clamp(16px,3vw,32px)] pt-[clamp(16px,3vw,32px)]">
                    <h2 className="text-[clamp(20px,2vw,24px)] font-bold leading-tight text-primary">Terms & Conditions</h2>
                </div>

                {/* Body */}
                <div className="px-[clamp(16px,3vw,32px)] py-[clamp(12px,2.5vw,20px)] max-h-[clamp(260px,55vh,520px)] overflow-y-auto text-gray-700 font-sans">
                    <p className="mb-[clamp(12px,2vw,20px)] text-[clamp(14px,1.1vw,16px)] leading-relaxed">
                        Please read these Terms & Conditions carefully before proceeding with the service.
                    </p>

                    <AccordionSections />
                </div>

                <div className="px-[clamp(16px,3vw,32px)] py-[clamp(12px,2.5vw,20px)] flex flex-col sm:flex-row items-center justify-between gap-[clamp(12px,2vw,20px)]">
                    <div className="relative w-full sm:w-auto">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                        <label className="flex items-center gap-[clamp(12px,1.5vw,16px)] text-[clamp(14px,1.1vw,16px)] py-[clamp(12px,2vw,16px)] relative">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                                className="h-[clamp(14px,1.4vw,18px)] w-[clamp(14px,1.4vw,18px)] accent-primary rounded focus:ring-primary"
                            />
                            <span className="text-[clamp(14px,1.1vw,16px)] text-primary font-medium leading-tight">
                                I agree to the Terms & Conditions
                            </span>
                        </label>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
                    </div>

                    <div className="flex gap-[clamp(8px,1.2vw,12px)] w-full sm:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 px-[clamp(16px,2.4vw,24px)] py-[clamp(10px,1.8vw,12px)] rounded-lg font-medium text-[clamp(14px,1.1vw,16px)] leading-tight transition duration-300 ease-in-out"
                        >
                            Close
                        </button>

                        <button
                            onClick={handleAcceptClick}
                            disabled={!isChecked || isLoading}
                            className={`px-[clamp(16px,2.4vw,24px)] py-[clamp(10px,1.8vw,12px)] rounded-lg font-medium text-[clamp(14px,1.1vw,16px)] leading-tight text-white transition-all duration-300 ease-in-out focus:ring-2 focus:ring-indigo-500 flex items-center gap-[clamp(8px,1.2vw,10px)] ${isChecked && !isLoading
                                ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-[clamp(14px,1.4vw,16px)] w-[clamp(14px,1.4vw,16px)] text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Submitting...' : 'Accept'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    , document.body);
};

export default TermsAndConditionsModal;