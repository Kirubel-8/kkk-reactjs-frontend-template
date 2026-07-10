import axios from "axios";
import { BASE_URL } from "../../config";

const getToken = () => {
  return localStorage.getItem("customerAccountToken");
};

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class RequestService {
  async createRequest(requestData) {
    const { applicants, respondents, documents, case_type_id, ...data } =
      requestData;

    try {
      const fullRequestData = {
        ...data,
        applicants: applicants.map(
          ({ id_file_front_url, id_file_back_url, ...rest }) => rest
        ),
        respondents,
        documents,
        case_type_id,
      };

      const response = await apiService.post("/requests", fullRequestData);
      const requestId = response.data.request_id;

      let uploadedDocuments = [];

      if (documents && documents.length > 0) {
        uploadedDocuments = await Promise.all(
          documents.map(async (document) => {
            const formData = new FormData();
            formData.append("file", document.file);
            formData.append("request_id", requestId);
            formData.append("document_type", document.type);

            const uploadResponse = await apiService.post(
              "/requests/upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (uploadResponse.status === 201) {
              return uploadResponse.data;
            } else {
              throw new Error("Document upload failed");
            }
          })
        );
      }

      const applicantsFromResponse = response.data.applicants || [];

      await Promise.all(
        applicants.map(async (applicant, index) => {
          const applicant_id = applicantsFromResponse[index]?.applicant_id;
          if (!applicant_id) return;

          if (applicant.id_file_front_url) {
            console.log("Uploading ID front file for applicant:", applicant_id);

            const formData = new FormData();
            formData.append("file", applicant.id_file_front_url);
            formData.append("request_id", requestId);
            formData.append("document_type", "applicantIdFront");
            formData.append("applicant_id", applicant_id);

            await apiService.post("/requests/upload", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          }

          if (applicant.id_file_back_url) {
            console.log("Uploading ID back file for applicant:", applicant_id);

            const formData = new FormData();
            formData.append("file", applicant.id_file_back_url);
            formData.append("request_id", requestId);
            formData.append("document_type", "applicantIdBack");
            formData.append("applicant_id", applicant_id);

            await apiService.post("/requests/upload", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            });
          }
        })
      );

      return response;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  }

  async getRequestById(requestId) {
    try {
      const response = await apiService.get(`/requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request by ID:", error);
      throw error;
    }
  }

  async getObsRequestDocumentUrl(objectKey) {
    try {
      const response = await apiService.get("/requests/documents/signed-url", {
        params: { key: objectKey },
      });
      return response.data.signedUrl;
    } catch (error) {
      console.error("Error fetching OBS pre-signed document URL:", error);
      throw error;
    }
  }

  async getRequestDocuments(requestId) {
    try {
      const response = await apiService.get(`/requests/${requestId}/documents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching request documents:", error);
      throw error;
    }
  }

  async getRequestDocumentStatusCount(requestId) {
    try {
      const response = await apiService.get(
        `/requests/${requestId}/document-status-count`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching document status count:", error);
      throw error;
    }
  }

  async getRequestByCustomerId(customerId, { filter, sortOrder, page, limit }) {
    try {
      const params = {
        filter,
        sortOrder,
        page,
        limit,
      };

      const response = await apiService.get(
        `/requests/customer/${customerId}`,
        {
          params: params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching request by customer ID:", error);
      throw error;
    }
  }

  async updateRequest(requestId, requestData) {
    try {
      const {
        applicants,
        respondents,
        documents,
        documentsToReplace,
        ...data
      } = requestData;
      console.log(requestData);

      const response = await apiService.put(
        `/requests/${requestId}`,
        requestData
      );

      let uploadedDocuments = [];

      if (documents && documents.length > 0) {
        uploadedDocuments = await Promise.all(
          documents.map(async (document) => {
            const formData = new FormData();
            formData.append(
              "replace_document_id",
              document.file.replaceDocumentId
            );
            formData.append("file", document.file);
            formData.append("request_id", requestId);
            formData.append("document_type", document.type);

            const uploadResponse = await apiService.post(
              "/requests/update-upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (uploadResponse.status === 201) {
              return uploadResponse.data;
            } else {
              throw new Error("Document upload failed");
            }
          })
        );
      }

      if (documentsToReplace && documentsToReplace.length > 0) {
        await Promise.all(
          documentsToReplace.map(async (documentId) => {
            const deleteResponse = await apiService.delete(
              `/requests/${requestId}/documents/${documentId}`
            );

            if (deleteResponse.status !== 200) {
              throw new Error(`Failed to remove document ${documentId}`);
            }
          })
        );
      }

      return response;
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  }

  async deleteRequest(requestId) {
    try {
      const response = await apiService.delete(`/requests/${requestId}`);
      return response;
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  }

  async getInrequestForCase(caseId) {
    return apiService
      .get(`/query/fetch/in-request/${caseId}`)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to fetch in request for case"
        );
      });
  }

  async searchRequests(searchQuery) {
    try {
      const params = {
        query: searchQuery,
      };

      const response = await apiService.get("/requests/search", {
        params: params,
      });

      return response.data;
    } catch (error) {
      console.error("Error searching requests:", error);
      throw error;
    }
  }

  async reuploadRequest(documentData) {
    try {
      const formData = new FormData();
      formData.append("file", documentData.document);
      formData.append("request_id", documentData.request_id);
      formData.append("document_id", documentData.document_id);
      formData.append("document_type", documentData.document_type);
      formData.append("status", "pending");
      formData.append("user_id", documentData.user_id);

      const response = await apiService.post("/requests/reupload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error reuploading document:", error);
      throw error;
    }
  }

  // Get disciplinary requests by customer ID
  async getDisciplinaryRequestsByCustomerId(customerId, { filter, sortOrder, page, limit }) {
    try {
      const params = {
        page,
        limit,
      };

      // Add status filter if provided
      if (filter) {
        params.status = filter;
      }

      const response = await apiService.get(
        `/disciplinary-request`,
        {
          params: params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching disciplinary requests by customer ID:", error);
      throw error;
    }
  }

  // Get complaint requests by customer ID
  // Note: Currently using disciplinary endpoint as complaint endpoint doesn't exist yet
  async getComplaintRequestsByCustomerId(customerId, { filter, sortOrder, page, limit }) {
    try {
      const params = {
        page,
        limit,
        requestType: 'complaint' // Add requestType parameter to distinguish
      };

      // Add status filter if provided
      if (filter) {
        params.status = filter;
      }

      const response = await apiService.get(
        `/complaints`,
        {
          params: params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching complaint requests by customer ID:", error);
      throw error;
    }
  }
}

export default new RequestService();
