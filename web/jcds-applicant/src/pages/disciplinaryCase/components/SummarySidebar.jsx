import React, { useState } from "react";
import { Card, Typography, Button } from "@material-tailwind/react";
import { PencilIcon, EyeIcon } from "@heroicons/react/24/solid";
import PropTypes from "prop-types";

const SummarySidebar = ({ formData = {}, currentStep = 0 }) => {
  const { personalInfo = {}, judgeInfo = {}, witnessInfo = {}, documents = [] } = formData;
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

  const SummaryCard = ({ title, description, data, fields }) => (
    <Card className="p-3 mb-3">
      <Typography variant="small" className="text-gray-900 mb-2 font-semibold text-base">
        {title}
      </Typography>
      
      <div className="space-y-2">
        {fields.map((field) => {
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
        })}
      </div>
    </Card>
  );

  return (
    <div className="space-y-3">
      {/* Personal Information - Show if completed */}
      {Object.keys(personalInfo).length > 0 && (
        <SummaryCard
          title="Personal Information"
          description="Completed personal information"
          data={personalInfo}
          fields={[
            { key: 'fullName', label: 'Complaint Full Name' },
            { key: 'phoneNumber', label: 'Phone Number' },
            { key: 'caseType', label: 'Case Type' },
            { key: 'zone', label: 'Zone/Sub City' },
            { key: 'region', label: 'Region/City Administration' },
            { key: 'woreda', label: 'Woreda' }
          ]}
        />
      )}

      {/* Judge Information - Show if completed */}
      {Object.keys(judgeInfo).length >= 0 && (
        <SummaryCard
          title="Disciplinary Complaint Info"
          description="Judge/case complaint info"
          data={judgeInfo}
          fields={[
            { key: 'judgeFullName', label: 'Judge Full Name' },
            { key: 'servingPlace', label: 'Court office where the judge was serving' },
            { key: 'caseFileNumber', label: 'Case File Number' },
            { key: 'description', label: 'Complaint issued description' }
          ]}
        />
      )}

      {/* Witness Information - Show if completed */}
      {witnessInfo.witnesses && witnessInfo.witnesses.length > 0 && (
        <Card className="p-3 mb-3">
          <Typography variant="small" className="text-gray-900 mb-2 font-semibold text-base">
            Witness Info..
          </Typography>
          
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

      {/* Documents - Show if completed */}
      {documents && documents.documents && documents.documents.length > 0 && false && (
        <Card className="p-3 mb-3">
          <Typography variant="small" className="text-gray-900 mb-2 font-semibold text-base">
            Evidences
          </Typography>
          
          <div className="space-y-2">
            <div>
              <Typography variant="small" className="text-gray-500 text-sm">
                Documents:
              </Typography>
              <div className="mt-2 space-y-2">
                {documents.documents && documents.documents.map((doc, index) => (
                  <div key={doc.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Typography variant="small" className="text-gray-900 text-sm">
                      {doc.name}
                    </Typography>
                    {doc.size && (
                      <Typography variant="small" className="text-gray-500 text-sm">
                        ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {documents.additionalInformation && (
              <div>
                <Typography variant="small" className="text-gray-500 text-sm">
                  Additional Information:
                </Typography>
                {(() => {
                  const textId = "documents-additionalInformation";
                  const fullText = documents.additionalInformation;
                  const isExpanded = expandedTexts[textId];
                  const isTruncated = isTextTruncated(fullText);
                  const displayText = isExpanded ? fullText : truncateText(fullText);
                  
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Review Section - Show only on last step */}
      {currentStep === 2 && (
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
      )}
    </div>
  );
};

SummarySidebar.propTypes = {
  formData: PropTypes.object,
  currentStep: PropTypes.number,
};

export default SummarySidebar;
