import { useLoading } from "@/loading-context";
import ApplicationModal from "@/pages/requestManagement/ApplicationModal";
import ConfirmDialog from "@/pages/requestManagement/delete-modal";
import requestService from "@/service/request.service";
import { UserIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import { Download, Print } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function StatisticsCardRespHome({
  request_type,
  other_request_source,
  icon,
  archives,
  applicantName,
  applicantRegions,
  applicantPhoneNumber,
  applicantZones,
  applicantWoredas,
  applicantCity,
  applicantSubCity,
  status,
  representative,
  respondentName,
  region,
  zone,
  city,
  subCity,
  requestDate,
  request_id,
  onDelete,
  onPrint,
  onDownload,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openAppModal, setOpenAppModal] = useState(false);

  const handleOpenApplicationModal = (e) => {
    e.stopPropagation();
    setOpenAppModal(true);
  };

  const handleCloseApplicationModal = () => {
    setOpenAppModal(false);
  };

  const handleEditNavigation = (path, fullRequestId) => {
    startLoading();
    setTimeout(() => {
      const shortId = fullRequestId.substring(0, 8);
      navigate(`${path}/${shortId}`, {
        state: { fullRequestId },
      });
      stopLoading();
    }, 100);
  };
  const handleShowMoreNavigation = (path, fullRequestId) => {
    startLoading();
    setTimeout(() => {
      const shortRequestId = fullRequestId.substring(0, 8);
      navigate(`${path}/${shortRequestId}`, {
        state: { fullRequestId },
      });
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
  const customerDecisions = archives[0]?.decision?.filter(
    (archive) => archive.decision_recipient == "senttoCustomer"
  );

  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    startLoading();
    try {
      const response = await requestService.deleteRequest(request_id);
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

  return (
    <>
      <Card className="h-80  p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex px-4 flex-col gap-2 pt-4">
          <div className="flex flex-wrap items-center  justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-14 h-14 flex justify-center bg-[#416FE429] items-center text-[#a8bef0] border rounded-lg">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[12px]"
                  >
                    #{request_id.toString().slice(0, 8)}
                    {" - "}
                    <span className="font-medium text-[10px] text-blue-500">
                      ( normal )
                    </span>
                  </Typography>
                </div>
                <div>
                  <div>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="text-[11px] font-extralight "
                    >
                      {t("home.applicantName")}
                    </Typography>
                  </div>
                  <div className="relative group ">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="text-[12px] font-medium  truncate"
                    >
                      {applicantName?.length > 10
                        ? `${applicantName.slice(0, 10)}...`
                        : applicantName}
                    </Typography>
                    <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                      {applicantName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="items-center">
              <div className="flex -mt-3 mb-2">
                {/* <Tooltip title="Appeal" placement="top" arrow>
                  <div className="w-8 h-8 flex justify-center items-center text-gray-600 hover:text-green-500 cursor-pointer">
                    <Balance fontSize="small" />
                  </div>
                </Tooltip>

                <Tooltip title="Complain" arrow>
                  <div className="w-8 h-8 flex justify-center items-center text-gray-600 hover:text-red-500 cursor-pointer">
                    <Feedback fontSize="small" />
                  </div>
                </Tooltip> */}
              </div>
              <div className="relative group">
                <div className="absolute hidden group-hover:block z-10 w-56 mt-1 right-9"></div>
              </div>
            </div>
          </div>
          <hr className="my-2 border-gray-300" />

          <div className="">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-start items-center">
                <div className="flex flex-col gap-2 w-4/6">
                  {" "}
                  <div>
                    <Typography
                      variant="small"
                      className="text-[11px] font-medium text-blue-gray-600 w-40"
                    >
                      {t("home.phoneNumber")}
                    </Typography>
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-semibold truncate text-[13px]"
                    >
                      {applicantPhoneNumber?.length > 20
                        ? `${applicantPhoneNumber.slice(0, 20)}...`
                        : applicantPhoneNumber}
                    </Typography>
                  </div>
                  <div>
                    {applicantZones && (
                      <div className="">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.zone")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold truncate text-[14px]"
                        >
                          {applicantZones?.length > 20
                            ? `${applicantZones.slice(0, 20)}...`
                            : applicantZones}
                        </Typography>
                      </div>
                    )}

                    {applicantSubCity && (
                      <div className="">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.subCity")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold text-[14px] truncate"
                        >
                          {applicantSubCity?.length > 20
                            ? `${applicantSubCity.slice(0, 20)}...`
                            : applicantSubCity}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-2/6">
                  {" "}
                  <div>
                    {applicantRegions && (
                      <div className="flex flex-col">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.region")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold text-[14px] truncate"
                        >
                          {applicantRegions?.length > 20
                            ? `${applicantRegions.slice(0, 20)}...`
                            : applicantRegions}
                        </Typography>
                      </div>
                    )}
                    {applicantCity && (
                      <div className="flex flex-col">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.city")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold text-[14px] truncate"
                        >
                          {applicantCity?.length > 20
                            ? `${applicantCity.slice(0, 20)}...`
                            : applicantCity}
                        </Typography>
                      </div>
                    )}
                  </div>
                  <div>
                    {applicantWoredas && (
                      <div className="">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.woreda")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold text-[14px] truncate"
                        >
                          {applicantWoredas?.length > 20
                            ? `${applicantWoredas.slice(0, 20)}...`
                            : applicantWoredas}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr className="my-1 border-gray-300" />
          <div className="">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2 w-4/6">
                  <div>
                    {representative && (
                      <div className="">
                        <Typography
                          variant="small"
                          className="text-[11px] font-medium text-blue-gray-600"
                        >
                          {t("home.representativeName")}
                        </Typography>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold text-[14px] truncate"
                        >
                          {representative?.length > 20
                            ? `${representative.slice(0, 20)}...`
                            : representative}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col w-2/6">
                  <div>
                    {respondentName && (
                      <div className=" flex flex-col gap-0">
                        <div className="group relative inline-block">
                          <Typography
                            variant="small"
                            className="text-[11px] font-medium text-blue-gray-600 truncate max-w-[100px]" // adjust max-w as needed
                          >
                            {t("home.respondentName").length > 10
                              ? `${t("home.respondentName").slice(0, 5)}...${t(
                                  "home.respondentName"
                                ).slice(10)}`
                              : t("home.respondentName")}
                          </Typography>
                          <span className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {t("home.respondentName")}
                          </span>
                        </div>
                        <div className="relative group inline-block max-w-[80px]">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-semibold text-[14px] truncate"
                          >
                            {respondentName.length > 20
                              ? `${respondentName.slice(0, 20)}...`
                              : respondentName}
                          </Typography>
                          <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                            {respondentName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr className="my-1 border-gray-300" />
          <div className="">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between  items-center">
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="">
                      <Typography
                        variant="small"
                        className="text-[11px] font-medium text-blue-gray-600"
                      >
                        {t("home.requestDate")}
                      </Typography>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-medium text-[9px] truncate"
                      >
                        {format(new Date(requestDate), "MMMM dd, yyyy")}
                      </Typography>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ">
                  <div
                    style={{
                      width: "160px",
                      overflowX: "auto",
                      whiteSpace: "nowrap",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        minWidth: "max-content",
                      }}
                    >
                      {status !== "Pending" && (
                        <div
                          onClick={handleOpenApplicationModal}
                          className="flex justify-between cursor-pointer items-center px-3 py-1 rounded-full bg-[#7B61FF]"
                        >
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium text-xs text-white"
                          >
                            Application
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={openConfirmDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="Do you really want to delete this request? This process cannot be undone."
      />
      <ApplicationModal
        open={openAppModal}
        onClose={handleCloseApplicationModal}
        requestId={request_id}
      />
    </>
  );
}

StatisticsCardRespHome.defaultProps = {
  representative: false,
  status: "Pending",
  respondentName: "N/A",
  requestDate: "N/A",
};

StatisticsCardRespHome.propTypes = {
  icon: PropTypes.node.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  representative: PropTypes.bool,
  respondentName: PropTypes.string,
  requestDate: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
};

export default StatisticsCardRespHome;
