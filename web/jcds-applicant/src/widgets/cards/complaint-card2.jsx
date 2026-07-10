import { useLoading } from "@/loading-context";
import { EyeIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function ComplaintCard2({
  complaint_id,
  applicantName,
  status,
  judge_name,
  judge_court,
  case_file_number,
  case_type,
  submission_date,
  evidences = [],
  witnesses = [],
  onDelete,
  onPrint,
  onDownload,
}) {
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
        // navigate(`/home/complaint-request-details/${complaint_id}`, {
        navigate(`/home/complaint-details-v2/${complaint_id}`, {
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
        // navigate(`/home/edit-complaint-request/${complaint_id}`, {
        navigate(`/home/edit-complaint-request-v2/${complaint_id}`, {
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

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
      case "pending_director_approval": // Treat director approval as pending for user
        return {
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
          textColor: "text-orange-800",
          labelColor: "text-orange-600",
          icon: "⏳",
          text: "Pending",
        };
      case "under_investigation":
        return {
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600",
          textColor: "text-orange-800",
          labelColor: "text-orange-600",
          icon: "🔍",
          text: "Under Investigation",
        };
      case "accepted":
        return {
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
          textColor: "text-green-800",
          labelColor: "text-green-600",
          icon: "✓",
          text: "Accepted",
        };
      case "under_council_review":
        return {
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          textColor: "text-blue-800",
          labelColor: "text-blue-600",
          icon: "📋",
          text: "Under Council Review",
        };
      case "Decided":
        return {
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          textColor: "text-blue-800",
          labelColor: "text-blue-600",
          icon: "📋",
          text: "Decided",
        };
      case "rejected":
        return {
          bgColor: "bg-red-50",
          iconColor: "text-red-600",
          textColor: "text-red-800",
          labelColor: "text-red-600",
          icon: <XMarkIcon className="w-12 h-12" />,
          text: "Rejected",
        };
      case "returned":
        return {
          bgColor: "bg-red-50",
          iconColor: "text-red-500",
          textColor: "text-red-700",
          labelColor: "text-red-500",
          icon: "↩️",
          text: "Returned",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          iconColor: "text-gray-600",
          textColor: "text-gray-800",
          labelColor: "text-gray-600",
          icon: "•",
          text: status,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <>
      <Card className="rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Section - Status Indicator */}
          <div className={`${statusConfig.bgColor} w-full md:w-[28%] flex flex-col items-center justify-center p-4 sm:p-6`}>
            {/* Mobile: Horizontal layout with Case ID on left, Status on right */}
            <div className="flex flex-row md:hidden items-center justify-between w-full gap-4">
              {/* Case ID - Left side on mobile */}
              <div className="flex flex-col items-start">
                <Typography
                  variant="small"
                  className={`${statusConfig.labelColor} text-xs font-medium mb-1`}
                >
                  Complaint ID
                </Typography>
                <Typography
                  variant="small"
                  className={`${statusConfig.textColor} font-bold text-sm sm:text-base`}
                >
                  #{complaint_id ? String(complaint_id).slice(0, 8) : "N/A"}
                </Typography>
              </div>
              
              {/* Status - Right side on mobile */}
              <Typography
                variant="h6"
                className={`${statusConfig.textColor} font-bold text-sm sm:text-base whitespace-nowrap truncate max-w-[180px] text-right`}
              >
                {statusConfig.text}
              </Typography>
            </div>

            {/* Desktop: Vertical layout with Status on top, Case ID below */}
            <div className="hidden md:flex flex-col items-center justify-center">
              {/* Status - Top on desktop */}
              <Typography
                variant="h6"
                className={`${statusConfig.textColor} font-bold text-sm sm:text-base mb-4 whitespace-nowrap truncate max-w-[180px] text-center`}
              >
                {statusConfig.text}
              </Typography>
              
              {/* Case ID - Below status on desktop */}
              <Typography
                variant="small"
                className={`${statusConfig.labelColor} text-xs font-medium mb-1`}
              >
                Complaint ID
              </Typography>
              <Typography
                variant="small"
                className={`${statusConfig.textColor} font-bold text-sm sm:text-base`}
              >
                #{complaint_id ? String(complaint_id).slice(0, 8) : "N/A"}
              </Typography>
            </div>
          </div>

          {/* Right Section - Case Details */}
          <div className="bg-white w-full md:w-[72%] flex flex-col p-4 sm:p-6">
            <div className="flex-grow">
              {/* Applicant Name */}
              {/* <div className="mb-4">
                <Typography
                  variant="small"
                  className="text-xs font-medium text-gray-500 mb-1"
                >
                  APPLICANT NAME
                </Typography>
                <Typography
                  variant="h6"
                  className="font-bold text-base sm:text-lg text-gray-900"
                >
                  {applicantName || "N/A"}
                </Typography>
              </div> */}

              {/* File Number and Judge Name Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-gray-500 mb-1"
                  >
                    FILE NUMBER
                  </Typography>
                  <Typography
                    variant="small"
                    className="font-semibold text-sm text-gray-800 truncate"
                  >
                    {case_file_number || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-gray-500 mb-1"
                  >
                    JUDGE NAME
                  </Typography>
                  <Typography
                    variant="small"
                    className="font-semibold text-sm text-gray-800 truncate"
                  >
                    {judge_name || "N/A"}
                  </Typography>
                </div>
              </div>

              {/* Court Office and Case Type Row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-gray-500 mb-1"
                  >
                    COURT OFFICE
                  </Typography>
                  <Typography
                    variant="small"
                    className="font-semibold text-sm text-gray-800 truncate"
                  >
                    {judge_court || "N/A"}
                  </Typography>
                </div>
                <div>
                  <Typography
                    variant="small"
                    className="text-xs font-medium text-gray-500 mb-1"
                  >
                    CASE TYPE
                  </Typography>
                  <Typography
                    variant="small"
                    className="font-semibold text-sm text-gray-800 truncate"
                  >
                    {case_type || "N/A"}
                  </Typography>
                </div>
              </div>

              {/* Documents Row */}
              {/*<div className="mb-4">
                <Typography
                  variant="small"
                  className="text-xs font-medium text-gray-500 mb-1"
                >
                  DOCUMENTS
                </Typography>
                <Typography
                  variant="small"
                  className="font-semibold text-sm text-gray-800"
                >
                  {evidences?.length || 0} files
                </Typography>
              </div> */}
            </div>

            {/* Footer with Submission Date and View Button */}
            <div className="flex flex-row justify-between items-end mt-auto pt-4">
              <div>
                <Typography
                  variant="small"
                  className="text-xs font-medium text-gray-500 mb-1"
                >
                  SUBMISSION DATE
                </Typography>
                <Typography
                  variant="small"
                  className="font-medium text-sm text-gray-800"
                >
                  {formatDate(submission_date)}
                </Typography>
              </div>
              <div className="flex gap-2">
                {/* View Button - Always visible */}
                <button
                  onClick={handleViewDetails}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-dark transition-colors"
                >
                  <EyeIcon className="w-4 h-4 text-white" />
                  <Typography
                    variant="small"
                    className="font-medium text-sm text-white"
                  >
                    View
                  </Typography>
                </button>

                {/* Edit Button - Only for pending or returned status */}
                {(status === "pending" || status === "returned") && (
                  <button
                    onClick={handleEditRequest}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-primary hover:bg-primary-light transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 text-primary" />
                    <Typography
                      variant="small"
                      className="font-medium text-sm text-primary"
                    >
                      Edit
                    </Typography>
                  </button>
                )}
              </div>
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

ComplaintCard2.defaultProps = {
  status: "pending",
  judge_name: "N/A",
  judge_court: "N/A",
  case_file_number: "N/A",
  case_type: "N/A",
  submission_date: "N/A",
  evidences: [],
  witnesses: [],
};

ComplaintCard2.propTypes = {
  complaint_id: PropTypes.string,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  judge_name: PropTypes.string,
  judge_court: PropTypes.string,
  case_file_number: PropTypes.string,
  case_type: PropTypes.string,
  submission_date: PropTypes.string,
  evidences: PropTypes.array,
  witnesses: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onPrint: PropTypes.func,
  onDownload: PropTypes.func,
};

export default ComplaintCard2;


