import { useLoading } from "@/loading-context";
import { ExclamationTriangleIcon, EyeIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function ComplaintCardHome({
  complaint_id,
  applicantName,
  status,
  judge_name,
  judge_court,
  case_file_number,
  case_type,
  act_date,
  submission_date,
  evidences = [],
  witnesses = [],
  onDelete,
  onPrint,
  onDownload,
}) {
  // Debug logging
  console.log("ComplaintCardHome props:", {
    complaint_id,
    applicantName,
    status,
    submission_date,
    judge_name,
    judge_court
  });

  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const handleViewDetails = () => {
    if (!complaint_id) return;
    console.log("handleViewDetails called with complaint_id:", complaint_id);
    startLoading();
    setTimeout(() => {
      try {
        console.log("Navigating to:", `/home/complaint-request-details/${complaint_id}`);
        console.log("With state:", { fullComplaintId: complaint_id });
        navigate(`/home/complaint-request-details/${complaint_id}`, {
          state: { fullComplaintId: complaint_id },
        });
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Error navigating to details");
      } finally {
        stopLoading();
      }
    }, 100);
  };

  const handleEditRequest = () => {
    if (!complaint_id) return;
    startLoading();
    setTimeout(() => {
      try {
        navigate(`/home/edit-complaint-request/${complaint_id}`, {
          state: { fullComplaintId: complaint_id },
        });
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Error navigating to edit page");
      } finally {
        stopLoading();
      }
    }, 100);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!complaint_id) return;
    setOpenConfirmDialog(false);
    startLoading();
    try {
      // Call the delete function passed from parent
      await onDelete(complaint_id);
      toast.success("Complaint request deleted successfully");
    } catch (error) {
      toast.error("Error deleting complaint request");
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, "MMMM dd, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "under_investigation":
        return "bg-orange-100 text-orange-800";
      case "under_council_review":
        return "bg-purple-100 text-purple-800";
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
      case "under_council_review":
        return "🏛️ Under Council Review";
      case "accepted":
        return "✅ Accepted";
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
                <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-xs sm:text-sm"
                  >
                    #{complaint_id ? String(complaint_id).slice(0, 8) : 'N/A'}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="text-xs font-extralight"
                  >
                    Complainant Name
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
                  className="font-medium text-xs sm:text-sm"
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
                    Case File Number
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold text-sm sm:text-base truncate"
                  >
                    {case_file_number?.length > 30
                      ? `${case_file_number.slice(0, 30)}...`
                      : case_file_number || "N/A"}
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
                    {judge_court?.length > 30
                      ? `${judge_court.slice(0, 30)}...`
                      : judge_court || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-blue-gray-600"
                  >
                    Case Type
                  </Typography>
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold text-sm sm:text-base"
                  >
                    {case_type || "N/A"}
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
                  Submission Date
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                >
                  {formatDate(submission_date)}
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
              Are you sure you want to delete this complaint request? This action cannot be undone.
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

ComplaintCardHome.defaultProps = {
  status: "pending",
  judge_name: "N/A",
  judge_court: "N/A",
  case_file_number: "N/A",
  case_type: "N/A",
  act_date: "N/A",
  submission_date: "N/A",
  evidences: [],
  witnesses: [],
};

ComplaintCardHome.propTypes = {
  complaint_id: PropTypes.string,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  judge_name: PropTypes.string,
  judge_court: PropTypes.string,
  case_file_number: PropTypes.string,
  case_type: PropTypes.string,
  act_date: PropTypes.string,
  submission_date: PropTypes.string,
  evidences: PropTypes.array,
  witnesses: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onPrint: PropTypes.func,
  onDownload: PropTypes.func,
};

export default ComplaintCardHome;
