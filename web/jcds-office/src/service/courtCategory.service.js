import axios from "axios";
import BASE_URL from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

class CourtCategoryService {
  async createCategory(data) {
    return apiService
      .post(`/court/category`, data)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to create category");
      });
  }

  async getCourtCategories() {
    return apiService
      .get(`/court/category`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to fetch categories");
      });
  }

  async getCategoryById(id) {
    return apiService
      .get(`/court/category/${id}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to fetch category");
      });
  }

  async updateCategory(id, data) {
    return apiService
      .put(`/court/category/${id}`, data)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to update category");
      });
  }

  async deleteCourtCategory(id) {
    console.log("cckkkkkkkcc", id)
    return apiService
      .delete(`/court/category/${id}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to delete category");
      });
  }

  async createOffice(data) {
    return apiService
      .post(`/court/office`, data)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to create office");
      });
  }

  async getAllOffices() {
    return apiService
      .get(`/court/office`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to fetch offices");
      });
  }

  async getOfficeById(id) {
    return apiService
      .get(`/court/office/${id}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to fetch office");
      });
  }

  async updateOffice(id, data) {
    return apiService
      .put(`/court/office/${id}`, data)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to update office");
      });
  }

  async deleteOffice(id) {
    return apiService
      .delete(`/court/office/${id}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to delete office");
      });
  }

  async getOfficesByCategory(categoryId) {
    return apiService
      .get(`/court/office/by-category/${categoryId}`)
      .then((res) => res.data)
      .catch((err) => {
        throw new Error(err.response?.data.error || "Failed to fetch offices by category");
      });
  }
}

export default new CourtCategoryService();
