import { useLoading } from "@/loading-context";
import { ScaleIcon, EyeIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function DisciplinaryCardHome({
  request_id,
  applicantName,
  status,
  judge_name,
  court_office,
  file_number,
  request_date,
  evidences = [],
  onDelete,
  onPrint,
  onDownload,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const handleViewDetails = () => {
    console.log("handleViewDetails called with request_id:", request_id);
    startLoading();
    setTimeout(() => {
      const shortId = request_id.substring(0, 8);
      console.log("Navigating to:", `/home/disciplinary-request-details/${shortId}`);
      console.log("With state:", { fullRequestId: request_id });
      navigate(`/home/disciplinary-request-details/${shortId}`, {
        state: { fullRequestId: request_id },
      });
      stopLoading();
    }, 100);
  };

  const handleEditRequest = () => {
    startLoading();
    setTimeout(() => {
      const shortId = request_id.substring(0, 8);
      navigate(`/home/edit-disciplinary-request/${shortId}`, {
        state: { fullRequestId: request_id },
      });
      stopLoading();
    }, 100);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    startLoading();
    try {
      // Call the delete function passed from parent
      await onDelete(request_id);
      toast.success("Disciplinary request deleted successfully");
    } catch (error) {
      toast.error("Error deleting disciplinary request");
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "under_investigation":
        return "bg-orange-100 text-orange-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "Decided":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "⌛ Pending";
      case "under_investigation":
        return "🔍 Under Investigation";
      case "accepted":
        return "✅ Accepted";
      case "under_council_review":
        return "🏛️ Under Council Review";
      case "Decided":
        return "📋 Decided";
      case "rejected":
        return "❌ Rejected";
      default:
        return status;
    }
  };

  return (
    <>
      <Card className="h-full rounded-lg shadow-md p-2 sm:p-3 lg:p-4 hover:shadow-lg transition-shadow overflow-hidden">
        <div className="flex px-2 sm:px-3 lg:px-4 flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 h-full">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex justify-center bg-[#416FE429] items-center text-[#a8bef0] border rounded-lg">
                <ScaleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-xs sm:text-sm"
                  >
                    #{request_id.toString().slice(0, 8)}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="text-xs font-extralight"
                  >
                    Applicant Name
                  </Typography>
                  <div className="relative group">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="text-xs sm:text-sm font-medium truncate"
                    >
                      {applicantName?.length > 30
                        ? `${applicantName.slice(0, 30)}...`
                        : applicantName}
                    </Typography>
                    <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                      {applicantName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="relative group">
              <div className={`text-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md ${getStatusColor(status)}`}>
                <Typography
                  variant="small"
                  className="font-medium text-xs sm:text-sm "
                >
                  {getStatusText(status)}
                </Typography>
              </div>
            </div>
          </div>

          <hr className="my-2 sm:my-3 border-gray-300" />

          {/* Main Content Section */}
          <div className="flex flex-col space-y-2 sm:space-y-3 flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-2">
              <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-4/6">
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-blue-gray-600"
                  >
                    File Number
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold text-sm sm:text-base truncate"
                  >
                    {file_number?.length > 30
                      ? `${file_number.slice(0, 30)}...`
                      : file_number || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-blue-gray-600"
                  >
                    Court Office
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold text-sm sm:text-base truncate"
                  >
                    {court_office?.length > 30
                      ? `${court_office.slice(0, 30)}...`
                      : court_office || "N/A"}
                  </Typography>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-2/6">
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-blue-gray-600"
                  >
                    Judge Name
                  </Typography>
                  <div className="relative group">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-semibold text-sm sm:text-base truncate"
                    >
                      {judge_name?.length > 30
                        ? `${judge_name.slice(0, 30)}...`
                        : judge_name || "N/A"}
                    </Typography>
                    <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                      {judge_name}
                    </div>
                  </div>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-blue-gray-600"
                  >
                    Documents
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold text-sm sm:text-base"
                  >
                    {evidences?.length || 0} files
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-1 sm:my-2 border-gray-300" />

          {/* Footer Section with Date and Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
            <div className="flex flex-col gap-2">
              <div>
                <Typography
                  variant="small"
                  className="text-xs font-medium text-blue-gray-600"
                >
                  Request Date
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                >
                  {request_date ? format(new Date(request_date), "MMMM dd, yyyy") : "N/A"}
                </Typography>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              {/* View Button - Always visible */}
              <button
                onClick={handleViewDetails}
                className="flex items-center gap-1 px-3 py-1.5 sm:py-1 rounded-full bg-white border border-[#4475F2] hover:bg-blue-50 transition-colors flex-1 sm:flex-none justify-center"
              >
                <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#4475F2]" />
                <Typography
                  variant="small"
                  className="font-medium text-xs sm:text-sm text-[#4475F2]"
                >
                  View
                </Typography>
              </button>

              {/* Edit Button - Only for pending status */}
              {status === "pending" && (
                <button
                  onClick={handleEditRequest}
                  className="flex items-center gap-1 px-3 py-1.5 sm:py-1 rounded-full bg-white border border-[#4475F2] hover:bg-blue-50 transition-colors flex-1 sm:flex-none justify-center"
                >
                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#4475F2]" />
                  <Typography
                    variant="small"
                    className="font-medium text-xs sm:text-sm text-[#4475F2]"
                  >
                    Edit
                  </Typography>
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {openConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this disciplinary request? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

DisciplinaryCardHome.defaultProps = {
  status: "pending",
  judge_name: "N/A",
  court_office: "N/A",
  file_number: "N/A",
  request_date: "N/A",
  evidences: [],
};

DisciplinaryCardHome.propTypes = {
  request_id: PropTypes.string.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  judge_name: PropTypes.string,
  court_office: PropTypes.string,
  file_number: PropTypes.string,
  request_date: PropTypes.string,
  evidences: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onPrint: PropTypes.func,
  onDownload: PropTypes.func,
};

export default DisciplinaryCardHome;
