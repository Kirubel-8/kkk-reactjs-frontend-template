import { useLoading } from "@/loading-context";
import ConfirmDialog from "@/pages/requestManagement/delete-modal";
import requestService from "@/service/request.service";
import { EyeIcon } from "@heroicons/react/24/solid";
import { Card } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IconButton } from "@mui/material";
import { Box, Typography, Modal } from "@mui/material"; // depending on version
import CloseIcon from "@mui/icons-material/Close";

export function StatisticsCardStatus({
  icon,
  applicantName,
  archives,
  status,
  representative,
  respondentName,
  requestDate,
  isAddNew,
  request_id,
  onDelete,
  documentStatusCount,
  violated_constitution_article,
  affair_description,
  constitutional_complaint_summary,
  court_case_result_reference,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [showFullViolatedArticle, setShowFullViolatedArticle] = useState(false);
  const [showCourtCaseResultReference, setShowCourtCaseResultReference] =
    useState(false);
  const [showFullAffairDiscrption, setShowFullAffairDiscrption] =
    useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 100);
  };
  const handleDeleteNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 1000);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setOpenConfirmDialog(true);
  };
  const handleEditNavigation = (path, state) => {
    console.log("Navigating to:", path, "with state:", state);
    startLoading();
    setTimeout(() => {
      navigate(path, { state });
      stopLoading();
    }, 1000);
  };
  const handleEditClick = () => {
    // e.stopPropagation();
    console.log(request_id);
    const id = request_id;
    handleEditNavigation("/home/edit-request", { state: { id } });
  };
  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    startLoading();
    try {
      const response = await requestService.deleteRequest(request_id);
      console.log(response);
      if (response.status === 204) {
        toast.success("Request deleted successfully");
        onDelete(request_id);
        handleDeleteNavigation("/home/requests");
      } else {
        toast.error("Failed to delete request");
        handleDeleteNavigation("/home/requests");
      }
    } catch (error) {
      toast.error("Error deleting request");
      handleDeleteNavigation("/home/requests");
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  const handleCloseDialog = () => {
    setOpenConfirmDialog(false);
  };
  const [openDetailComplaint, setOpenDetailComplaint] = useState(false);
  const handleComplaintDetail = () => {
    setOpenDetailComplaint(true);
  };
  if (isAddNew) {
    return (
      <Card
        className="border border-blue-300 flex justify-center items-center hover:shadow-lg cursor-pointer"
        onClick={() => handleNavigation("/home/new-request")}
      >
        <NavLink
          to="/home/new-request"
          className="flex items-center justify-center w-full h-full"
        >
          <Typography variant="h1" color="blue">
            +
          </Typography>
        </NavLink>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full my-2 max-w-md sm:max-w-lg lg:max-w-xl h-80  rounded-md space-y-2">
        <Card className="w-full  px-4  shadow-sm h-44">
          <div className="flex flex-col gap-2 ">
            <div className="flex justify-between items-center pt-2">
              <Typography
                variant="h6"
                color="blue-gray"
                className="font-medium"
              >
                {t("home.complaintDetail")}
              </Typography>

              <button
                onClick={handleComplaintDetail}
                className="px-3 py-1 text-sm rounded-md border transition
                   text-[#4475F2] border-[#4475F2] bg-[rgba(68,117,242,0.04)]
                   hover:bg-[#4475F2] hover:text-white"
              >
                {t("home.expand")}
              </button>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <div className="flex justify-between items-center  p-1 rounded-md">
                <Typography
                  variant="small"
                  className="text-blue-gray-600 text-[12px] font-normal"
                >
                  {t("home.courtCaseResultReference")}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-gray-800 flex items-center gap-1"
                >
                  <span className="text-xs text-blue-300">
                    {court_case_result_reference.length > 25
                      ? `${court_case_result_reference.slice(0, 25)}...`
                      : court_case_result_reference}
                  </span>
                </Typography>
              </div>

              <div className="flex justify-between items-center  p-1 rounded-md">
                <Typography
                  variant="small"
                  className="text-blue-gray-600 text-[12px] font-normal"
                >
                  {t("home.violatedConstitutionArticle")}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-gray-800 flex items-center gap-1"
                >
                  <span className="text-xs text-blue-300">
                    {violated_constitution_article.length > 25
                      ? `${violated_constitution_article.slice(0, 25)}...`
                      : violated_constitution_article}
                  </span>
                </Typography>
              </div>

              <div className="flex justify-between items-center  p-1 rounded-md">
                <Typography
                  variant="small"
                  className="text-blue-gray-600 text-[12px] font-normal"
                >
                  {t("home.affairDescription")}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-gray-800 flex items-center gap-1"
                >
                  <span className="text-xs text-blue-300">
                    {affair_description.length > 25
                      ? `${affair_description.slice(0, 25)}...`
                      : affair_description}
                  </span>
                </Typography>
              </div>

              <div className="flex justify-between items-center  p-1 rounded-md">
                <Typography
                  variant="small"
                  className="text-blue-gray-600 text-[12px] font-normal"
                >
                  {t("home.constitutionalComplainsummary")}
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-gray-800 flex items-center gap-1"
                >
                  <span className="text-xs text-blue-300">
                    {constitutional_complaint_summary.length > 20
                      ? `${constitutional_complaint_summary.slice(0, 20)}...`
                      : constitutional_complaint_summary}
                  </span>
                </Typography>
              </div>
            </div>
          </div>
        </Card>

        {!showFullViolatedArticle &&
          !showFullSummary &&
          !showFullAffairDiscrption &&
          !showCourtCaseResultReference && (
            <Card className="w-full border px-4  shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="text-left py-2">
                  <Typography
                    variant="h6"
                    color="blue-gray"
                    className="font-medium"
                  >
                    {t("home.requestStatuses")}
                  </Typography>
                </div>

                <div className="flex flex-col gap-1 mb-4 ">
                  <div
                    className={`flex justify-between items-center p-1 rounded-md ${
                      status === "Approved"
                        ? "bg-green-100"
                        : status === "Pending"
                        ? "bg-yellow-100"
                        : status === "Under Review"
                        ? "bg-orange-100"
                        : status === "Decided"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Typography variant="small" className="text-blue-gray-600">
                      {t("home.requestStatus")}
                    </Typography>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className={`font-medium ${
                        status === "Approved"
                          ? "text-green-800"
                          : status === "Pending"
                          ? "text-yellow-800"
                          : status === "Under Review"
                          ? "text-orange-800"
                          : status === "Decided"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {status === "Approved"
                        ? `✓ ${t("home.approvedRequests")}`
                        : status === "Pending"
                        ? "⌛ Pending"
                        : status === "Under Review"
                        ? "⌛ Under Review"
                        : status === "Decided"
                        ? "✓ Decided"
                        : "✗ Rejected"}
                    </Typography>
                  </div>

                  {archives && archives.length > 0 ? (
                    <div className="space-y-2">
                      {archives.map((archive, index) => (
                        <div
                          key={archive.id || index}
                          className="flex justify-between items-center bg-gray-100 p-1 rounded-md border"
                        >
                          <Typography
                            variant="small"
                            className="font-medium text-gray-700"
                          >
                            {t("home.caseStatus")}
                          </Typography>
                          <Typography
                            variant="small"
                            className={`font-semibold ${
                              archive.caseCustomerStatus === "Under Review"
                                ? "text-amber-600 bg-amber-50 px-2 py-1 rounded"
                                : archive.caseCustomerStatus ===
                                  "Under Council Review"
                                ? "text-orange-600 bg-purple-50 px-2 py-1 rounded"
                                : archive.caseCustomerStatus ===
                                  "Decision in Process"
                                ? "text-blue-600 bg-blue-50 px-2 py-1 rounded"
                                : "text-green-600 bg-green-50 px-2 py-1 rounded"
                            }`}
                          >
                            {archive.caseCustomerStatus || t("home.noStatus")}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Typography variant="small" className="text-gray-500">
                      {t("home.noCasesAvailable")}
                    </Typography>
                  )}
                </div>
              </div>
            </Card>
          )}
      </div>
      <Modal
        open={openDetailComplaint}
        onClose={() => setOpenDetailComplaint(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "1003px",
            maxHeight: "90vh",
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            borderRadius: 2,
          }}
        >
          {/* Close Icon */}
          <IconButton
            onClick={() => setOpenDetailComplaint(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#2B3674",
              fontWeight: "bold",
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Title */}
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              fontFamily: "Poppins",
              fontSize: "18px",
              color: "#3170B5",
              mb: 2,
            }}
          >
            Complaint Detail
          </Typography>

          {/* Complaint Details */}
          {[
            {
              label: t("home.courtCaseResultReference"),
              value: court_case_result_reference,
            },
            {
              label: t("home.violatedConstitutionArticle"),
              value: violated_constitution_article,
            },
            {
              label: t("home.affairDescription"),
              value: affair_description,
            },
            {
              label: t("home.constitutionalComplainsummary"),
              value: constitutional_complaint_summary,
            },
          ].map(({ label, value }, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: "#E7F3FF",
                padding: 2,
                borderRadius: 2,
              }}
            >
              <Typography
                fontWeight="bold"
                gutterBottom
                sx={{
                  color: "#3170B5",
                  fontFamily: "Poppins",
                  fontSize: "16px",
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-line",
                  fontWeight: "bold",
                  color: "#2B3674",
                }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Modal>

      <ConfirmDialog
        open={openConfirmDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="Do you really want to delete this request? This process cannot be undone."
      />
    </>
  );
}

StatisticsCardStatus.defaultProps = {
  representative: false,
  status: "Pending",
  respondentName: "N/A",
  requestDate: "N/A",
  isAddNew: false,
};

StatisticsCardStatus.propTypes = {
  icon: PropTypes.node.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  representative: PropTypes.bool,
  respondentName: PropTypes.string,
  requestDate: PropTypes.string,
  isAddNew: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
};

export default StatisticsCardStatus;
