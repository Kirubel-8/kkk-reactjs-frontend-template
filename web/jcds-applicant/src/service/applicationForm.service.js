import axios from "axios";
import { BASE_URL } from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("customerAccountToken")}`,
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("customerAccountToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

class ApplicationFormService {
  async submitApplicationForm(formData) {
    return apiService
      .post(`/application-submissions/`, formData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.error || "Failed to submit application form"
        );
      });
  }
}

export default new ApplicationFormService();
