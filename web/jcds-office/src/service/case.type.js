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
class CaseType {
  async createCaseType(typeData) {
    return apiService
      .post(`/case-type/`, typeData)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        throw new Error(error.response?.data.error || 'Failed to create case type');
      });
  }
  async getAllCaseTypes() {
    return apiService
      .get(`/case-type`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || 'Failed to fetch case type');
      });
  }
  async deleteCaseType(typeId) {
    return apiService
      .delete(`/case-type/${typeId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to delete case type');
      });
  }
  async updateCaseType(typeId, typeData) {
    return apiService
      .put(`/case-type/${typeId}`, typeData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to update case type');
      });
  }
  async getCaseTypeById(typeId) {
    return apiService
      .get(`case-type/${typeId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch case type');
      });
  }
}
export default new CaseType();
