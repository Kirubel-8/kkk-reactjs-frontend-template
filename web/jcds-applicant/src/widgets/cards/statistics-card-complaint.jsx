import { useLoading } from "@/loading-context";
import ConfirmDialog from "@/pages/requestManagement/delete-modal";
import requestService from "@/service/request.service";
import { DocumentIcon } from "@heroicons/react/24/solid";
import { Button, Card, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCircleNotch } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export function StatisticsCardComplaint({
  icon,
  applicantName,
  status,
  representative,
  respondentName,
  requestDate,
  isAddNew,
  request_id,
  onDelete,
  documents,
  onExpand,
  expandLoading,
}) {
  const { t } = useTranslation();
  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();
  const complaintDocIndex = useRef(1);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRequestData, setSelectedRequestData] = useState();

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 100);
  };
  const toggleExpand = async () => {
    const newIsExpanded = !isExpanded;
    setIsExpanded(newIsExpanded);

    if (onExpand && selectedRequestData) {
      await onExpand(newIsExpanded, request_id, selectedRequestData);
    }
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
  const fetchRequestsDataByRequestId = async () => {
    try {
      const data = await requestService.getRequestById(request_id);
      const documentStatusCount = await fetchDocumentStatusCount(request_id);
      const requestDocuments = await fetchDocuments(request_id);

      const complaintDocuments = requestDocuments.filter(
        (document) => document.document_type === "complaint document"
      );

      const sortedComplaintDocuments = [...complaintDocuments].sort((a, b) => {
        if (a.document_type.toLowerCase() < b.document_type.toLowerCase()) {
          return -1;
        }
        if (a.document_type.toLowerCase() > b.document_type.toLowerCase()) {
          return 1;
        }
        return 0;
      });

      const requestsWithDocuments = {
        ...data,
        documents: sortedComplaintDocuments,
        documentStatusCount,
      };
      setSelectedRequestData(requestsWithDocuments);
    } catch (error) {
      console.error("Error fetching request data:", error);
    } finally {
      stopLoading();
    }
  };

  const fetchDocumentStatusCount = async (request_id) => {
    try {
      const response =
        await requestService.getRequestDocumentStatusCount(request_id);

      const { approved, pending, rejected } = response;

      return { approved, pending, rejected };
    } catch (error) {
      console.error("Error fetching document status count:", error);
      return {
        status: "error",
        message: "Unable to fetch document status counts",
        approved: -1,
        pending: -1,
        rejected: -1,
      };
    }
  };

  const fetchDocuments = async (request_id) => {
    try {
      const response = await requestService.getRequestDocuments(request_id);
      return response.documents;
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    fetchRequestsDataByRequestId();
  }, [request_id]);

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

  const complaintDocuments = documents.filter(
    (document) => document.document_type === "complaint document"
  );

  const sortedComplaintDocuments = [...complaintDocuments].sort((a, b) => {
    if (a.document_type.toLowerCase() < b.document_type.toLowerCase()) {
      return -1;
    }
    if (a.document_type.toLowerCase() > b.document_type.toLowerCase()) {
      return 1;
    }
    return 0;
  });

  return (
    <>
      <Card className="w-72 h-[100%] border border-blue-300 rounded-lg shadow-md p-2">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-medium "
            >
              {t("home.complaintDocuments")}{" "}
              <span className="text-xs text-blue-300">
                ( {complaintDocuments?.length || 0} )
              </span>
            </Typography>
            {expandLoading ? (
              <>
                <FaCircleNotch className="w-5 h-5 animate-spin text-blue-500 mt-2" />
              </>
            ) : (
              <Button
                onClick={toggleExpand}
                variant="text"
                color="blue"
                className="mt-2 text-blue-500 underline hover:text-blue-500 hover:bg-transparent focus:outline-none focus:ring-0 active:text-blue-500 active:bg-transparent"
                style={{ paddingTop: "4px", paddingBottom: "4px" }}
              >
                {t("home.expand")}
              </Button>
            )}
          </div>

          <div
            className="flex flex-col gap-2 mb-4 h-60 "
            style={{
              overflowY: "auto",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {sortedComplaintDocuments?.map((document, index) => {
              let documentName = `${t("home.document")} (${index + 1})`;
              let document_type = document.request_document_url
                .split(".")
                .pop();
              let document_status = document.status;

              return (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-10 h-10 flex justify-center items-center text-blue-600 border border-blue-300 rounded-lg  transition-all duration-200 ease-in-out">
                    <DocumentIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left  ml-2">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 ease-in-out"
                    >
                      {documentName}
                    </Typography>
                    <div className=" gap-2 align-baseline">
                      <div className="text-xs text-gray-600">
                        {document_type}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center">
                    <div
                      className={`text-xs ${
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

StatisticsCardComplaint.defaultProps = {
  representative: false,
  status: "Pending",
  respondentName: "N/A",
  requestDate: "N/A",
  isAddNew: false,
};

StatisticsCardComplaint.propTypes = {
  icon: PropTypes.node.isRequired,
  applicantName: PropTypes.string.isRequired,
  status: PropTypes.string,
  representative: PropTypes.bool,
  respondentName: PropTypes.string,
  requestDate: PropTypes.string,
  isAddNew: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
};

export default StatisticsCardComplaint;
