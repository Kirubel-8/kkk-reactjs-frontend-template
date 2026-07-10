import axios from 'axios';
import BASE_URL from '../../config';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach token from localStorage
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

const informExpertService = {
  /**
   * Get all cases assigned to the logged-in user's department
   */
  getAssignedCases: async (params = {}) => {
    try {
      const response = await apiService.get('/inform/assigned-cases', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned cases:', error);
      throw error;
    }
  },

  /**
   * Get full detail for a specific assigned case
   */
  getAssignedCaseDetail: async (caseId) => {
    try {
      const response = await apiService.get(`/inform/assigned-cases/${caseId}`);
      return response;
    } catch (error) {
      console.error('Error fetching assigned case detail:', error);
      throw error;
    }
  },

  /**
   * Select a case and notify experts in the department
   */
  selectCaseAndInformExperts: async (caseId) => {
    try {
      const response = await apiService.patch(`/inform/cases/${caseId}/select-and-inform`);
      return response.data;
    } catch (error) {
      console.error('Error selecting case and informing experts:', error);
      throw error;
    }
  },

  /**
   * Get all selected cases for the logged-in user's department
   */
  getSelectedCases: async (params = {}) => {
    try {
      const response = await apiService.get('/inform/selected-cases', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching selected cases:', error);
      throw error;
    }
  },
  assignCaseType: async (case_id, case_type_id) => {
    try {
      const response = await apiService.patch(`/inform/${case_id}/assign-type`, {
        case_type_id
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning case type:', error);
      throw error;
    }
  },
  getCaseTypes: async () => {
    try {
      const response = await apiService.get('/inform/case-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching case types:', error);
      throw error;
    }
  },
  /**
   * Attach expert files to a selected case (multipart/form-data)
   */
  attachFilesToSelectedCase: async (caseId, formData) => {
    try {
      const response = await apiService.post(`/inform/cases/${caseId}/attach-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error attaching files to selected case:', error);
      throw error;
    }
  },
  updateCaseStatusAndPriority: async (caseId, payload) => {
    try {
      const response = await apiService.patch(`/inform/cases/${caseId}/status-priority`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating case status and priority:', error);
      throw error;
    }
  },
  getUserNotifications: async () => {
    try {
      const response = await apiService.get('/inform/my-notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  },
  markAllAsRead: async () => {
    try {
      const response = await apiService.patch('/inform/my-notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },
  // Mark single notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await apiService.patch(`/inform/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  sendAgendaDecission: async (caseId, payload) => {
    try {
      const response = await apiService.post(`/inform/send-agenda-decission/${caseId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error sending agenda decission:', error);
      throw error;
    }
  },

  showAgendaDecision: async (caseId) => {
    try {
      const response = await apiService.get(`/inform/get-agenda-decission/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error showing agenda decision:', error);
      throw error;
    }
  },

  showCommitteReview: async (caseId) => {
    try {
      const response = await apiService.get(`/inform/committe-review/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error showing committee review:', error);
      throw error;
    }
  }
};

export default informExpertService;
