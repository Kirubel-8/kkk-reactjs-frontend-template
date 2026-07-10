// permission.service.js

import axios from "axios";
import BASE_URL from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
     "Authorization": `Bearer ${localStorage.getItem("authToken")}`
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
class PermissionService {
  async createPermission(permissionData) {
    return apiService
      .post(`/permissions`, permissionData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to create permission");
      });
  }

  async getAllPermissions() {
    return apiService
      .get(`/permissions`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch permissions");
      });
  }

  async getPermissionById(permissionId) {
    return apiService
      .get(`/permissions/${permissionId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch permission");
      });
  }

  async updatePermission(permissionId, permissionData) {
    return apiService
      .put(`/permissions/${permissionId}`, permissionData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to update permission");
      });
  }

  async deletePermission(permissionId) {
    return apiService
      .delete(`/permissions/${permissionId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to delete permission");
      });
  }
}

export default new PermissionService();
