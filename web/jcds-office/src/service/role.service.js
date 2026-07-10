import axios from 'axios';
import BASE_URL from '../../config';
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('authToken')}`
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
class RoleService {
  async createRole(roleData) {
    return apiService
      .post(`/roles`, roleData)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        throw new Error(error.response?.data.error || 'Failed to create role');
      });
  }
  async getAllRoles({ page, limit }) {
    const params = { page, limit };
    return apiService
      .get(`/roles`, {
        params: params
      })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch role');
      });
  }
  async deleteRole(roleId) {
    return apiService
      .delete(`/roles/${roleId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to delete role');
      });
  }
  async updateRole(roleId, roleData) {
    return apiService
      .put(`/roles/${roleId}`, roleData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to update role');
      });
  }
  async getRoleById(roleId) {
    return apiService
      .get(`roles/${roleId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch role');
      });
  }
}
export default new RoleService();
