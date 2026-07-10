import axios from "axios";
import BASE_URL from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
class CompliantService {
  async getCompliantRequest() {
    return apiService
      .post('/complaints/get_complaint')
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Unable to load complaint request. Please try again.'
        );
      });
  }

  async getAllRequestCompliantRequest(status, page = 1, limit = 10) {
    try {
      console.log("status", status)
      const response = await apiService.get('/complaints/get_all_complaint', {
        params: { status, page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch all complaint requests'
      );
    }
  }
  async getCompliantRequestById(compliant_id) {
    console.log("compliant_id", compliant_id)
    try {
      return apiService
        .get(`/complaints/get_compliant_by_id/${compliant_id}`)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response.data.error || 'Failed to fetch department');
        });
    }
    catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch compliant request detail');
    }
  }
  async approveCompliantEvidence(complaint_evidence_id) {
    try {
      return apiService
        .put(`/complaints/approve_evidence/${complaint_evidence_id}`)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response.data.error || 'Failed to approve evidence');
        });
    }
    catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve evidence');
    }
  }
 
  async rejectCompliantEvidence(complaint_evidence_id, data) {
  try {
    const response = await apiService.put(
      `/complaints/reject_evidence/${complaint_evidence_id}`,
      data
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to reject evidence'
    );
  }
}


  async approveComplaint(complaint_id) {
    try {
      return apiService
        .put(`/complaints/approve_complaint/${complaint_id}`)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response.data.error || 'Failed to approve compliant');
        });
    }
    catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve compliant');
    }
  }
  async rejectComplaint(complaint_id, data) {
    try {
      return await apiService
        .put(`/complaints/reject_complaint/${complaint_id}`, data)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response?.data?.error || 'Failed to reject complaint');
        });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject complaint');
    }
  }

  async returnComplaint(complaint_id, data) {
    try {
      return await apiService
        .put(`/complaints/return_complaint/${complaint_id}`, data)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response?.data?.error || 'Failed to return complaint');
        });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to return complaint');
    }
  }
  
  async raiseIssueComplaint(complaint_id, data) {
    try {
      return await apiService
        .post(`/complaints/raise_issue_complaint/${complaint_id}`, data)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response?.data?.error || 'Failed to raise issue complaint');
        });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to raise issue complaint');
    }
  }


  async uploadNoteAndFile(formData) {

    return apiService
      .post(`/complaints/upload_investigation`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error creating complaint:", error);
        throw error;
      });
  }

  async updateInvestigationAttachment(case_attachment_id, formData) {
    return apiService
      .put(`/complaints/case-attachments/${case_attachment_id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error updating investigation attachment:", error);
        throw error;
      });
  }

  async deleteInvestigationAttachment(case_attachment_id) {
    return apiService
      .delete(`/complaints/case-attachments/${case_attachment_id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error deleting investigation attachment:", error);
        throw error;
      });
  }

  async bulkUpdateAttachments(formData) {
    try {
      const response = await apiService.post(
        `/complaints/case-attachments/bulk`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error bulk updating attachments:", error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to bulk update attachments"
      );
    }
  }

  async createDecisionRecommendation(payload) {
    try {
      const response = await apiService.post(
        `/complaints/decision-recommendations`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create decision recommendation"
      );
    }
  }

  async getDecisionRecommendations(complaintId) {
    try {
      const params = complaintId ? { complaint_id: complaintId } : {};
      const response = await apiService.get(
        `/complaints/decision-recommendations`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to load decision recommendations"
      );
    }
  }

  async updateDecisionRecommendation(id, payload) {
    try {
      const response = await apiService.put(
        `/complaints/decision-recommendations/${id}`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update decision recommendation"
      );
    }
  }

  async deleteDecisionRecommendation(id, payload) {
    try {
      const response = await apiService.delete(
        `/complaints/decision-recommendations/${id}`,
        { data: payload }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to delete decision recommendation"
      );
    }
  }

  async getExpiringComplaint() {
    try {
      const response = await apiService.get('/complaints/get-expiring/complaint-request');
      return response.data; // includes message + complaint
    } catch (error) {
      console.error('Error response:', error.response);
      // Display backend message if available
      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Unable to load expiring complaint requests. Please try again.'
      );
    }
  }
}
export default new CompliantService();

