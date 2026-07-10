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
  (error) => {
    return Promise.reject(error);
  }
);

class Appeal{


  async getDecisionByCaseId(caseId) {
    return apiService
      .get(`/decision/get_decision_by_case_id/${caseId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to fetch decision by case ID");
      });
  }

    async createAppeal(appealData) {
        return apiService
          .post(`/appeal`, appealData)
          .then((response) => {
            return response;
          })
          .catch((error) => {
            throw new Error(
              error.response?.data.error || "Failed to create appeal"
            );
          });
      }
      async getAllAppeals() {
        return apiService
          .get(`/appeal`)
          .then((response) => response.data)
          .catch((error) => {
            throw new Error(
              error.response?.data.error || "Failed to fetch appeal"
            );
          });
      }
     
      async getAppealByCaseId(appealId) {
        return apiService
          .get(`/appeal/${appealId}`)
          .then((response) => response.data)
          .catch((error) => {
            throw new Error(
              error.response.data.error || "Failed to fetch appeal"
            );
          });
      }

      async attachFile(formData) {
        return apiService
          .post(`/appeal/store_document`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => response.data)
          .catch((error) => {
            throw new Error(error.response.data.error || "Failed to attach file");
          });
        }

        async getAllLetterTemplates() {
          return apiService
            .get('/letter-templates')
            .then((response) => response.data)
            .catch((error) => {
              throw new Error(error.response?.data?.error || 'Failed to fetch Letter Templates');
            });
        }
      

}

export default new Appeal();