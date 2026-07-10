import React, { useState } from 'react';

const TermsAndConditionsModal = ({ isOpen, onClose, onAccept }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (e) => {
        setIsChecked(e.target.checked);
    };

    const handleAcceptClick = () => {
        if (isChecked) {
            onAccept();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-gray-100 overflow-hidden transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-600 p-6 rounded-t-xl">
                    <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto text-gray-700 font-sans">
                    <p className="mb-6 text-base leading-relaxed">
                        Please read these Terms & Conditions carefully before proceeding with the service.
                    </p>

                    {[
                        {
                            heading: "1. Acceptance of Terms",
                            content: "By accessing or using the Constitutional Inquiry Platform (the 'Service'), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use the Service. The Service is designed to facilitate the submission, review, and management of constitutional inquiry cases."
                        },
                        {
                            heading: "2. User Responsibilities",
                            content: (
                                <ul className="list-disc list-inside space-y-2 pl-5">
                                    <li>You are responsible for providing accurate and complete information when submitting a case request.</li>
                                    <li>You must not misuse the Service for any illegal or unauthorized purpose, including but not limited to submitting fraudulent or frivolous cases.</li>
                                    <li>You agree to comply with all applicable laws and regulations in your jurisdiction.</li>
                                </ul>
                            )
                        },
                        {
                            heading: "3. Intellectual Property",
                            content: (
                                <ul className="list-disc list-inside space-y-2 pl-5">
                                    <li>All content, including but not limited to case documents, legal arguments, and precedents, submitted through the Service remains the intellectual property of the respective parties.</li>
                                    <li>The Service provider retains ownership of the platform, including its design, functionality, and underlying software.</li>
                                    <li>You may not reproduce, distribute, or create derivative works without prior written permission.</li>
                                </ul>
                            )
                        },
                        {
                            heading: "4. Privacy Policy",
                            content: (
                                <ul className="list-disc list-inside space-y-2 pl-5">
                                    <li>Your use of the Service is governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information.</li>
                                    <li>By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.</li>
                                    <li>Case-related information may be shared with relevant authorities, legal representatives, or the public as required by law.</li>
                                </ul>
                            )
                        },
                        {
                            heading: "5. Limitation of Liability",
                            content: (
                                <ul className="list-disc list-inside space-y-2 pl-5">
                                    <li>The Service provider shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of the Service.</li>
                                    <li>This includes, but is not limited to, damages for loss of profits, data, or other intangible losses.</li>
                                    <li>The Service provider does not guarantee the outcome of any constitutional inquiry case submitted through the platform.</li>
                                </ul>
                            )
                        },
                        {
                            heading: "6. Termination",
                            content: (
                                <ul className="list-disc list-inside space-y-2 pl-5">
                                    <li>We reserve the right to terminate or suspend your access to the Service at any time, without prior notice or liability, for any reason, including but not limited to a breach of these Terms & Conditions.</li>
                                    <li>Upon termination, your right to use the Service will immediately cease, and any pending cases may be archived or deleted.</li>
                                </ul>
                            )
                        },
                        {
                            heading: "7. Governing Law",
                            content: "These Terms & Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service provider operates. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in that jurisdiction."
                        },
                        {
                            heading: "8. Changes to Terms",
                            content: "We reserve the right to modify or replace these Terms & Conditions at any time. If a revision is material, we will provide notice prior to the new terms taking effect. Your continued use of the Service after any changes constitutes acceptance of the revised terms."
                        },
                        {
                            heading: "9. Contact Information",
                            content: "If you have any questions about these Terms & Conditions, please contact us at support@cci.gov.et or visit our website at www.cci.gov.et for more information."
                        }
                    ].map((section, index) => (
                        <div key={index} className="mb-6 text-sm leading-relaxed">
                            <strong className="font-semibold text-indigo-700">{section.heading}</strong>
                            <br />
                            <span className="text-gray-700">{section.content}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                            className="text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                            I agree to the Terms & Conditions
                        </span>
                    </label>

                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 px-5 py-2 rounded-lg font-medium transition duration-300 ease-in-out"
                        >
                            Close
                        </button>

                        <button
                            onClick={handleAcceptClick}
                            disabled={!isChecked}
                            className={`px-5 py-2 rounded-lg font-medium text-white transition-all duration-300 ease-in-out focus:ring-2 focus:ring-indigo-500 ${isChecked
                                ? 'bg-indigo-500 hover:bg-indigo-700 cursor-pointer'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditionsModal;