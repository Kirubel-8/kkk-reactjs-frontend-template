import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { Typography } from "@material-tailwind/react";

const LivePreview = ({
  applicants,
  respondents,
  representativeName,
  representativeGender,
  representativePhone,
  representativePhoneAdditional,
  representativeIdFile,
  representativeIdBackFile,
  representationLetterFile,
  courtCaseResultReference,
  caseTypeId,
  caseTypes,
  violatedConstitutionArticle,
  affairDescription,
  otherApplicableLaws,
  constitutionalComplaintSummary,
  complaintDocumentFiles,
  getRegionName,
  getZoneName,
  getWoredaName,
  getResZoneName,
  getResWoredaName,
}) => {
  return (
    <div className=" md:w-1/4 bg-[#AFC6FD3D] p-6 rounded-lg border-2">
      <h5 className="text-xl font-semibold text-blue-900 mb-4 text-center">
        Live Preview
      </h5>
      <p className="text-gray-700 mb-12 text-sm font-thin">
        View the data entered in the form in real-time as you fill it out.
      </p>

      <div className="space-y-6 overflow-y-auto h-[calc(100vh-200px)] scrollbar-hide">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Typography
            variant="h6"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            Applicants
          </Typography>
          {applicants.map((applicant, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Name
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {applicant.name || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Phone
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {applicant.phone || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Region
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {getRegionName(applicant.region) || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Zone
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {getZoneName(applicant.zone) || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Woreda
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {getWoredaName(applicant.woreda) || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Other Address
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {applicant.otherAddress || "N/A"}
                  </Typography>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Typography
            variant="h6"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            Representative Details
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Name
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {representativeName || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Gender
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {representativeGender || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Phone
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {representativePhone || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Additional Phone
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {representativePhoneAdditional || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                ID Front
              </Typography>
              {representativeIdFile ? (
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <Typography variant="paragraph" className="text-gray-800">
                    {representativeIdFile.name || "ID Front"}
                  </Typography>
                </div>
              ) : (
                <Typography
                  variant="paragraph"
                  className="text-gray-500 italic"
                >
                  None
                </Typography>
              )}
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                ID Back
              </Typography>
              {representativeIdBackFile ? (
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <Typography variant="paragraph" className="text-gray-800">
                    {representativeIdBackFile.name || "ID Back"}
                  </Typography>
                </div>
              ) : (
                <Typography
                  variant="paragraph"
                  className="text-gray-500 italic"
                >
                  None
                </Typography>
              )}
            </div>
            {representationLetterFile && (<div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Representation Letter
              </Typography>
              {representationLetterFile ? (
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  <Typography variant="paragraph" className="text-gray-800">
                    {representationLetterFile.name || "Representation Letter"}
                  </Typography>
                </div>
              ) : (
                <Typography
                  variant="paragraph"
                  className="text-gray-500 italic"
                >
                  None
                </Typography>
              )}
            </div>)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Typography
            variant="h6"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            Respondents Details
          </Typography>
          {respondents.map((respondent, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-lg p-4 bg-gray-50 mb-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Name
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {respondent.name || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Phone
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {respondent.phone || "N/A"}
                  </Typography>
                </div>

                <div>
                  <Typography
                    variant="small"
                    className="font-medium text-gray-500 uppercase text-xs"
                  >
                    Other Address
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-800">
                    {respondent.otherAddress || "N/A"}
                  </Typography>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Complaint Details Preview */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Typography
            variant="h6"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            Complaint Details
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Court Case Reference
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {courtCaseResultReference || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Case Type
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {caseTypes.find((type) => type.case_type_id === caseTypeId)
                  ?.name || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Violated Constitution Article
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {violatedConstitutionArticle || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Affair Description
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {affairDescription || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Other Applicable Laws
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {otherApplicableLaws || "N/A"}
              </Typography>
            </div>
            <div>
              <Typography
                variant="small"
                className="font-medium text-gray-500 uppercase text-xs"
              >
                Complaint Summary
              </Typography>
              <Typography variant="paragraph" className="text-gray-800">
                {constitutionalComplaintSummary || "N/A"}
              </Typography>
            </div>
          </div>
        </div>

        {/* Attached Documents Preview */}
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <Typography
            variant="h6"
            className="text-base font-semibold text-gray-800 mb-2"
          >
            Attached Documents
          </Typography>
          <Typography
            variant="small"
            className="font-medium text-gray-500 uppercase text-xs mb-2"
          >
            Files ({complaintDocumentFiles.length})
          </Typography>
          {complaintDocumentFiles.length > 0 ? (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              {complaintDocumentFiles.map((file, index) => (
                <div
                  key={index}
                  className="p-3 flex items-center gap-3 hover:bg-gray-50"
                >
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <Typography
                    variant="paragraph"
                    className="font-medium text-gray-800 truncate"
                  >
                    {file.name || `Document ${index + 1}`}
                  </Typography>
                  <span className="ml-auto text-xs text-gray-500">
                    {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Typography variant="paragraph" className="text-gray-500">
              No files attached
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
