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

const getDocumentRequests = (params) => {
  return apiService.get('/court-office/document-requests', { params });
};

const getRequestById = (id) => {
  return apiService.get(`/court-office/document-requests/${id}`);
};

const uploadDocuments = (id, formData) => {
  return apiService.post(`/court-office/upload/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const returnEmpty = (id, reason) => {
  return apiService.post(`/court-office/return-empty/${id}`, { reason });
};

const getUploadedDocuments = (id) => {
  return apiService.get(`/court-office/uploaded/${id}`);
};

const courtOfficeService = {
  getDocumentRequests,
  getRequestById,
  uploadDocuments,
  returnEmpty,
  getUploadedDocuments
};

export default courtOfficeService;
