import axios from "axios";
import BASE_URL from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class SubCityService {
  async createSubcity(subcityData) {
    return apiService
      .post(`/subcity`, subcityData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to create subcity");
      });
  }

  async getAllSubcities() {
    return apiService
      .get(`/subcity`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch subcities");
      });
  }

  async getSubcityById(subcityId) {
    return apiService
      .get(`/subcity/${subcityId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch subcity");
      });
  }

  async updateSubcity(subcityId, subcityData) {
    return apiService
      .put(`/subcity/${subcityId}`, subcityData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to update subcity");
      });
  }

  async deleteSubcity(subcityId) {
    return apiService
      .delete(`/subcity/${subcityId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to delete subcity");
      });
  }

  async getSubcitiesByCity(cityId) {
    return apiService
      .get(`/city/${cityId}/subcities`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch subcities by city");
      });
  }
}

export default new SubCityService();
