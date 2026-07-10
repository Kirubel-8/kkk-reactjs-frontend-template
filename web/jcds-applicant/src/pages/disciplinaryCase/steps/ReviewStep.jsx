import React, { useState } from "react";
import { Card, Typography, Button } from "@material-tailwind/react";
import { 
  DocumentTextIcon, 
  PaperAirplaneIcon,
  EyeIcon,
  PencilIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import PropTypes from "prop-types";
import PreviewModal from "../../requestManagement/document-preview-modal";
import { DOCUMENT_URL } from "../../../../config";

const ReviewStep = ({ formData = {}, onEditStep }) => {
  const { personalInfo = {}, judgeInfo = {}, witnessInfo = {}, documents = {} } = formData;

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

  const ReviewCard = ({ title, description, data, fields, stepIndex, icon }) => (
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
      
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col">
            <Typography variant="small" className="text-gray-500 font-medium">
              {field.label}:
            </Typography>
            <Typography variant="small" className="text-gray-900 mt-1 break-words">
              {data[field.key] || field.defaultValue || "Not provided"}
            </Typography>
          </div>
        ))}
      </div>
    </Card>
  );

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
          Please review all the information below before submitting your disciplinary case report
        </Typography>
      </div>

      {/* Applicant Information */}
      {Object.keys(personalInfo).length > 0 && (
        <ReviewCard
          title="Applicant Information"
          description="Applicant details"
          data={personalInfo}
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
          description="Judge and case details"
          data={judgeInfo}
          fields={[
            { key: 'judgeFullName', label: 'Judge Full Name' },
            { key: 'servingPlace', label: 'Court office where the judge was serving' },
            { key: 'caseFileNumber', label: 'Case File Number' },
            { key: 'description', label: 'Complaint issued description' }
          ]}
          stepIndex={1}
          icon={<DocumentTextIcon className="w-5 h-5 text-white" />}
        />
      )}

      {/* Witness Information */}
      {witnessInfo && witnessInfo.witnesses && witnessInfo.witnesses.length > 0 && (
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-gray-200 hover:border-primary transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <Typography variant="h6" className="text-gray-900 text-sm sm:text-base">
                  Witness Information
                </Typography>
                <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
                  {witnessInfo.witnesses.length} {witnessInfo.witnesses.length === 1 ? 'witness' : 'witnesses'} added
                </Typography>
              </div>
            </div>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => handleEdit(1)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {witnessInfo.witnesses.map((witness, index) => (
              <Card 
                key={witness.id || index} 
                className="p-4 shadow-sm border border-gray-200 hover:border-primary/30 transition-colors bg-white"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-sm">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-full">
                    <Typography variant="small" className="text-gray-900 font-semibold text-sm mb-1 break-words">
                      {witness.fullName || "N/A"}
                    </Typography>
                    <Typography variant="small" className="text-gray-600 text-xs">
                      <span className="font-medium">Phone:</span> {witness.phoneNumber || "N/A"}
                    </Typography>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      {documents && ((documents.documents && documents.documents.length > 0) || documents.additionalInformation) && (
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-gray-200 hover:border-primary transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <Typography variant="h6" className="text-gray-900 text-sm sm:text-base">
                  Attached Files
                </Typography>
                <Typography variant="small" className="text-gray-600 text-xs sm:text-sm">
                  {documents.documents && documents.documents.length > 0 
                    ? `${documents.documents.length} file(s) uploaded`
                    : 'Additional information provided'
                  }
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
            {documents.documents && documents.documents.length > 0 && (
              <div>
                {/* <Typography variant="small" className="text-gray-500 font-medium">
                  Attached Files:
                </Typography> */}
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
            )}
            {documents.additionalInformation && (
              <div>
                <Typography variant="small" className="text-gray-500 font-medium">
                  Description:
                </Typography>
                <Typography variant="small" className="text-gray-900 mt-1 break-words">
                  {documents.additionalInformation}
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
