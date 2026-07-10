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

const fileOrganizerService = {
  getFileOrganizerFiles: async (options = {}) => {
    try {
      const response = await apiService.get('/file/get-disciplinary-request', {
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file organizer files:', error);
      throw error;
    }
  },

  // Get all assigned complaints
  getAllAssignedComplaints: async (params = {}) => {
    try {
      const response = await apiService.get('/file/assigned-complaints', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting assigned complaints:', error);
      throw error;
    }
  },

  // Get assigned disciplinary request by ID
  getAssignedDisciplinaryRequestById: async (id) => {
    try {
      const response = await apiService.get(`/file/assigned-complaints/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting disciplinary request by ID:', error);
      throw error;
    }
  },

  // Update evidence file status
  updateEvidenceFileStatus: async (evidenceId, status) => {
    try {
      const response = await apiService.patch(`/file/evidence/${evidenceId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating evidence file status:', error);
      throw error;
    }
  },

  // Process disciplinary complaint
  processDisciplinaryComplaint: async (complaintId, action, comment = null, additionalData = {}) => {
    try {
      const response = await apiService.post(`/file/disciplinary/${complaintId}/process`, {
        action,
        comment,
        ...additionalData
      });
      return response.data;
    } catch (error) {
      console.error('Error processing disciplinary complaint:', error);
      throw error;
    }
  },

  // Assign to committee (handles files + description + assignment in one call)
  assignToCommittee: async (caseId, formData) => {
    try {
      const response = await apiService.post(`/file/disciplinary/${caseId}/assign-committee`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning to committee:', error);
      throw error;
    }
  }
  ,

  // Get full assigned case detail (committee, case, attachments)
  getAssignedCaseDetail: async (complaintId) => {
    try {
      const response = await apiService.get(`/file/disciplinary/${complaintId}/assigned-detail`);
      return response.data;
    } catch (error) {
      console.error('Error getting assigned case detail:', error);
      throw error;
    }
  },

  // Request documents from court office
  requestCourtOfficeDocuments: async (complaintId) => {
    try {
      const response = await apiService.post(`/file/disciplinary/${complaintId}/request-documents`);
      return response.data;
    } catch (error) {
      console.error('Error requesting court office documents:', error);
      throw error;
    }
  },

  // Remove attachment
  removeAttachment: async (attachmentId) => {
    try {
      const response = await apiService.delete(`/file/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing attachment:', error);
      throw error;
    }
  },
  // Create/Upload files (Immediate)
  uploadFiles: async (caseId, formData) => {
    try {
      const response = await apiService.post(`/file/disciplinary/${caseId}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Bulk update attachments (delete/replace)
  bulkUpdateAttachments: async (caseId, formData) => {
    try {
      const response = await apiService.post(`/file/disciplinary/${caseId}/bulk-update-attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating attachments:', error);
      throw error;
    }
  }
};

export default fileOrganizerService;
