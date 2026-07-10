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
  (error) => Promise.reject(error)
);

const judiciaryDirectorService = {
  // Get/assign a case for director review
  getDirectorRequest: async (options = {}) => {
    try {
      const response = await apiService.get('/judiciary-director/get-request', {
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting director request:', error);
      throw error;
    }
  },

  // Get all assigned cases
  getAllAssignedCases: async (params = {}) => {
    try {
      const response = await apiService.get('/judiciary-director/assigned-cases', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          case_status: params.case_status,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting assigned cases:', error);
      throw error;
    }
  },

  // Get assigned case by ID
  getAssignedCaseById: async (id) => {
    try {
      const response = await apiService.get(`/judiciary-director/assigned-cases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting case by ID:', error);
      throw error;
    }
  },

  // Approve case (sends to file organizer)
  approveCase: async (id) => {
    try {
      const response = await apiService.post(`/judiciary-director/approve/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error approving case:', error);
      throw error;
    }
  },

  // Return case to previous stage with reason
  returnCase: async (id, reason) => {
    try {
      const response = await apiService.post(`/judiciary-director/return/${id}`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error returning case:', error);
      throw error;
    }
  }
};

export default judiciaryDirectorService;
