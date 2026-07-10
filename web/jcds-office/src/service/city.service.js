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

class CityService {
  async createCity(cityData) {
    return apiService
      .post(`/city`, cityData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to create city");
      });
  }

  async getAllCities() {
    return apiService
      .get(`/city`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch cities");
      });
  }

  async getCityById(cityId) {
    return apiService
      .get(`/city/${cityId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch city");
      });
  }

  async updateCity(cityId, cityData) {
    return apiService
      .put(`/city/${cityId}`, cityData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to update city");
      });
  }

  async deleteCity(cityId) {
    return apiService
      .delete(`/city/${cityId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to delete city");
      });
  }
}

export default new CityService();
