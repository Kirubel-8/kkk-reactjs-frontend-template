import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import respondentResponseService from "@/service/respondentResponseService";
import { toast, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

import logo from "/cfms-customer/img/cci_logo.png";
import requestService from "@/service/request.service";
import { Box, CircularProgress } from "@mui/material";

const RespondToRequestCard = ({
  requestId,
  letterFileUrl,
  requestRespondentDataId,
}) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [responseFile, setResponseFile] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDocLoading, setIsDocLoading] = useState(true);
  const [isRespDocLoading, setIsRespDocLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [editingResponseId, setEditingResponseId] = useState(null);
  const [selectedDocUrl, setSelectedDocUrl] = useState(null)
  const content = t("respond.letterContent");
  const displayId = requestId ? requestId.substring(0, 8) : "REQ-2025";

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response =
          await respondentResponseService.getRespondentResponsesByRequestId(
            requestId
          );
        if (response && response.data.length > 0) {
          setIsRespDocLoading(true);

          try {
            const signedUrls = await Promise.all(
              response.data.map(async (resp) => {
                if (resp.response_file_url) {
                  return await requestService.getObsRequestDocumentUrl(
                    resp.response_file_url
                  );
                }
                return null;
              })
            );

            const enrichedResponses = response.data.map((resp, idx) => ({
              ...resp,
              signedUrl: signedUrls[idx],
            }));

            setResponses(enrichedResponses);
          } catch (error) {
            console.error("Could not load document previews:", error);
          } finally {
            setIsRespDocLoading(false);
          }
        } else {
          setResponses([]);
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
        toast.error(t("respond.responseError", { error: error.message }), {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchResponses();
    }
  }, [requestId, t]);

  useEffect(() => {
    if (!letterFileUrl) return;

    let isActive = true;
    setIsDocLoading(true);

    const timer = setTimeout(async () => {
      try {
        const signedUrl = await requestService.getObsRequestDocumentUrl(letterFileUrl);
        if (isActive) {
          setSelectedDocUrl(signedUrl);
          setIsDocLoading(false);
        }
      } catch (error) {
        if (isActive) {
          console.error("Could not load document preview:", error);
          setIsDocLoading(false);
        }
      }
    }, 1500);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [letterFileUrl]);



  const handleFileChange = (e) => {
    setResponseFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingResponseId) {
        const response =
          await respondentResponseService.updateRespondentResponse({
            respondent_response_id: editingResponseId,
            description,
            responseFile,
          });
        toast.success(t("respond.updateSuccess"), {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        const response =
          await respondentResponseService.createRespondentResponse({
            request_id: requestId,
            request_respondent_data_id: requestRespondentDataId,
            description,
            responseFile,
          });
        toast.success(t("respond.responseSuccess"), {
          position: "top-right",
          autoClose: 5000,
        });
      }
      setDescription("");
      setResponseFile(null);
      setEditingResponseId(null);
      const updatedResponses =
        await respondentResponseService.getRespondentResponsesByRequestId(
          requestId
        );
      if (updatedResponses && updatedResponses.data.length > 0) {
        setIsRespDocLoading(true);

        try {
          const signedUrls = await Promise.all(
            updatedResponses.data.map(async (resp) => {
              if (resp.request_document_url) {
                return await requestService.getObsRequestDocumentUrl(
                  resp.response_file_url
                );
              }
              return null;
            })
          );

          const enrichedResponses = updatedResponses.data.map((resp, idx) => ({
            ...resp,
            signedUrl: signedUrls[idx],
          }));

          setResponses(enrichedResponses);
        } catch (error) {
          console.error("Could not load document previews:", error);
        } finally {
          setIsRespDocLoading(false);
        }
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error("Error submitting/updating response:", error);
      toast.error(t("respond.responseError", { error: error.message }), {
        position: "top-right",
        autoClose: 5000,
      });
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (response) => {
    setEditingResponseId(response.respondent_response_id);
    setDescription(response.description);
    setResponseFile(null);
  };

  if (loading) {
    return (
      <div className="w-full lg:px-20 md:px-20 min-h-screen flex flex-col justify-center items-center">
        <p className="text-gray-700">{t("respond.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row max-w-7xl mx-auto my-8 gap-6">
      <div className="lg:w-1/3 bg-gray-100 p-6 flex flex-col items-center text-center rounded-lg shadow-md lg:sticky lg:top-8">
        <img
          src={logo}
          alt={t("respond.sidebarImageAlt")}
          className="w-100 h-48 object-cover rounded-md mb-4"
        />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t("respond.sidebarTitle")}
        </h3>
        <p className="text-gray-600 text-sm">{t("respond.sidebarText")}</p>
      </div>

      <div className="flex-1 bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        <ToastContainer
          position="top-right"
          autoClose={2000}
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
        <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t("respond.title")}</h2>
          <span className="bg-white text-blue-600 text-sm font-medium px-3 py-1 rounded">
            {t("respond.requestId")}: #{displayId}
          </span>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              {t("respond.letter")}
            </h3>
            <p className="text-gray-700 text-sm mb-4 whitespace-pre-line">
              {content}
            </p>

            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                {t("respond.letterAttachment")}
              </h4>

              <div className="relative w-full h-96 border rounded-md">
                {isDocLoading ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      bgcolor: "rgba(255, 255, 255, 0.7)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : selectedDocUrl ? (
                  <iframe
                    src={selectedDocUrl}
                    className="w-full h-96 border rounded-md"
                    title="Letter Preview"
                  />
                ) : (
                  <p className="text-gray-500 text-center py-4">No preview available</p>
                )}
              </div>

              <a
                href={selectedDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm inline-block mt-2 hover:underline"
              >
                {t("respond.openFullDocument")}
              </a>
            </div>
          </div>

          <hr className="border-gray-200" />

          {responses.length > 0 && !editingResponseId ? (
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-4">
                {t("respond.existingResponses")}
              </h3>
              {responses.map((response) => (
                <div
                  key={response.respondent_response_id}
                  className="mb-4 p-4 border border-gray-300 rounded-md relative"
                >
                  {response.status === "pending" && (
                    <button
                      onClick={() => handleEditClick(response)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      aria-label={t("respond.editResponse")}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                  <p className="text-gray-700 text-sm mb-2 leading-relaxed">
                    <strong className="block font-semibold mb-1">
                      {t("respond.yourDescription")}:
                    </strong>
                    {response.description}
                  </p>
                  {response.signedUrl && (
                    <div>
                      <strong>{t("respond.uploadedFile")}:</strong>{" "}
                      <a
                        href={response.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {t("respond.openFullDocument")}
                      </a>
                    </div>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    {t("respond.submittedAt")}:{" "}
                    {new Date(response.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm mb-2 py-5">
                    <strong>{t("respond.status")}:</strong>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${response.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : response.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {response.status.charAt(0).toUpperCase() +
                        response.status.slice(1)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("respond.yourDescription")}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("respond.descriptionPlaceholder")}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="responseFile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("respond.uploadFile")}
                </label>
                <input
                  type="file"
                  id="responseFile"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("respond.acceptedFormats")}
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition text-white 
      ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {editingResponseId
                    ? t("respond.updateButton")
                    : t("respond.submitButton")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RespondToRequestCard;
