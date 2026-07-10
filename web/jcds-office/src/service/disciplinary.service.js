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

class DisciplineCaseService {

  async getDisciplinaryRequesttttt() {
    return apiService
      .get('/case/get-disciplinary-request')
      .then((response) => response.data)
      .catch((error) => {
        console.error('kError response:', error.response);

        throw new Error(error.response?.data?.message || 'Failed to fetch request');
      });
  }

  async getDisciplinaryRequest() {
    try {
      const response = await apiService.get('/case/get-disciplinary-request');
      return response.data; // includes message + complaint
    } catch (error) {
      console.error('Error response:', error.response);
      // Display backend message if available
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch disciplinary request');
    }
  }

  async getAssignedDisciplinaryRequests(status = "all") {
    return apiService
      .get(`/case/assigned-disciplinary-requests?status=${status}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error fetching assigned requests:', error.response);
        throw new Error(error.response?.data?.message || 'Failed to fetch assigned requests');
      });
  }

  async getAssignedDisciplinaryRequestById(disp_id) {
    return apiService
      .get(`/case/disciplinary-requests/${disp_id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error fetching disciplinary request by ID:', error.response);
        throw new Error(error.response?.data?.message || 'Failed to fetch disciplinary request');
      });
  }

  async updateEvidenceFileStatus(id, status, rejection_reason = null) {
    return apiService
      .patch(`/case/disciplinary-evidence-file/${id}/status`, { status, rejection_reason })
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error updating disciplinary evidence:', error.response);
        throw new Error(
          error.response?.data?.message || 'Failed to update disciplinary evidence'
        );
      });
  }

  async processDisciplinaryComplaint(disp_id, action, comment = null) {
    return apiService
      .patch(`/case/disciplinary-complaint/${disp_id}/process`, { action, comment })
      .then((res) => res.data)
      .catch((error) => {
        console.error('Error processing to update disciplinary request status:', error.response);
        throw error;
      });
  }

  async getExpiringDisciplinary() {
    try {
      const response = await apiService.get('/case/get-expiring/disciplinary-request');
      return response.data; // includes message + complaint
    } catch (error) {
      console.error('Error response:', error.response);
      // Display backend message if available
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch disciplinary request');
    }
  }

  async getDecidedDisciplinaryRequests(page = 1, limit = 10) {
    try {
      // Use the new endpoint that fetches cases with CaseDecision (for letter generation)
      const response = await apiService.get('/final-decision/disciplinary-cases-with-decision', {
        params: {
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching disciplinary cases with decision:', error.response);
      throw new Error(error.response?.data?.message || 'Failed to fetch decided disciplinary requests');
    }
  }
}

export default new DisciplineCaseService();
