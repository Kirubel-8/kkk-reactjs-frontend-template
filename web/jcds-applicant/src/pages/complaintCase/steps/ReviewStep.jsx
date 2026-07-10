import React, { useState, useEffect } from "react";
import { Card, Typography, Button } from "@material-tailwind/react";
import { 
  UserIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  PaperAirplaneIcon,
  EyeIcon,
  PencilIcon
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import PreviewModal from "../../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../../config";

const ReviewStep = ({ formData = {}, onEditStep }) => {
  const { applicantInfo = {}, judgeInfo = {}, description = {}, witnessInfo = {}, documents = {} } = formData;

  const [previewModal, setPreviewModal] = useState({ isOpen: false, file: null });

  const handlePreviewFile = async (doc) => {
    try {
      if (doc.file instanceof File) {
        setPreviewModal({ isOpen: true, file: doc.file });
        return;
      }

      if (doc.fileUrl) {
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;

        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error('Failed to fetch file');

        const blob = await response.blob();
        const fileName = doc.name || doc.fileUrl.split('/').pop() || 'document';
        const file = new File([blob], fileName, { type: blob.type });
        setPreviewModal({ isOpen: true, file });
      }
    } catch (e) {
      // Fallback: try to open with URL directly
      if (doc && doc.fileUrl) {
        const fullUrl = doc.fileUrl.startsWith('http') 
          ? doc.fileUrl 
          : `${DOCUMENT_URL}${doc.fileUrl.startsWith('/') ? '' : '/'}${doc.fileUrl}`;
        setPreviewModal({ isOpen: true, file: fullUrl });
      }
    }
  };

  const closePreviewModal = () => setPreviewModal({ isOpen: false, file: null });

  const handleEdit = (stepIndex) => {
    if (onEditStep) {
      onEditStep(stepIndex);
    }
  };

  const ReviewCard = ({ title, description, data, fields, stepIndex, icon }) => {
    const isTwoColumn = title === "Complaint Information";
    const mid = Math.ceil(fields.length / 2);
    const leftFields = fields.slice(0, mid);
    const rightFields = fields.slice(mid);

    const renderField = (field) => (
      <div key={field.key} className="flex flex-col">
        <Typography variant="small" className="text-gray-500 font-medium">
          {field.label}:
        </Typography>
        <Typography variant="small" className="text-gray-900 mt-1 break-words">
          {data[field.key] || field.defaultValue || "Not provided"}
        </Typography>
      </div>
    );

    return (
      <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-gray-200 hover:border-primary transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <Typography variant="h6" className="text-gray-900 text-sm sm:text-base">
                {title}
              </Typography>
              <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
                {description}
              </Typography>
            </div>
          </div>
          <Button
            variant="outlined"
            size="sm"
            onClick={() => handleEdit(stepIndex)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <PencilIcon className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {isTwoColumn ? (
          <div className="md:flex md:divide-x md:divide-gray-200">
            <div className="md:w-1/2 md:pr-4 space-y-4">
              {leftFields.map(renderField)}
            </div>
            <div className="md:w-1/2 md:pl-4 space-y-4">
              {rightFields.map(renderField)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map(renderField)}
          </div>
        )}
      </Card>
    );
  };

  return (
    // <div className="space-y-6">
    // <div className="max-w-7xl mx-auto space-y-6">
    <div className="w-full sm:px-0 md:px-12 lg:px-16 xl:px-20 space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
        </div>
        <Typography variant="h6" className="text-gray-900 mb-2 text-lg sm:text-xl">
          Review Your Information
        </Typography>
        <Typography variant="small" className="text-gray-600 text-sm sm:text-base">
          Please review all the information below before submitting your complaint request
        </Typography>
      </div>

      {/* Applicant Information */}
      {(applicantInfo.fullName || applicantInfo.phoneNumber || applicantInfo.gender) && (
        <ReviewCard
          title="Applicant Information"
          description="Personal information"
          data={applicantInfo}
          fields={[
            { key: 'fullName', label: 'Full Name' },
            { key: 'phoneNumber', label: 'Phone Number' },
            { key: 'gender', label: 'Gender', defaultValue: 'N/A' }
          ]}
          stepIndex={0}
          icon={<UserIcon className="w-5 h-5 text-white" />}
        />
      )}

      {/* Judge Information */}
      {Object.keys(judgeInfo).length > 0 && (
        <ReviewCard
          title="Complaint Information"
          description="Judge/Case info"
          data={judgeInfo}
          fields={[
            { key: 'judgeFullName', label: 'Judge or Council Full Name' },
            { key: 'servingPlace', label: 'Where the judge was serving' },
            { key: 'caseType', label: 'Case Type' },
            { key: 'caseFileNumber', label: 'Case File Number' },
            { key: 'incidentDate', label: 'Time of the incident' }
          ]}
          stepIndex={0}
          icon={<DocumentTextIcon className="w-5 h-5 text-white" />}
        />
      )}

      {/* Description Information */}
      {Object.keys(description).length > 0 && (
        <ReviewCard
          title="Description"
          description="Circumstances and damage"
          data={description}
          fields={[
            { key: 'description', label: 'Circumstances in which the act corrupt became known' },
            { key: 'damageDescription', label: 'Damage Caused Due to the Corruption' }
          ]}
          stepIndex={1}
          icon={<DocumentTextIcon className="w-5 h-5 text-white" />}
        />
      )}

      {/* Witness Information */}
      {witnessInfo.witnesses && witnessInfo.witnesses.length > 0 && (
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-gray-200 hover:border-primary transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <Typography variant="h6" className="text-gray-900 text-sm sm:text-base">
                  Witness Info
                </Typography>
                <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
                  Witness person information
                </Typography>
              </div>
            </div>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => handleEdit(2)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </div>
          
          <div className="space-y-2">
            {witnessInfo.witnesses.map((witness, index) => (
              <div key={witness.id || index} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Typography variant="small" className="text-gray-900 truncate" style={{ width: '250px', minWidth: '250px' }}>
                      {witness.fullName || 'Not provided'}
                    </Typography>
                    <Typography variant="small" className="text-gray-600 truncate" style={{ width: '250px', minWidth: '250px' }}>
                      {witness.phoneNumber || 'Phone not provided'}
                    </Typography>
                    {witness.signature && (
                      <span className="ml-2 text-green-600 whitespace-nowrap flex-shrink-0">• Signature uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      {documents && documents.documents && documents.documents.length > 0 && (
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-gray-200 hover:border-primary transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <Typography variant="h6" className="text-gray-900 text-sm sm:text-base">
                  Evidences
                </Typography>
                <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
                  Evidence Supporting the Claim 
                </Typography>
              </div>
            </div>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => handleEdit(3)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="text-gray-500 font-medium">
                Attached File:
              </Typography>
              <div className="mt-2 space-y-2">
                {documents.documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <Typography variant="small" className="text-gray-900 font-medium truncate">
                        {doc.name}
                      </Typography>
                      <Typography variant="small" className="text-gray-500 whitespace-nowrap">
                        ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </div>
                    <Button
                      variant="text"
                      size="sm"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 p-1"
                      onClick={() => handlePreviewFile(doc)}
                    >
                      <EyeIcon className="w-4 h-4" />
                      {/* <span className="text-xs">View</span> */}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {documents.damageDescription && (
              <div>
                <Typography variant="small" className="text-gray-500 font-medium">
                  Additional Explanation:
                </Typography>
                <Typography variant="small" className="text-gray-900 mt-1 break-words">
                  {documents.damageDescription}
                </Typography>
              </div>
            )}
            {documents.signature && (
              <div>
                <Typography variant="small" className="text-gray-500 font-medium">
                  Digital Signature:
                </Typography>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-16 h-12 border rounded overflow-hidden">
                    <img 
                      src={URL.createObjectURL(documents.signature)} 
                      alt="Signature preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Typography variant="small" className="text-gray-900 font-medium">
                    {documents.signature.name}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Final Review Note */}
      <Card className="p-4 sm:p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
            <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <Typography variant="h6" className="text-primary text-sm sm:text-base">
            Final Review
          </Typography>
        </div>
        <Typography variant="small" className="text-primary text-xs sm:text-sm">
          Please ensure all information is accurate before submitting. Once submitted, you will receive a confirmation.
        </Typography>
      </Card>
      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal 
          file={previewModal.file} 
          onClose={closePreviewModal} 
        />
      )}
    </div>
  );
};

ReviewStep.propTypes = {
  formData: PropTypes.object.isRequired,
  onEditStep: PropTypes.func,
};

export default ReviewStep;
