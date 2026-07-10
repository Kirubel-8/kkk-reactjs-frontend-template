import { useLoading } from "@/loading-context";
import requestService from "@/service/request.service";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
// import { Grid } from "@material-ui/core";
import {
  Box,
  Button,
  Modal,
  Paper,
  Tab,
  Tabs,
  Grid,
  Tooltip,
  CircularProgress,
  IconButton,
  Avatar,
} from "@mui/material";
import { jwtDecode } from "jwt-decode";
// import { OBS_DOCUMENT_BASE_URL, OBS_BUCKET_NAME } from "../../../config";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import InternalRequestHandler from '../../../../cci/src/pages/component-overview/InternalRequest/InternalRequestHandler';
import {
  StatisticsCardApplicant,
  StatisticsCardRepresentative,
  StatisticsCardStatus,
} from "@/widgets/cards";
import RejectionCard from "@/widgets/cards/rejection-card";
import { Chip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import StatisticsCardRespondent from "@/widgets/cards/statistics-card-respondent";
import { Card, Typography } from "@material-tailwind/react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { format } from "date-fns";
import {
  ArrowUpOnSquareIcon,
  ClockIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import CloseIcon from "@mui/icons-material/Close";
import { PhoneXMarkIcon } from "@heroicons/react/24/outline";
import { Close, FiberManualRecord, InsertDriveFile } from "@mui/icons-material";
export const ApplicantDetail = () => {
  const { t } = useTranslation();
  const { state } = useLocation();
  const request_id = state?.fullRequestId;
  const [requestsData, setRequestsData] = useState({});
  const { startLoading, stopLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [expandLoadingState, setExpandLoadingState] = useState({});
  const [selectedTab, setSelectedTab] = useState("all");

  const [openDocModal, setOpenDocModal] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState(null);
  const [selectedDocumentStatus, setSelectedDocumentStatus] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);

  const handlePreview = (documentUrl) => {
    setSelectedDocumentUrl(documentUrl);
    setIsModalOpen(true);
  };

  const document_type_mapping = {
    representativeId: "id",
    representationLetter: "representation letter",
    complaintDocument: "complaint document",
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onReuploadSuccess = () => {
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      const token = localStorage.getItem("customerAccountToken");

      if (!token) {
        toast.error("User is not logged in", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
        return;
      }

      if (!uploadedFile || !request_id) {
        toast.error("Please select a file to upload", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      const requestData = {
        document: uploadedFile,
        request_id: request_id,
        document_id: selectedDocumentId,
        document_type: selectedDocument.document_type,
        user_id: userId,
        status: "pending",
      };

      const response = await requestService.reuploadRequest(requestData);

      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onReuploadSuccess) {
        onReuploadSuccess();
        toast.success("Document reuploaded successfully!", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
          transition: Zoom,
        });
      }
    } catch (error) {
      console.error("Reupload failed:", error);
      setUploadError("Failed to reupload document");
    } finally {
      setIsUploading(false);
    }
  };
  const getChipStyle = (status) => {
    const normalized = status.toLowerCase();

    const styles = {
      approved: {
        backgroundColor: "#DFF5E1",
        color: "#2E7D32",
        fontWeight: "bold",
      },
      verified: {
        backgroundColor: "#DFF5E1",
        color: "#2E7D32",
        fontWeight: "bold",
      },
      rejected: {
        backgroundColor: "#FFEBEE",
        color: "#D32F2F",
        fontWeight: "bold",
      },
      pending: {
        backgroundColor: "#FFF8E1",
        color: "#F9A825",
        fontWeight: "bold",
      },
      replaced: {
        backgroundColor: "#FFF8E1",
        color: "#F9A825",
        fontWeight: "bold",
      },
      check: {
        backgroundColor: "#E3F2FD",
        color: "#1976D2",
        fontWeight: "bold",
        size: "small",
      },
    };

    return (
      styles[normalized] || {
        backgroundColor: "#e0e0e0",
        color: "#424242",
        fontWeight: "bold",
      }
    );
  };
  const triggerFileInput = () => {
    document.getElementById("fileInput").click();
  };

  const handleExpandToggle = (expanded, id, requestsData) => {
    setExpandLoadingState((prevState) => ({
      ...prevState,
      [id]: true,
    }));

    const shortId = id.slice(0, 8);

    setTimeout(() => {
      setIsExpanded(expanded);
      setExpandLoadingState((prevState) => ({
        ...prevState,
        [id]: false,
      }));
      if (expanded) {
        navigate(`/home/request-details/${shortId}`, {
          state: {
            expanded,
            id: shortId,
            requestsData,
          },
        });
      }
    }, 1000);
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

  const handleDelete = async (requestId) => {
    setTimeout(() => {
      startLoading();
      setRequestsData((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== requestId)
      );
      stopLoading();
    }, 2000);
    await fetchRequestsData();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-green-700 ml-2" title="Approved">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-500 ml-2" title="Rejected">
            Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="text-yellow-800 ml-2" title="Pending">
            Pending
          </span>
        );
    }
  };
  const handleDocumentSelect = async (
    document_id,
    selectedDocument,
    documentName,
    document_status,
    rejection_reason
  ) => {
    setSelectedDocument(selectedDocument);
    if (selectedDocument?.request_document_url) {
      try {
        const signedUrl = await requestService.getObsRequestDocumentUrl(
          selectedDocument.request_document_url
        );
        setSelectedDocUrl(signedUrl);
      } catch (error) {
        console.error("Could not load document preview:", error);
      }
    }
    if (documentName.startsWith("Representative Id")) {
      setSelectedDocumentName("ID");
    } else if (documentName === "Representation Letter") {
      setSelectedDocumentName("Letter");
    } else if (documentName === "Document") {
      setSelectedDocumentName("Document");
    } else {
      setSelectedDocumentName(documentName);
    }
    setSelectedDocumentStatus(document_status);
    setRejectionReasons(rejection_reason);
    setOpenDocModal(true);
    setShowRejectionForm(false);
  };

  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        setLoading(true);
        startLoading();
        const data = await requestService.getRequestById(request_id);
        const request = data;
        const documentStatusCount = await fetchDocumentStatusCount(
          request.request_id
        );
        const requestDocuments = await fetchDocuments(request.request_id);
        const complaintDocuments = requestDocuments.filter(
          (document) => document.document_type === "complaint document"
        );
        const representativeDocuments = requestDocuments.filter(
          (document) => document.document_type !== "complaint document"
        );

        const enrichedRequest = {
          ...request,
          documents: complaintDocuments,
          representativeDocuments: representativeDocuments,
          documentStatusCount,
        };

        setRequestsData(enrichedRequest);
        if (data.archives && data.archives.length > 0) {
          const caseId = data.archives[0].caseId;
          setCaseId(caseId);
        }
        setTimeout(() => {
          setLoading(false);
        }, 3000);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        stopLoading();
      } catch (error) {
        console.error("Error fetching request data:", error);
        stopLoading();
      } finally {
        stopLoading();
      }
    };
    fetchRequestsData();

    const fetchDocuments = async () => {
      try {
        const response = await requestService.getRequestDocuments(request_id);
        setDocuments(response.documents);
        return response.documents;
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    if (request_id) {
      fetchDocuments();
    }
  }, [request_id]);
  const filteredDocuments = requestsData?.documents?.filter((document) => {
    if (selectedTab === "all") return true;
    return document.status === selectedTab;
  });

  const filteredRepDocuments = requestsData?.representativeDocuments?.filter(
    (document) => {
      if (selectedTab === "all") return true;
      return document.status === selectedTab;
    }
  );

  const sectionTitles = {
    applicant_attachments: "Applicant Attachments",
    representative_docs: "Representative Attachments",
    complaint_document: "Case Attachments",
    attachment: "Internal Attachments",
  };

  const groupedDocs = requestsData?.requestDocuments?.reduce((acc, doc) => {
    let normalizedType = doc.document_type.toLowerCase().replace(/\s+/g, "_");

    if (["id_file_front_url", "id_file_back_url"].includes(normalizedType)) {
      normalizedType = "applicant_attachments";
    }

    if (normalizedType === "id" || normalizedType === "representation_letter") {
      normalizedType = "representative_docs";
    }

    if (!acc[normalizedType]) acc[normalizedType] = [];
    acc[normalizedType].push(doc);
    return acc;
  }, {});

  const [tabValues, setTabValues] = useState(() =>
    Object.keys(sectionTitles).map(() => 0)
  );
  const handleTabChange = (sectionIndex, newValue) => {
    setTabValues((prev) => {
      const updated = [...prev];
      updated[sectionIndex] = newValue;
      return updated;
    });
  };
  const getFileExtension = (url) => {
    return url.slice(((url.lastIndexOf(".") - 1) >>> 0) + 2);
  };
  return (
    <div className="mx-0 md:mx-8">
      <NavLink to={`/home/requests`}>
        <div className="flex items-center gap-2 mt-11 text-blue-400  hover:text-blue-500 hover:bg-transparent focus:outline-none focus:ring-0 active:text-blue-500 active:bg-transparent cursor-pointer">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          <span className=" font-semibold text-sm">Request Detail</span>
        </div>
      </NavLink>
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

      <div className="mt-2">
        {requestsData &&
          Object.keys(requestsData).length > 0 &&
          (() => {
            const {
              icon,
              applicantNames,
              applicantType,
              applicantRegions,
              applicantZones,
              applicantWoredas,
              applicantCity,
              applicantSubCity,
              archives,
              respondentRegions,
              respondentZones,
              respondentWoredas,
              respondentCities,
              respondentSubCities,
              respondentPhoneNumber,
              respondentAddress,
              status,
              representative_name,
              phone,
              phone_additional,
              gender,
              respondentNames,
              request_date,
              request_id,
              requestDocuments,
              documentStatusCount,
              violated_constitution_article,
              affair_description,
              constitutional_complaint_summary,
              court_case_result_reference,
            } = requestsData;
            return (
              <div key={request_id}>
                <div
                  className="py-4"
                  style={{
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="flex space-x-4 min-w-max">
                    <div className="flex flex-col sm:flex-row sm:space-x-6 mb-2 bg-[#AFC6FD3D] p-4 rounded-lg shadow-sm hover:shadow-sm transition-all w-full ">
                      <StatisticsCardApplicant
                        icon={React.createElement(icon, {
                          className: "w-6 h-6 text-blue-500",
                        })}
                        applicantName={applicantNames}
                        applicantType={applicantType}
                        applicantRegions={applicantRegions}
                        applicantZones={applicantZones}
                        applicantWoredas={applicantWoredas}
                        applicantCity={applicantCity}
                        applicantSubCity={applicantSubCity}
                        status={status}
                        representative={representative_name}
                        respondentName={respondentNames}
                        requestDate={request_date}
                        request_id={request_id}
                        onDelete={handleDelete}
                        className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                      />
                      <StatisticsCardRepresentative
                        icon={React.createElement(icon, {
                          className: "w-6 h-6 text-blue-500",
                        })}
                        documents={requestDocuments}
                        applicantName={applicantNames}
                        status={status}
                        representative={representative_name}
                        phone={phone}
                        phone_additional={phone_additional}
                        gender={gender}
                        respondentName={respondentNames}
                        requestDate={request_date}
                        request_id={request_id}
                        onDelete={handleDelete}
                        className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                      />
                      <StatisticsCardRespondent
                        icon={React.createElement(icon, {
                          className: "w-6 h-6 text-blue-500",
                        })}
                        respondentName={respondentNames}
                        respondentRegions={respondentRegions}
                        respondentZones={respondentZones}
                        respondentWoredas={respondentWoredas}
                        respondentCity={respondentCities}
                        respondentSubCity={respondentSubCities}
                        respondentPhoneNumber={respondentPhoneNumber}
                        respondentAddress={respondentAddress}
                        status={status}
                        representative={representative_name}
                        requestDate={request_date}
                        request_id={request_id}
                        onDelete={handleDelete}
                        className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                      />

                      <StatisticsCardStatus
                        icon={React.createElement(icon, {
                          className: "w-6 h-6 text-blue-500",
                        })}
                        archives={archives}
                        applicantName={applicantNames}
                        status={status}
                        representative={representative_name}
                        respondentName={respondentNames}
                        requestDate={request_date}
                        violated_constitution_article={
                          violated_constitution_article
                        }
                        affair_description={affair_description}
                        constitutional_complaint_summary={
                          constitutional_complaint_summary
                        }
                        court_case_result_reference={
                          court_case_result_reference
                        }
                        request_id={request_id}
                        onDelete={handleDelete}
                        documentStatusCount={documentStatusCount}
                        className="flex flex-col space-y-4 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        <Card
          sx={{
            mt: 3,
            padding: 2,
            borderRadius: 2,
            border: "1px solid #cce0ff",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h5" fontWeight="bold">
                Documents
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(sectionTitles).map(([key, label], index) => {
                const docs = groupedDocs?.[key] ?? [];
                const tab = tabValues[index] || 0;
                const filteredDocs = docs.filter((doc) => {
                  const status = doc.status?.toLowerCase();
                  if (tab === 1) return status === "approved";
                  if (tab === 2) return status === "rejected";
                  return true;
                });
                let idDocumentCounter = 1;

                return (
                  <Grid item xs={12} md={3} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        backgroundColor: "#ffffff",
                        height: 320,
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          transform: "scale(1.02)",
                          boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
                          transition: "all 0.3s ease",
                        },
                      }}
                    >
                      {/* Card Header */}
                      <Box sx={{ backgroundColor: "#E7F3FF", p: 2 }}>
                        <Typography
                          sx={{ color: "#28448C", textAlign: "center" }}
                          fontWeight="bold"
                          gutterBottom
                        >
                          {label} ({docs.length} docs)
                        </Typography>
                      </Box>

                      {/* Tabs */}
                      <Box sx={{ px: 2, pt: 1 }}>
                        <Tabs
                          value={tabValues[index] || 0}
                          onChange={(e, newValue) =>
                            handleTabChange(index, newValue)
                          }
                          variant="fullWidth"
                          TabIndicatorProps={{ style: { display: "none" } }}
                          sx={{
                            backgroundColor: "#ffffff",
                            borderRadius: 2,
                            border: "1px solid rgb(182, 209, 248)",
                            padding: "6px 0",
                            mb: 1,
                            minHeight: "32px",
                            "& .MuiTab-root": {
                              minHeight: "32px",
                              textTransform: "none",
                              fontWeight: 500,
                              fontSize: "0.875rem",
                              borderRadius: 2,
                              color: "#333",
                              padding: "6px 12px",
                              transition:
                                "background-color 0.4s ease, color 0.2s ease",
                              "&:hover": {
                                backgroundColor: "#e6f0ff",
                                color: "#4475F2",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "#4475F2",
                                color: "#fff !important",
                                "&:hover": {
                                  backgroundColor: "#2f5edb",
                                  color: "#fff !important",
                                },
                              },
                            },
                          }}
                        >
                          <Tab label="All" />
                          <Tab label="Verified" />
                          <Tab label="Rejected" />
                        </Tabs>
                      </Box>

                      {/* Scrollable Content */}

                      <Box sx={{ px: 2, flexGrow: 1, overflowY: "auto" }}>
                        {filteredDocs.length > 0 ? (
                          filteredDocs.map((doc, idx) => {
                            let documentTypeName;
                            if (doc.document_type === "representation letter") {
                              documentTypeName = t("home.representationLetter");
                            } else if (doc.document_type === "id") {
                              documentTypeName = `${t(
                                "home.representativeId"
                              )} ${idDocumentCounter}`;
                              idDocumentCounter++;
                            } else {
                              documentTypeName = `${t("home.document")} (${
                                idx + 1
                              })`;
                            }

                            const documentName = documentTypeName;

                            return (
                              <Box
                                key={idx}
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                mb={1}
                                p={1}
                                borderRadius={1}
                                bgcolor="#f9f9f9"
                                onClick={() => {
                                  handleDocumentSelect(
                                    doc.request_document_id,
                                    doc,
                                    documentName,
                                    doc.status,
                                    doc.requestDocumentHasRejectionReason
                                  );
                                }}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box sx={{ backgroundColor: "#ECF2FF" }}>
                                    <PictureAsPdfIcon color="error" />
                                  </Box>
                                  <Box>
                                    <Typography variant="body2">{`${label} ${
                                      idx + 1
                                    }`}</Typography>
                                  </Box>
                                </Box>

                                {doc.status === "Check" ? (
                                  <Button variant="outlined" size="small">
                                    Check
                                  </Button>
                                ) : (
                                  <Chip
                                    label={
                                      doc.status === "approved"
                                        ? "Verified"
                                        : doc.status
                                    }
                                    size="small"
                                    sx={{
                                      px: 1.5,
                                      ...getChipStyle(doc.status),
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No document found
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}

              <Modal
                open={openDocModal}
                onClose={() => setOpenDocModal(false)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: "65%",
                    height: "90%",
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    p: 2,
                    outline: "none",
                    borderRadius: 2,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexGrow: 1,
                      overflow: "hidden",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 2.5 }}>
                      {selectedDocument ? (
                        <div className="flex justify-center items-center w-full h-full">
                          {(() => {
                            const urlWithoutQuery =
                              selectedDocUrl?.split("?")[0] || "";
                            const ext = urlWithoutQuery
                              .split(".")
                              .pop()
                              .toLowerCase();

                            if (ext === "pdf") {
                              return (
                                <iframe
                                  src={selectedDocUrl}
                                  title="Document Viewer"
                                  width="100%"
                                  height="100%"
                                  style={{ border: "none" }}
                                />
                              );
                            }

                            if (["jpeg", "jpg", "gif", "png"].includes(ext)) {
                              return (
                                <img
                                  src={selectedDocUrl}
                                  alt="Document Preview"
                                  className="object-contain w-full h-full"
                                />
                              );
                            }

                            if (["doc", "docx", "xlsx", "xls"].includes(ext)) {
                              return (
                                <div className="flex justify-center w-full h-full">
                                  <iframe
                                    src={selectedDocUrl}
                                    title="Document Viewer"
                                    width="100%"
                                    height="100%"
                                    style={{ border: "none" }}
                                  />
                                </div>
                              );
                            }

                            return (
                              <Typography variant="small" color="blue-gray">
                                {selectedDocUrl || "No preview available"}
                              </Typography>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center">
                          <Typography variant="small" color="blue-gray">
                            Select a document to preview
                          </Typography>
                        </div>
                      )}
                    </Box>

                    {/* Feedback Section */}
                    <Box sx={{ flex: 1, overflowY: "auto" }}>
                      <Typography
                        variant="h6"
                        color="blue-gray"
                        className="mb-2 mx-4 font-medium text-center"
                      >
                        Feedbacks
                      </Typography>

                      {rejectionReasons && rejectionReasons.length > 0 ? (
                        <Card className="border rounded-lg shadow-sm p-2 mb-3">
                          <Box
                            sx={{
                              mt: 2,
                              pb: 3,
                              overflowY: "auto",
                              scrollbarWidth: "none",
                              WebkitOverflowScrolling: "touch",
                            }}
                          >
                            {rejectionReasons.map((reason, index) => (
                              <RejectionCard
                                key={index}
                                date={
                                  reason.createdAt
                                    ? format(
                                        new Date(reason.createdAt),
                                        "MMMM dd, yyyy"
                                      )
                                    : null
                                }
                                rejectionReason={reason.rejectionRea}
                                rejectionReasonDescription={reason.additional_c}
                                feedback={reason.additional_c}
                              />
                            ))}
                          </Box>
                          {selectedDocumentStatus === "rejected" && (
                            <Card
                              sx={{
                                mt: 2,
                                p: 4,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 2,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                backgroundColor: "background.paper",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {!uploadedFile && (
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ color: "text.secondary" }}
                                  >
                                    Document Update Required
                                  </Typography>
                                )}

                                {!uploadedFile ? (
                                  <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<ArrowUpOnSquareIcon />}
                                    onClick={() => fileInputRef.current.click()}
                                    sx={{
                                      py: 1.5,
                                      textTransform: "none",
                                      borderStyle: "dashed",
                                      borderWidth: 1.5,
                                      borderColor: "primary.main",
                                      color: "primary.main",
                                      "&:hover": {
                                        backgroundColor: "primary.light",
                                        borderColor: "primary.dark",
                                        borderStyle: "solid",
                                      },
                                    }}
                                  >
                                    Select File to Reupload
                                  </Button>
                                ) : (
                                  <Card
                                    variant="outlined"
                                    sx={{
                                      p: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2.5,
                                      borderColor: "divider",
                                      backgroundColor: "background.paper",
                                      boxShadow:
                                        "0px 2px 8px rgba(0, 0, 0, 0.05)",
                                      borderRadius: 2,
                                      transition: "box-shadow 0.2s ease-in-out",
                                      "&:hover": {
                                        boxShadow:
                                          "0px 4px 12px rgba(0, 0, 0, 0.1)",
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <Avatar
                                        variant="rounded"
                                        sx={{
                                          // bgcolor: "primary.light",
                                          // color: "primary.main",
                                          width: 40,
                                          height: 40,
                                        }}
                                      >
                                        <InsertDriveFile fontSize="small" />
                                      </Avatar>

                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                          variant="subtitle2"
                                          sx={{
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            color: "text.primary",
                                          }}
                                        >
                                          {uploadedFile.name}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                          }}
                                        >
                                          <span>
                                            {Math.round(
                                              uploadedFile.size / 1024
                                            )}{" "}
                                            KB
                                          </span>
                                        </Typography>
                                      </Box>
                                    </Box>

                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1.5,
                                        alignItems: "center",
                                      }}
                                    >
                                      <Tooltip title="Remove file" arrow>
                                        <IconButton
                                          onClick={handleRemoveFile}
                                          size="small"
                                          sx={{
                                            color: "error.main",
                                            backgroundColor:
                                              "rgba(244, 67, 54, 0.08)",
                                            transition: "all 0.2s ease",
                                            transform: "scale(1)",
                                            "&:hover": {
                                              backgroundColor: "error.light",
                                              color: "error.dark",
                                              transform: "scale(1.1)",
                                            },
                                            "&:active": {
                                              transform: "scale(0.95)",
                                            },
                                          }}
                                        >
                                          <Close fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={handleSubmit}
                                        disabled={isUploading}
                                        startIcon={
                                          !isUploading && (
                                            <SendIcon
                                              fontSize="small"
                                              sx={{
                                                transition:
                                                  "transform 0.3s ease",
                                              }}
                                            />
                                          )
                                        }
                                        sx={{
                                          textTransform: "none",
                                          minWidth: 100,
                                          fontWeight: 600,
                                          letterSpacing: 0.5,
                                          boxShadow: "none",
                                          position: "relative",
                                          overflow: "hidden",
                                          transition:
                                            "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                                          "&:hover": {
                                            boxShadow:
                                              "0 2px 8px rgba(0, 0, 0, 0.15)",
                                            backgroundColor: "primary.dark",
                                            "& .MuiButton-startIcon": {
                                              transform: "translateX(2px)",
                                            },
                                          },
                                          "&:active": {
                                            transform: "scale(0.98)",
                                          },
                                          "&.Mui-disabled": {
                                            backgroundColor:
                                              "action.disabledBackground",
                                            color: "text.disabled",
                                            transform: "none",
                                          },
                                        }}
                                      >
                                        {isUploading ? (
                                          <>
                                            <CircularProgress
                                              size={16}
                                              sx={{
                                                mr: 1,
                                                color: "inherit",
                                                transition: "opacity 0.3s ease",
                                              }}
                                            />
                                            Uploading...
                                          </>
                                        ) : (
                                          "Submit"
                                        )}

                                        {/* Ripple effect background */}
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            background:
                                              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                                            height: "100%",
                                            width: "20%",
                                            left: "-20%",
                                            top: 0,
                                            transition: "left 0.8s ease",
                                            ".MuiButton-root:hover &": {
                                              left: "120%",
                                            },
                                          }}
                                        />
                                      </Button>
                                    </Box>
                                  </Card>
                                )}

                                {uploadError && (
                                  <Alert
                                    severity="error"
                                    sx={{
                                      mt: 1,
                                      "& .MuiAlert-message": {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      },
                                    }}
                                  >
                                    {uploadError}
                                  </Alert>
                                )}
                              </Box>
                            </Card>
                          )}
                        </Card>
                      ) : (
                        <RejectionCard
                          date={null}
                          rejectionReason={null}
                          rejectionReasonDescription={null}
                          feedback={null}
                        />
                      )}
                      <input
                        ref={fileInputRef}
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </Box>
                  </Box>
                </Box>
              </Modal>
            </Grid>
          </Box>
        </Card>
      </div>
    </div>
  );
};

export default ApplicantDetail;
