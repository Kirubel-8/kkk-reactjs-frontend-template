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

class CourtCategoryService {
  async getCategories() {
    return apiService
      .get(`/court/category`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch court categories"
        );
      });
  }

  async getCategoryById(id) {
    return apiService
      .get(`/court/category/${id}`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch court category"
        );
      });
  }

  async getOffices() {
    return apiService
      .get(`/court/office`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch court offices"
        );
      });
  }

  async getOfficesByCategory(categoryId) {
    return apiService
      .get(`/court/office/by-category/${categoryId}`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch court offices by category"
        );
      });
  }

  async getOfficeById(id) {
    return apiService
      .get(`/court/office/${id}`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch court office"
        );
      });
  }
}

export default new CourtCategoryService();

