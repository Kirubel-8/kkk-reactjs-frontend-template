import { useLoading } from "@/loading-context";
import RejectionCard from "@/widgets/cards/rejection-card";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Button, Card, Typography } from "@material-tailwind/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import { default as requestService } from "../../service/request.service";
import ConfirmDialog from "./delete-modal";

export function RequestDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    newIsExpanded,
    request_id,
    selectedRequestData: initialSelectedRequestData,
  } = location.state || {};
  const [requestsData, setRequestsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [requestId, setRequestId] = useState();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const [selectedDocumentStatus, setSelectedDocumentStatus] = useState(null);
  const { startLoading, stopLoading } = useLoading();
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandLoadingState, setExpandLoadingState] = useState({});
  const [selectedRequestData, setSelectedRequestData] = useState();
  const [selectedTab, setSelectedTab] = useState("all");

  const handleIconClick = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleBackClick = () => {
    startLoading();
    setTimeout(() => {
      stopLoading();
      navigate("/home/requests");
    }, 500);
  };

  const handleDeleteNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 1000);
  };

  const handleDeleteClick = (e, request_id) => {
    e.stopPropagation();
    setRequestId(request_id);
    setOpenConfirmDialog(true);
  };
  useEffect(() => {
    if (initialSelectedRequestData) {
      setSelectedRequestData(initialSelectedRequestData);
    }
  }, [initialSelectedRequestData]);

  const filteredDocuments = selectedRequestData?.documents?.filter(
    (document) => {
      if (selectedTab === "all") return true;
      return document.status === selectedTab;
    }
  );

  const handleConfirmDelete = async () => {
    setOpenConfirmDialog(false);
    startLoading();
    try {
      const response = await requestService.deleteRequest(requestId);
      if (response.status === 204) {
        toast.success("Request deleted successfully", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2500);
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

  const handleDocumentSelect = (
    document_id,
    selectedDocument,
    documentName,
    document_status,
    rejection_reason
  ) => {
    setSelectedDocumentId(document_id);
    setSelectedDocument(selectedDocument);
    setSelectedDocumentName(documentName);
    setSelectedDocumentStatus(document_status);
    setRejectionReasons(rejection_reason);
    console.log(rejection_reason);
  };

  const handleNavigation = (path) => {
    startLoading();
    setTimeout(() => {
      navigate(path);
      stopLoading();
    }, 100);
  };

  return (
    <div>
      {
        <div className="container mx-auto">
          <div className=" px-6 py-3 rounded-lg ">
            <Typography
              variant="h6"
              className="text-xl font-semibold text-gray-700"
            >
              F.D.R.E Council Of Constitutional Inquiry - Complaint Details
            </Typography>

            <Typography variant="body5" className="text-gray-600 mt-2">
              Complaint Document Overview: Below are the details of the
              complaint documents. Please review the information carefully.
            </Typography>
          </div>
          <div>
            {isExpanded && (
              <>
                {" "}
                <div className="">
                  <Button
                    onClick={handleBackClick}
                    variant="text"
                    className="flex items-center gap-2  mt-2 text-blue-500 underline hover:text-blue-500 hover:bg-transparent focus:outline-none focus:ring-0 active:text-blue-500 active:bg-transparent"
                  >
                    <ArrowLeftIcon className="h-3 w-3 text-gray-600" />
                    Back
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[2.5fr_5fr_2.5fr] gap-10 p-4 ">
                  <div className=" p-4 py-7 rounded-lg  border-2 border-gray-100">
                    <Typography
                      variant="h6"
                      color="blue-gray"
                      className="mb-5 font-medium"
                    >
                      Complaint Details.
                      <span className="text-xs text-blue-300">
                        ({selectedRequestData?.documents?.length || 0} Docs){" "}
                      </span>
                    </Typography>
                    <div className="flex gap-2 mb-4 items-center flex-wrap bg-blue-gray-50 rounded-md">
                      <span
                        onClick={() => setSelectedTab("all")}
                        className={`px-2 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out ${
                          selectedTab === "all"
                            ? "text-blue-600 font-semibold transform scale-105"
                            : "text-gray-700 hover:text-blue-600"
                        }`}
                      >
                        All
                      </span>
                      <span
                        onClick={() => setSelectedTab("approved")}
                        className={`px-2 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out ${
                          selectedTab === "approved"
                            ? "text-green-600 font-semibold transform scale-105"
                            : "text-gray-700 hover:text-green-600"
                        }`}
                      >
                        Approved
                      </span>
                      <span
                        onClick={() => setSelectedTab("rejected")}
                        className={`px-2 py-3 rounded-full text-sm font-medium cursor-pointer transition-all duration-300 ease-in-out ${
                          selectedTab === "rejected"
                            ? "text-red-600 font-semibold transform scale-105"
                            : "text-gray-700 hover:text-red-600"
                        }`}
                      >
                        Rejected
                      </span>
                    </div>

                    <div
                      className="flex flex-col gap-2 mb-4 h-[80%] "
                      style={{
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {filteredDocuments?.map((document, index) => {
                        let documentName = `${t("home.document")} (${
                          index + 1
                        })`;
                        let document_type = document.request_document_url
                          .split(".")
                          .pop();
                        let document_status = document.status;
                        let document_id = document.document_id;
                        let rejection_reason = document.rejection_reason;

                        return (
                          <button
                            key={index}
                            onClick={() =>
                              handleDocumentSelect(
                                document_id,
                                document,
                                documentName,
                                document_status,
                                rejection_reason
                              )
                            }
                            className="flex items-center gap-3 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                          >
                            <div className="w-10 h-10 flex justify-center items-center text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-200 transition-all duration-200 ease-in-out">
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
                                {/* <div className="text-xs">
                                    <div
                                      className={`
      ${document_status === "pending" ? "text-yellow-500" : ""}
      ${document_status === "approved" ? "text-green-500" : ""}
      ${document_status === "rejected" ? "text-red-500" : ""}
    `}
                                    >
                                      {document_status}
                                    </div>
                                  </div> */}
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
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg shadow-sm ">
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-10 h-10 flex justify-center items-center text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-200 transition-all duration-200 ease-in-out">
                        <DocumentIcon className="w-6 h-6" />
                      </div>
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="mb-2 font-medium"
                      >
                        Document Preview - {selectedDocumentName}
                      </Typography>

                      <span
                        className="ml-auto flex items-center gap-2 text-sm font-medium"
                        style={{
                          backgroundColor:
                            selectedDocumentStatus === "approved"
                              ? "#D1F8D1"
                              : selectedDocumentStatus === "rejected"
                              ? "#F8D1D1"
                              : selectedDocumentStatus === "pending"
                              ? "#F8E0A1"
                              : "#E0E0E0",
                          padding: "4px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        {selectedDocumentStatus === "approved" && (
                          <CheckCircleIcon className="h-5 w-5 text-green-700" />
                        )}
                        {selectedDocumentStatus === "rejected" && (
                          <XCircleIcon className="h-5 w-5 text-red-700" />
                        )}
                        {selectedDocumentStatus === "pending" && (
                          <ClockIcon className="h-5 w-5 text-orange-700" />
                        )}
                        {selectedDocumentStatus === "unknown" && (
                          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-700" />
                        )}

                        <span
                          className={`
        ${selectedDocumentStatus === "approved" ? "text-green-800" : ""}
        ${selectedDocumentStatus === "rejected" ? "text-red-800" : ""}
        ${selectedDocumentStatus === "pending" ? "text-orange-800" : ""}
        ${selectedDocumentStatus === "unknown" ? "text-gray-800" : ""}
      `}
                        >
                          {selectedDocumentStatus || "Unknown"}
                        </span>
                      </span>
                    </div>

                    <Card className="w-full h-[700px] p-2 bg-white border  shadow-inner">
                      {selectedDocument ? (
                        <div className="flex justify-center items-center w-full h-full">
                          {selectedDocument.request_document_url?.endsWith(
                            ".pdf"
                          ) ? (
                            <iframe
                              src={selectedDocument.request_document_url}
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              title="Document Preview"
                            />
                          ) : selectedDocument.request_document_url?.match(
                              /\.(jpeg|jpg|gif|png)$/
                            ) ? (
                            <img
                              src={selectedDocument.request_document_url}
                              alt="Document Preview"
                              className="object-contain w-full h-full"
                            />
                          ) : selectedDocument.request_document_url?.match(
                              /\.(doc|docx|xlsx|xls)$/
                            ) ? (
                            <div className="flex justify-center  w-full h-full">
                              {/* <DocViewer
                                style={{ width: 500, height: 800 }}
                                pluginRenderers={DocViewerRenderers}
                                documents={[
                                  {
                                    uri: "http://localhost:4000/request_uploads/ca2fb94e-bbc7-4a7e-99c4-bc5323dda386/1e0aefea-85a3-4b62-89a6-2faadf723131_1741077221336.doc",
                                    fileType: "xlsx",
                                  },
                                ]}
                                config={{
                                  header: {
                                    disableHeader: false,
                                    disableFileName: false,
                                    retainURLParams: false,
                                  },
                                }}
                              /> */}
                              <iframe
                                src={selectedDocument.request_document_url}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                title="Document Preview"
                              />
                            </div>
                          ) : (
                            <Typography variant="small" color="blue-gray">
                              {selectedDocument.request_document_url ||
                                "No preview available"}
                            </Typography>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center">
                          <Typography variant="small" color="blue-gray">
                            Select a document to preview
                          </Typography>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div className=" rounded-lg shadow-sm h-[50%] flex flex-col gap-16">
                    <Card className=" flex-1 border rounded-lg shadow-sm p-2">
                      <div className="flex flex-col gap-2">
                        <div className="text-center">
                          <Typography
                            variant="h6"
                            color="blue-gray"
                            className="font-medium"
                          >
                            {t("home.applicantDetail")}
                          </Typography>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 flex justify-center items-center text-blue-600 border rounded-lg">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-medium "
                            >
                              {selectedRequestData &&
                              selectedRequestData.applicantNames.length > 20
                                ? `${selectedRequestData.applicantNames.slice(
                                    0,
                                    20
                                  )}...`
                                : selectedRequestData &&
                                  selectedRequestData.applicantNames}{" "}
                              ({" "}
                              {selectedRequestData &&
                                selectedRequestData.request_id.slice(0, 7)}{" "}
                              )
                            </Typography>
                          </div>
                        </div>

                        <div className="px-5 pb-3">
                          <div className="flex flex-col space-y-3">
                            <div className="flex justify-between items-center">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600  transition-colors duration-200 ease-in-out"
                              >
                                {t("home.applicantName")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantNames.length > 20
                                  ? `${selectedRequestData.applicantNames.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantNames}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600  transition-colors duration-200 ease-in-out"
                              >
                                {t("home.region")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantRegions.length > 20
                                  ? `${selectedRequestData.applicantRegions.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantRegions}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600  transition-colors duration-200 ease-in-out"
                              >
                                {t("home.zone")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantZones.length > 20
                                  ? `${selectedRequestData.applicantZones.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantZones}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600 transition-colors duration-200 ease-in-out"
                              >
                                {t("home.city")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantCity.length > 20
                                  ? `${selectedRequestData.applicantCity.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantCity}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600  transition-colors duration-200 ease-in-out"
                              >
                                {t("home.subCity")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantSubCity.length > 20
                                  ? `${selectedRequestData.applicantSubCity.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantSubCity}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography
                                variant="small"
                                className="font-medium text-gray-600  transition-colors duration-200 ease-in-out"
                              >
                                {t("home.woreda")}
                              </Typography>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-medium text-blue-600 truncate"
                              >
                                {selectedRequestData &&
                                selectedRequestData.applicantWoredas.length > 20
                                  ? `${selectedRequestData.applicantWoredas.slice(
                                      0,
                                      20
                                    )}...`
                                  : selectedRequestData &&
                                    selectedRequestData.applicantWoredas}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="  h-80 border rounded-lg shadow-sm p-2 mb-3">
                      {" "}
                      <Typography
                        variant="h6"
                        color="blue-gray"
                        className="mb-2 mx-4 font-medium"
                      >
                        Feedback
                      </Typography>
                      <div
                        className="mt-5 pb-6"
                        style={{
                          overflowY: "auto",
                          scrollbarWidth: "none",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        {rejectionReasons.map((reason, index) => (
                          <RejectionCard
                            key={index}
                            // profileName={reason.profileName}
                            date={
                              reason.date
                                ? format(new Date(reason.date), "MMMM dd, yyyy")
                                : null
                            }
                            rejectionReason={reason.reason}
                            rejectionReasonDescription={reason.description}
                            feedback={reason.description}
                          />
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      }

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Zoom}
      />
      <ConfirmDialog
        open={openConfirmDialog}
        onClose={handleCloseDialog}
        onConfirm={() => handleConfirmDelete(requestId)}
        title={t("home.deleteTitle")}
        description={t("home.deleteDescription")}
      />
    </div>
  );
}

export default RequestDetails;
