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

class RequestedFileService {
  async uploadFiles(formData) {
    console.log("kh Form data:", formData);
    return (
      apiService
        // .post(`/query/requested-upload-files`, formData)
        .post(`/query/requested-upload-files`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((response) => response.data)
        .catch((error) => {
          console.error("kpp Upload error:", error);
          throw new Error(
            error.response?.data.error || "Failed to attach file"
          );
        })
    );
  }

  async removeFile(request_id, fileName) {
    return apiService
      .post(`/query/remove/requested-upload-files`, { request_id, fileName })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to remove files");
      });
  }

  async getRequestedFiles(request_id) {
    return apiService
      .get(`/query/fetch/requested-files/${request_id}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to fetch uploaded files"
        );
      });
  }
}

export default new RequestedFileService();
