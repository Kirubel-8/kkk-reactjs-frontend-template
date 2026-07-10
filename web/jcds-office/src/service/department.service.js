
import axios from 'axios';
import BASE_URL from '../../config';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class DepartmentService {
  async createDepartment(departmentData) {
    return apiService
      .post(`/departments`, departmentData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to create department');
      });
  }

  async getAllDepartments() {
    return apiService
      .get(`/departments`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch departments');
      });
  }

  async getDepartmentById(departmentId) {
    return apiService
      .get(`/departments/${departmentId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch department');
      });
  }

  async updateDepartment(departmentId, departmentData) {
    return apiService
      .put(`/departments/${departmentId}`, departmentData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to update department');
      });
  }

  async deleteDepartment(departmentId) {
    return apiService
      .delete(`/departments/${departmentId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to delete department');
      });
  }
}

export default new DepartmentService();
