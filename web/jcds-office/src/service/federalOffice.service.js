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
  (error) => Promise.reject(error)
);

const API_URL = '/federal-office';

const federalOfficeService = {
  /**
   * Get federal office visible cases (decided with federal-tagged letters)
   */
  getCases: async (page = 1, limit = 10) => {
    const response = await apiService.get(`${API_URL}?page=${page}&limit=${limit}`);
    return response.data;
  }
};

export default federalOfficeService;

