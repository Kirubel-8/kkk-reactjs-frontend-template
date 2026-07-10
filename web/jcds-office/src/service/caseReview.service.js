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

class CaseReviewService {
  // Unified listing endpoint
  async listComplaintsAndCases(status = 'all', caseStatus = null, page = 1, limit = 10) {
    try {
      const params = { status, page, limit };
      if (caseStatus) {
        params.caseStatus = caseStatus;
      }
      const response = await apiService.get('/complaint-case', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaints and cases');
    }
  }

  // Cases-only overview (used by office table)
  async listCasesOverview(status = 'all', page = 1, limit = 10) {
    try {
      const response = await apiService.get('/complaint-case/cases/get-complaint-cases', {
        params: { status, page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cases overview');
    }
  }

  // Bulk operations
  async bulkApproveReject(complaintIds, action, comment) {
    try {
      const response = await apiService.post('/complaint-case/complaints/bulk-approve-reject', {
        complaint_ids: complaintIds,
        action,
        comment
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to bulk approve/reject complaints');
    }
  }

  // Single complaint operations
  async getComplaintForReviewById(complaintId) {
    try {
      const response = await apiService.get(`/complaint-case/complaints/${complaintId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaint details for review');
    }
  }

  async approveComplaintForCaseReview(complaintId) {
    try {
      const response = await apiService.post(`/complaint-case/complaints/${complaintId}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve complaint for case review');
    }
  }

  async rejectComplaintForCaseReview(complaintId, comment) {
    try {
      const response = await apiService.post(`/complaint-case/complaints/${complaintId}/reject`, {
        comment
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject complaint for case review');
    }
  }

  // Case Decision (Council) methods
  async getCaseDetailForDecision(caseId) {
    try {
      const response = await apiService.get(`/complaint-case/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details for decision');
    }
  }

  async makeDecisionOnCase(caseId, decisionData) {
    try {
      const formData = new FormData();
      formData.append('decision_status_id', decisionData.decision_status_id);
      // Handle null letter_ref_number - send null string or omit if null
      if (decisionData.letter_ref_number !== null && decisionData.letter_ref_number !== undefined) {
        formData.append('letter_ref_number', decisionData.letter_ref_number);
      } else {
        formData.append('letter_ref_number', '');
      }
      if (decisionData.external_decision) {
        formData.append('external_decision', decisionData.external_decision);
      }
      if (decisionData.external_decision_document) {
        formData.append('external_decision_document', decisionData.external_decision_document);
      }
      if (decisionData.decision_document) {
        formData.append('decision_document', decisionData.decision_document);
      }

      const response = await apiService.post(`/complaint-case/cases/${caseId}/decide`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to make decision on case');
    }
  }

  async getDecisionStatuses() {
    try {
      const response = await apiService.get('/complaint-case/decision-statuses');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch decision statuses');
    }
  }
}

export default new CaseReviewService();
