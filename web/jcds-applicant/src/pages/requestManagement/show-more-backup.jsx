import { useLoading } from "@/loading-context";
import requestService from "@/service/request.service";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  DocumentIcon,
} from "@heroicons/react/20/solid";
import { Grid } from "@material-ui/core";
import { Box, Button, Modal, Paper, Tab, Tabs } from "@mui/material";
import { jwtDecode } from "jwt-decode";

import SendIcon from "@mui/icons-material/Send";
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

import StatisticsCardRespondent from "@/widgets/cards/statistics-card-respondent";
import {
  ArrowUpOnSquareIcon,
  ClockIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Card, Typography } from "@material-tailwind/react";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { format } from "date-fns";

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
  const [selectedRepTab, setSelectedRepTab] = useState("all");

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

  const handleDocumentSelect = (
    document_id,
    selectedDocument,
    documentName,
    document_status,
    rejection_reason
  ) => {
    setSelectedDocumentId(document_id);
    setSelectedDocument(selectedDocument);
    setSelectedDocUrl(selectedDocument.request_document_url);
    console.log("setSelectedDocUrl", selectedDocument.request_document_url);
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
  console.log("selectedDocUrl", selectedDocUrl);

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
  console.log("requestsData", requestsData.requestDocuments);
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
    applicant_document: "Applicant Attachments",
    representative_docs: "Representative Attachments",
    complaint_document: "Case Attachments",
    attachment: "Internal Attachments",
  };
  const groupedDocs = requestsData?.requestDocuments?.reduce((acc, doc) => {
    let normalizedType = doc.document_type.toLowerCase().replace(/\s+/g, "_");

    if (normalizedType === "id" || normalizedType === "representation_letter") {
      normalizedType = "representative_docs";
    }

    if (!acc[normalizedType]) acc[normalizedType] = [];
    acc[normalizedType].push(doc);
    return acc;
  }, {});
  console.log("groupedDocs", groupedDocs);
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
  console.log("selectedDocumentIdselectedDocumentId", selectedDocUrl);
  return (
    <div className="container mx-auto ">
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
              <div
                key={request_id}
                className="flex flex-col sm:flex-row sm:flex-wrap md:flex-row h-full items-center"
              >
                <div
                  className="py-4"
                  style={{
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="flex space-x-4 min-w-max">
                    <div className="flex flex-col sm:flex-row sm:space-x-6 mb-2 bg-[#AFC6FD3D] p-4 rounded-lg shadow-sm hover:shadow-sm transition-all w-full sm:w-auto">
                      <StatisticsCardApplicant
                        icon={React.createElement(icon, {
                          className: "w-6 h-6 text-blue-500",
                        })}
                        applicantName={applicantNames}
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
                                    doc.rejection_reason
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
                    {/* PDF Viewer */}
                    <Box sx={{ flex: 2.5 }}>
                      {selectedDocument ? (
                        <div className="flex justify-center items-center w-full h-full">
                          {selectedDocUrl?.endsWith(".pdf") ? (
                            <iframe
                              src={`http://localhost:4000/request_uploads/${selectedDocUrl}`}
                              title="Document Viewer"
                              width="100%"
                              height="100%"
                              style={{ border: "none" }}
                            />
                          ) : selectedDocUrl?.match(/\.(jpeg|jpg|gif|png)$/) ? (
                            <img
                              src={`http://localhost:4000/request_uploads/${selectedDocUrl}`}
                              alt="Document Preview"
                              className="object-contain w-full h-full"
                            />
                          ) : selectedDocUrl?.match(
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
                                src={`http://localhost:4000/request_uploads/${selectedDocUrl}`}
                                title="Document Viewer"
                                width="100%"
                                height="100%"
                                style={{ border: "none" }}
                              />
                            </div>
                          ) : (
                            <Typography variant="small" color="blue-gray">
                              {selectedDocUrl || "No preview available"}
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
                                  reason.date
                                    ? format(
                                        new Date(reason.date),
                                        "MMMM dd, yyyy"
                                      )
                                    : null
                                }
                                rejectionReason={reason.reason}
                                rejectionReasonDescription={reason.description}
                                feedback={reason.description}
                              />
                            ))}
                          </Box>
                        </Card>
                      ) : (
                        <RejectionCard
                          date={null}
                          rejectionReason={null}
                          rejectionReasonDescription={null}
                          feedback={null}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Modal>
            </Grid>
          </Box>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-[2.5fr_5fr_2.5fr] gap-10 p-4 ">
          <div className=" p-4 py-7 rounded-lg  border-2 border-gray-100">
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
                {t("home.verifiedDocument")}
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

            {filteredRepDocuments ? (
              filteredRepDocuments.length > 0 ? (
                <Typography
                  variant="h6"
                  color="blue-gray"
                  className="mb-5 mt-4 text-sm font-medium"
                >
                  Representative Documents
                  <span className="text-xs text-blue-300 ml-1">
                    ({filteredRepDocuments.length}{" "}
                    {filteredRepDocuments.length === 1 ? "Doc" : "Docs"})
                  </span>
                </Typography>
              ) : (
                <div className=" p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Typography variant="small" className="text-gray-500 italic">
                    No representative documents found
                  </Typography>
                </div>
              )
            ) : (
              <div className=" p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="small" className="text-gray-500 italic">
                  Document information not available
                </Typography>
              </div>
            )}

            <div
              className="flex flex-col gap-2 h-[210px]"
              style={{
                overflowY: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {(() => {
                let idDocumentCounter = 1;

                return filteredRepDocuments?.map((document, index) => {
                  let documentTypeName;

                  if (document.document_type === "representation letter") {
                    documentTypeName = t("home.representationLetter");
                  } else if (document.document_type === "id") {
                    documentTypeName = `${t(
                      "home.representativeId"
                    )} ${idDocumentCounter}`;
                    idDocumentCounter++;
                  } else {
                    documentTypeName = `${t("home.document")} (${index + 1})`;
                  }

                  const documentName = documentTypeName;
                  const document_type = document.request_document_url
                    .split(".")
                    .pop();
                  const document_status = document.status;
                  const document_id = document.request_document_id;
                  const rejection_reason = document.rejection_reason;

                  const isRepresentationLetter =
                    document.document_type === "representation letter";
                  const isIdDocument = document.document_type === "id";

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
                      className={`flex items-center gap-3 px-3 py-1 rounded-lg shadow-sm transition-all duration-300 ease-in-out bg-blue-50 hover:bg-blue-100`}
                    >
                      <div className="w-10 h-10 flex justify-center items-center border rounded-lg hover:bg-blue-200 transition-all duration-200 ease-in-out text-blue-600 border-blue-300">
                        <DocumentIcon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col text-left ml-2">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-medium text-[12px] hover:text-blue-600 transition-colors duration-200 ease-in-out"
                        >
                          {documentName}
                          {(isRepresentationLetter || isIdDocument) && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              {isRepresentationLetter ? "Letter" : "ID"}
                            </span>
                          )}
                        </Typography>
                        <div className="gap-2 align-baseline">
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
                              ? "text-red-600 font-semibold"
                              : ""
                          }`}
                        >
                          {document_status === "approved"
                            ? t("home.verifiedDocument")
                            : document_status === "pending"
                            ? t("home.pendingDocument")
                            : t("home.rejectedDocument")}
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {filteredDocuments ? (
              filteredDocuments.length > 0 ? (
                <Typography
                  variant="h6"
                  color="blue-gray"
                  className="mb-5 font-medium text-sm"
                >
                  Complaint Documents
                  <span className="text-xs text-blue-300 ml-1">
                    ({filteredDocuments.length}{" "}
                    {filteredDocuments.length === 1 ? "Doc" : "Docs"})
                  </span>
                </Typography>
              ) : (
                <div className=" p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Typography variant="small" className="text-gray-500 italic">
                    No complaint documents found
                  </Typography>
                </div>
              )
            ) : (
              <div className=" p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="small" className="text-gray-500 italic">
                  Document information not available
                </Typography>
              </div>
            )}

            <div
              className="flex flex-col gap-2 mb-4 h-[50%] "
              style={{
                overflowY: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {filteredDocuments?.map((document, index) => {
                let documentName = `${t("home.document")} (${index + 1})`;
                let previewDocumentName = `${t("home.document")} `;
                let document_type = document.request_document_url
                  .split(".")
                  .pop();
                let document_status = document.status;
                let document_id = document.request_document_id;
                let rejection_reason = document.rejection_reason;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (
                        ["jpeg", "jpg", "png", "gif", "pdf"].includes(
                          document_type
                        )
                      ) {
                        handleDocumentSelect(
                          document_id,
                          document,
                          documentName,
                          document_status,
                          rejection_reason
                        );
                      }
                    }}
                    className={`flex items-center gap-3 px-3 py-1 rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
                      ["jpeg", "jpg", "png", "gif", "pdf"].includes(
                        document_type
                      )
                        ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
                        : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 flex justify-center items-center border rounded-lg transition-all duration-200 ease-in-out ${
                        ["jpeg", "jpg", "png", "gif", "pdf"].includes(
                          document_type
                        )
                          ? "text-blue-600 border-blue-300 hover:bg-blue-200"
                          : "text-gray-400 border-gray-300"
                      }`}
                    >
                      <DocumentIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left ml-2">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className={`font-medium text-[12px] transition-colors duration-200 ease-in-out ${
                          ["jpeg", "jpg", "png", "gif", "pdf"].includes(
                            document_type
                          )
                            ? "text-gray-800 hover:text-blue-600"
                            : "text-gray-500"
                        }`}
                      >
                        {documentName}
                      </Typography>
                      <div className="gap-2 align-baseline">
                        <div className="text-xs text-gray-600">
                          {document_type}
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div
                        className={`text-xs ${
                          document_status === "pending"
                            ? "text-orange-500"
                            : document_status === "approved"
                            ? "text-green-500"
                            : document_status === "rejected"
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        {document_status === "approved"
                          ? `${t("home.verifiedDocument")}`
                          : document_status === "pending"
                          ? `${t("home.pendingDocument")}`
                          : `${t("home.rejectedDocument")}`}
                      </div>
                      {!["jpeg", "jpg", "png", "gif", "pdf"].includes(
                        document_type
                      ) && (
                        <button
                          onClick={(e) => {
                            handleDocumentSelect(
                              document_id,
                              document,
                              documentName,
                              document_status,
                              rejection_reason
                            );
                          }}
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                          title="Download"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      )}
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

              <div className="ml-auto flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                {selectedDocumentStatus === "rejected" && (
                  <div className="flex items-center gap-2 mr-2">
                    {!uploadedFile ? (
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        <ArrowUpOnSquareIcon className="h-5 w-5" />
                        <span>Reupload</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                        <span
                          className="text-xs max-w-[100px] truncate"
                          title={uploadedFile.name}
                        >
                          {uploadedFile.name}
                        </span>

                        <button
                          onClick={handleRemoveFile}
                          className="text-red-500 hover:text-red-700"
                          title="Remove file"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={handleSubmit}
                          disabled={isUploading}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Submit file"
                        >
                          {isUploading ? (
                            <span>Uploading...</span>
                          ) : (
                            <SendIcon sx={{ height: 16, width: 16 }} />
                          )}
                        </button>
                      </div>
                    )}
                    {uploadError && (
                      <span className="text-xs text-red-500 max-w-[200px] truncate">
                        {uploadError}
                      </span>
                    )}
                  </div>
                )}

                <span
                  className="flex items-center gap-2 text-sm font-medium"
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
                            ${
                              selectedDocumentStatus === "approved"
                                ? "text-green-800"
                                : ""
                            }
                            ${
                              selectedDocumentStatus === "rejected"
                                ? "text-red-800"
                                : ""
                            }
                            ${
                              selectedDocumentStatus === "pending"
                                ? "text-orange-800"
                                : ""
                            }
                            ${
                              selectedDocumentStatus === "unknown"
                                ? "text-gray-800"
                                : ""
                            }
                          `}
                  >
                    {selectedDocumentStatus ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedDocumentStatus === "approved"
                              ? "bg-green-100 text-green-800"
                              : selectedDocumentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedDocumentStatus === "approved"
                            ? `${t("home.verifiedDocument")}`
                            : selectedDocumentStatus === "pending"
                            ? `${t("home.pendingDocument")}`
                            : `${t("home.rejectedDocument")}`}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unknown
                      </span>
                    )}
                  </span>
                </span>
              </div>
            </div>

            <Card className="w-full h-[700px] p-2 bg-white border  shadow-inner">
              {selectedDocument ? (
                <div className="flex justify-center items-center w-full h-full">
                  {selectedDocument.request_document_url?.endsWith(".pdf") ? (
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

          <div className="">
            <Typography
              variant="h6"
              color="blue-gray"
              className="mb-2 mx-4 font-medium text-center"
            >
              Feedbacks
            </Typography>
            {rejectionReasons && rejectionReasons.length > 0 ? (
              <Card className="  border rounded-lg shadow-sm p-2 mb-3">
                {" "}
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
            ) : (
              <RejectionCard
                date={null}
                rejectionReason={null}
                rejectionReasonDescription={null}
                feedback={null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetail;
