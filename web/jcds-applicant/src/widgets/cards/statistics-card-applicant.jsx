import { useLoading } from "@/loading-context";
import ConfirmDialog from "@/pages/requestManagement/delete-modal";
import requestService from "@/service/request.service";
import { UserIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const applicantTypeMap = {
  individual: "Individual",
  company: "Company",
  non_profit: "Non-Profit",
  government: "Government",
};
export function StatisticsCardApplicant({
  applicantName,
  applicantType,
  applicantRegions,
  applicantZones,
  applicantWoredas,
  applicantCity,
  applicantSubCity,
  request_id,
  onDelete,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const getLocalizedApplicantType = (type) => {
    return t(`applicantTypes.${type}`, {
      defaultValue: type,
    });
  };

  const mappedApplicantType = getLocalizedApplicantType(applicantType);
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

  return (
    <>
      <Card className="w-full my-2 max-w-md sm:max-w-lg lg:max-w-xl h-80 rounded-lg shadow-sm p-2">
        <div className="flex flex-col gap-2 ">
          <div className="text-center">
            <Typography variant="h6" color="blue-gray" className="font-medium">
              {t("home.applicantDetail")}
            </Typography>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 flex justify-center bg-[#416FE429] items-center text-[#a8bef0] border rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-medium "
              >
                {applicantName.length > 20
                  ? `${applicantName.slice(0, 20)}...`
                  : applicantName}{" "}
              </Typography>
            </div>
          </div>

          <div className="px-5 pb-3 flex gap-10 mt-5 items-center ">
            <div className="flex flex-col space-y-3">
              <div className="flex  items-center">
                <Typography
                  variant="small"
                  className="text-[12px] font-normal text-blue-gray-600 "
                >
                  {t("home.applicantName")}
                </Typography>
              </div>
              {applicantType && (
                <div className="flex  items-center">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.applicantType")}
                  </Typography>
                </div>
              )}
              {applicantRegions && (
                <div className="flex ">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.region")}
                  </Typography>
                </div>
              )}
              {applicantZones && (
                <div className="flex ">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.zone")}
                  </Typography>
                </div>
              )}
              {applicantCity && (
                <div className="flex ">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.city")}
                  </Typography>
                </div>
              )}
              {applicantSubCity && (
                <div className="flex ">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.subCity")}
                  </Typography>
                </div>
              )}
              {applicantWoredas && (
                <div className="flex ">
                  <Typography
                    variant="small"
                    className="text-[12px] font-normal text-blue-gray-600 "
                  >
                    {t("home.woreda")}
                  </Typography>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium text-[13px] text-[#003eed] truncate"
                >
                  {applicantName.length > 20
                    ? `${applicantName.slice(0, 20)}...`
                    : applicantName}
                </Typography>
              </div>
              {applicantType && (
                <div className="flex justify-between items-center">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {mappedApplicantType.length > 20
                      ? `${mappedApplicantType.slice(0, 20)}...`
                      : mappedApplicantType}
                  </Typography>
                </div>
              )}
              {applicantRegions && (
                <div className="flex justify-between">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {applicantRegions.length > 20
                      ? `${applicantRegions.slice(0, 20)}...`
                      : applicantRegions}
                  </Typography>
                </div>
              )}
              {applicantZones && (
                <div className="flex justify-between">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {applicantZones.length > 20
                      ? `${applicantZones.slice(0, 20)}...`
                      : applicantZones}
                  </Typography>
                </div>
              )}
              {applicantCity && (
                <div className="flex justify-between">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {applicantCity.length > 20
                      ? `${applicantCity.slice(0, 20)}...`
                      : applicantCity}
                  </Typography>
                </div>
              )}
              {applicantSubCity && (
                <div className="flex justify-between">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {applicantSubCity.length > 20
                      ? `${applicantSubCity.slice(0, 20)}...`
                      : applicantSubCity}
                  </Typography>
                </div>
              )}
              {applicantWoredas && (
                <div className="flex justify-between">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-medium text-[13px] text-[#003eed] truncate"
                  >
                    {applicantWoredas.length > 20
                      ? `${applicantWoredas.slice(0, 20)}...`
                      : applicantWoredas}
                  </Typography>
                </div>
              )}
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
    </>
  );
}

StatisticsCardApplicant.defaultProps = {
  representative: false,
  status: "Pending",
  respondentName: "N/A",
  requestDate: "N/A",
};

StatisticsCardApplicant.propTypes = {
  icon: PropTypes.node.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  representative: PropTypes.bool,
  respondentName: PropTypes.string,
  requestDate: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
};

export default StatisticsCardApplicant;
