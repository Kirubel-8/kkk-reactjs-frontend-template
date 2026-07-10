import React, { useState } from "react";
import { Card, Typography, Button } from "@material-tailwind/react";
import { PencilIcon, EyeIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

const SummarySidebar = ({ formData = {}, currentStep = 0 }) => {
  const { personalInfo = {},judgeInfo = {}, description = {}, witnessInfo = {}, documents = [] } = formData;
  const [expandedTexts, setExpandedTexts] = useState({});

  const handleEdit = (section, field) => {
    console.log(`Edit ${section}.${field}`);
    // Handle edit functionality here
  };

  const toggleTextExpansion = (textId) => {
    setExpandedTexts(prev => ({
      ...prev,
      [textId]: !prev[textId]
    }));
  };

  const truncateText = (text, maxWords = 10) => {
    if (!text) return "Not provided";
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const isTextTruncated = (text, maxWords = 10) => {
    if (!text) return false;
    return text.split(' ').length > maxWords;
  };

  const SummaryCard = ({ title, description, data, fields }) => {
    // Special layout for Complaint Info: two columns with a vertical divider on md+
    const isTwoColumn = title === "Complaint Info";
    const mid = Math.ceil(fields.length / 2);
    const leftFields = fields.slice(0, mid);
    const rightFields = fields.slice(mid);

    const renderField = (field) => {
      const textId = `${title}-${field.key}`;
      const fullText = data[field.key] || field.defaultValue || "Not provided";
      const isExpanded = expandedTexts[textId];
      const isTruncated = isTextTruncated(fullText);
      const displayText = isExpanded ? fullText : truncateText(fullText);

      return (
        <div key={field.key} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <Typography variant="small" className="text-gray-500 text-sm">
              {field.label}:
            </Typography>
            <Typography variant="small" className="text-gray-900 break-words text-sm">
              {displayText}
            </Typography>
            {isTruncated && (
              <Button
                variant="text"
                size="sm"
                className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs mt-1"
                onClick={() => toggleTextExpansion(textId)}
              >
                {isExpanded ? "Show less" : "Read more"}
              </Button>
            )}
          </div>
        </div>
      );
    };

    return (
      <Card className="p-3 mb-3">
        <Typography variant="small" className="text-gray-900 mb-2 font-semibold text-base">
          {title}
        </Typography>
        {/* Description removed for clarity */}

        {isTwoColumn ? (
          <div className="md:flex md:divide-x md:divide-gray-200">
            <div className="md:w-1/2 md:pr-3 space-y-2">
              {leftFields.map(renderField)}
            </div>
            <div className="md:w-1/2 md:pl-3 space-y-2">
              {rightFields.map(renderField)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map(renderField)}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      {/* Personal Information - Show if completed */}
      {Object.keys(personalInfo).length > 0 && (
        <SummaryCard
          title="Personal info"
          description="Applicant personal info"
          data={personalInfo}
          fields={[
            { key: 'fullName', label: 'Complaint Full Name *' },
            { key: 'phoneNumber', label: 'Phone Number *' },
            { key: 'caseType', label: 'Case Type *' },
            { key: 'region', label: 'Region / City Administration *' },
            { key: 'incidentDate', label: 'Submission Date *' }
          ]}
        />
      )}

      {/* Judge Information - Show if completed */}
      {Object.keys(judgeInfo).length >= 0 && (
        <SummaryCard
          title="Complaint Info"
          description="Judge/Case/Personal info"
          data={judgeInfo}
          fields={[
            { key: 'region', label: 'Complainant Address *' },
            { key: 'judgeFullName', label: 'Judge Name *' },
            { key: 'servingPlace', label: 'Court Office *' },
            { key: 'caseType', label: 'Case Type *' },
            { key: 'caseFileNumber', label: 'Case File Number *' },
            { key: 'incidentDate', label: 'Date of Offense *' }
          ]}
        />
      )}

      {/* Description Information - Show if completed */}
      {Object.keys(description).length > 0 && (
        <SummaryCard
          title="Description"
          description="Circumstances and damage"
          data={description}
          fields={[
            { key: 'description', label: 'Act Details *' },
            { key: 'damageDescription', label: 'Damage Detail *' }
          ]}
        />
      )}

      {/* Witness Information - Show if completed */}
      {witnessInfo.witnesses && witnessInfo.witnesses.length > 0 && (
        <Card className="p-3 mb-3">
          <Typography variant="small" className="text-gray-900 mb-2 font-semibold text-base">
            Witness Info..
          </Typography>
          {/* One-line items for each witness */}
          <div className="space-y-2">
            {witnessInfo.witnesses.map((witness, index) => (
              <div key={witness.id || index} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <Typography variant="small" className="text-gray-900 truncate text-sm">
                    {`Witness ${index + 1}: ${witness.fullName || 'Not provided'} — ${witness.address || 'Not provided'}`}
                    {witness.signature && (
                      <span className="ml-2 text-green-600 whitespace-nowrap text-xs">• Signature uploaded</span>
                    )}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents - Show if completed
      {documents && documents.documents && documents.documents.length > 0 && (
        <Card className="p-4 mb-4">
          <Typography variant="h6" className="text-gray-900 mb-2">
            Attach Documents
          </Typography>
          <Typography variant="small" className="text-gray-600 mb-4">
            the documents you upload..
          </Typography>
          
          <div className="space-y-3">
            <div>
              <Typography variant="small" className="text-gray-500">
                Documents:
              </Typography>
              <div className="mt-2 space-y-2">
                {documents.documents && documents.documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Typography variant="small" className="text-gray-900 font-medium">
                      {doc.name}
                    </Typography>
                    <Typography variant="small" className="text-gray-500">
                      ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
            {documents.damageDescription && (
              <div>
                <Typography variant="small" className="text-gray-500">
                  Damage Description:
                </Typography>
                <Typography variant="small" className="font-medium text-gray-900 break-words">
                  {documents.damageDescription}
                </Typography>
              </div>
            )}
          </div>
        </Card>
      )} */}

      {/* Review Section - Show only on last step */}
      {/* {currentStep === 3 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <EyeIcon className="w-4 h-4 text-white" />
            </div>
            <Typography variant="h6" className="text-blue-900">
              Review
            </Typography>
          </div>
          <Typography variant="small" className="text-blue-700 mb-3">
            Review all information before submitting
          </Typography>
          <Button
            variant="filled"
            size="sm"
            className="bg-blue-600"
          >
            Review All
          </Button>
        </Card>
      )} */}
    </div>
  );
};

SummarySidebar.propTypes = {
  formData: PropTypes.object,
  currentStep: PropTypes.number,
};

export default SummarySidebar;
