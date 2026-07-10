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

class WoredaService {
  async createWoreda(woredaData) {
    return apiService
      .post(`/woreda`, woredaData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to create woreda"
        );
      });
  }

  async getAllWoredas() {
    return apiService
      .get(`/woreda`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to fetch woredas"
        );
      });
  }

  async getWoredaById(woredaId) {
    return apiService
      .get(`/woreda/${woredaId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch woreda");
      });
  }

  async getWoredasByZoneId(value) {
    return apiService
      .get(`/woreda/woreda-by-zone/${value}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to fetch woredas by zone"
        );
      });
  }

  async updateWoreda(woredaId, woredaData) {
    return apiService
      .put(`/woreda/${woredaId}`, woredaData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to update woreda"
        );
      });
  }

  async deleteWoreda(woredaId) {
    return apiService
      .delete(`/woreda/${woredaId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to delete woreda"
        );
      });
  }
}

export default new WoredaService();
