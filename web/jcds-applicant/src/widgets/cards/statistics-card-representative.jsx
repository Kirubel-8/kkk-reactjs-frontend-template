import { useLoading } from "@/loading-context";
import ConfirmDialog from "@/pages/requestManagement/delete-modal";
import requestService from "@/service/request.service";
import { UserIcon } from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function StatisticsCardRepresentative({
  icon,
  status,
  representative,
  phone,
  phone_additional,
  gender,
  requestDate,
  documents,
  isAddNew,
  request_id,
  onDelete,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

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

  const representationLetters = documents.filter(
    (document) => document.document_type === "representation letter"
  );
  const representativeIds = documents.filter(
    (document) => document.document_type === "id"
  );

  return (
    <>
      <Card className="w-full my-2 max-w-md sm:max-w-lg lg:max-w-xl h-80 rounded-lg shadow-sm p-2">
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <Typography variant="h6" color="blue-gray" className="font-medium ">
              {t("home.representativeDetail")}
            </Typography>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 flex justify-center bg-[#416FE429] items-center text-[#a8bef0] border rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="relative group inline-block max-w-[200px]">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-medium truncate"
                >
                  {representative.length > 20
                    ? `${representative.slice(0, 20)}...`
                    : representative}
                </Typography>
                <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                  {representative}
                </div>
              </div>
            </div>
          </div>

          <div
            className="px-5 pb-2 pt-2 h-[50%]"
            style={{
              overflowY: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="flex flex-col space-y-3">
              <div className=" flex gap-10 mt-3 items-center ">
                <div className="flex flex-col space-y-3">
                  <div className="group relative inline-block items-center">
                    <Typography
                      variant="small"
                      className="text-[12px] font-medium text-blue-gray-600 truncate max-w-[100px]"
                    >
                      {t("home.representativeName").length > 10
                        ? `${t("home.representativeName").slice(0, 5)}...${t(
                            "home.representativeName"
                          ).slice(10)}`
                        : t("home.representativeName")}
                    </Typography>
                    <span className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {t("home.representativeName")}
                    </span>
                  </div>

                  <div className="group relative inline-block items-center">
                    <Typography
                      variant="small"
                      className="text-[12px] font-medium text-blue-gray-600 truncate max-w-[200px]"
                    >
                      {t("home.phoneNumber").length > 20
                        ? `${t("home.phoneNumber").slice(0, 5)}...${t(
                            "home.phoneNumber"
                          ).slice(20)}`
                        : t("home.phoneNumber")}
                    </Typography>
                    <span className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {t("home.phoneNumber")}
                    </span>
                  </div>
                  <div className="group relative inline-block items-center">
                    <Typography
                      variant="small"
                      className="text-[12px] font-medium text-blue-gray-600 truncate max-w-[200px]"
                    >
                      {t("home.gender").length > 20
                        ? `${t("home.gender").slice(0, 5)}...${t(
                            "home.gender"
                          ).slice(20)}`
                        : t("home.gender")}
                    </Typography>
                    <span className="absolute hidden group-hover:block z-10 bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {t("home.gender")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="relative group inline-block max-w-[100px]">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-medium text-[13px] text-[#003eed] truncate"
                      >
                        {representative.length > 20
                          ? `${representative.slice(0, 20)}...`
                          : representative}
                      </Typography>
                      <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2  px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                        {representative}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="relative group inline-block max-w-[100px]">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-medium text-[13px] text-[#003eed] truncate"
                      >
                        {phone.length > 20 ? `${phone.slice(0, 20)}...` : phone}
                      </Typography>
                      <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                        {phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium text-[13px] text-[#003eed] truncate"
                    >
                      {gender.length > 20
                        ? `${gender.slice(0, 20)}...`
                        : gender}
                    </Typography>
                  </div>
                </div>
              </div>
              {/* {representationLetters.length > 0 && (
                <div className="mt-4 bg-[#F7F7F7] p-2 rounded-md">
                  {representationLetters.map((document, index) => {
                    let documentName = `${t("home.representationLetter")}`;
                    let document_type = document.request_document_url
                      .split(".")
                      .pop();
                    let document_status = document.status;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-10 h-10 flex justify-center items-center text-blue-600 border bg-[#4475F21F] rounded-lg  transition-all duration-200 ease-in-out">
                          <DocumentIcon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col text-left  ml-2">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium text-[10px] text-gray-800 hover:text-blue-600 transition-colors duration-200 ease-in-out"
                          >
                            {documentName}
                          </Typography>
                          <div className=" gap-2 align-baseline">
                            <div className="text-[10px] text-gray-600">
                              {document_type}
                            </div>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center">
                          <div
                            className={`text-[10px] ${
                              document_status === "pending"
                                ? "text-orange-500"
                                : document_status === "approved"
                                ? "text-green-500"
                                : document_status === "rejected"
                                ? "text-red-500"
                                : ""
                            }`}
                          >
                            {document_status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {representativeIds.length > 0 && (
                <div className="mt-4 bg-[#F7F7F7] p-2 rounded-md">
                  {representativeIds.map((document, index) => {
                    let documentName = `${t("home.representativeId")} `;
                    let document_type = document.request_document_url
                      .split(".")
                      .pop();
                    let document_status = document.status;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-10 h-10 flex justify-center items-center text-blue-600 border bg-[#4475F21F] rounded-lg  transition-all duration-200 ease-in-out">
                          <DocumentIcon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col text-left  ml-2">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium text-[10px] text-gray-800 hover:text-blue-600 transition-colors duration-200 ease-in-out"
                          >
                            {documentName}
                          </Typography>
                          <div className=" gap-2 align-baseline">
                            <div className="text-[10px] text-gray-600">
                              {document_type}
                            </div>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center">
                          <div
                            className={`text-[10px] ${
                              document_status === "pending"
                                ? "text-orange-500"
                                : document_status === "approved"
                                ? "text-green-500"
                                : document_status === "rejected"
                                ? "text-red-500"
                                : ""
                            }`}
                          >
                            {document_status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )} */}
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

StatisticsCardRepresentative.defaultProps = {
  representative: false,
  status: "Pending",
  respondentName: "N/A",
  requestDate: "N/A",
  isAddNew: false,
};

StatisticsCardRepresentative.propTypes = {
  icon: PropTypes.node.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  representative: PropTypes.bool,
  respondentName: PropTypes.string,
  requestDate: PropTypes.string,
  isAddNew: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
};

export default StatisticsCardRepresentative;
