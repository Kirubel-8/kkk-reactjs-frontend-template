import axios from "axios";
import { BASE_URL } from "../../config";
import { setupAuthInterceptor } from "../utils/axiosAuthInterceptor";


const apiService = axios.create({
    baseURL: BASE_URL,
});

// Intercept requests to attach token
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("customerAccountToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        
        // If FormData, let the browser set Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Setup response interceptor for automatic logout on 401
setupAuthInterceptor(apiService);

class DisciplinaryRequestService {
    //  Create new disciplinary complaint
    async createRequest(formData) {
        try {
            const response = await apiService.post(`/disciplinary-request`, formData);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data?.message || "Failed to create disciplinary request"
            );
        }
    }

    // Get all disciplinary complaints of the logged-in user
    async getMyRequests() {
        try {
            const response = await apiService.get(`/disciplinary-request/my-complaints`);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message ||
                "Failed to fetch your disciplinary requests"
            );
        }
    }

    // Get single complaint by ID
    async getRequestById(id) {
        try {
            const response = await apiService.get(`/disciplinary-request/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message ||
                "Failed to fetch disciplinary request details"
            );
        }
    }
    async getAllComplaints(page = 1, limit = 10) {
            try {
                const response = await apiService.get(
                    `/disciplinary-request?page=${page}&limit=${limit}`
                );
                return response.data;
            } catch (error) {
                throw new Error(
                    error.response ?.data ?.message || "Failed to fetch complaints"
                );
            }
        }
        // Update disciplinary complaint
    async updateRequest(complaintId, formData) {
        try {
            const response = await apiService.put(
                `/disciplinary-request/${complaintId}`,
                formData
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message ||
                "Failed to update disciplinary request"
            );
        }
    }

    // Add evidence with file
    async addEvidence(id, formData) {
            try {
                const response = await apiService.post(
                    `/disciplinary-request/${id}/evidence`,
                    formData
                );
                return response.data;
            } catch (error) {
                throw new Error(
                    error.response ?.data ?.message || "Failed to upload evidence"
                );
            }
        }
        //  Upload signature
    async uploadSignature(id, formData) {
        try {
            const response = await apiService.post(
                `/disciplinary-request/${id}/signature`,
                formData
            );
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message || "Failed to upload signature"
            );
        }
    }

    async deleteEvidence(id) {
        try {
            const response = await apiService.delete(`/disciplinary-request/evidence/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message || "Failed to delete evidence"
            );
        }
    }

    // Delete complaint (only owner can delete)
    async deleteRequest(id) {
        try {
            const response = await apiService.delete(`/disciplinary-request/delete/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response ?.data ?.message ||
                "Failed to delete disciplinary request"
            );
        }
    }
  // Modify rejected evidence (replace or delete)
  async modifyRejectedEvidence(evidenceId, action, file = null) {
    try {
      const formData = new FormData();
      formData.append("action", action);
      
      if (file && action === "replace") {
        formData.append("evidence", file); // This should match the multer field name
      }

      const response = await apiService.patch(
        `/disciplinary-request/evidence/${evidenceId}/modify`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error("Modify rejected evidence error:", error);
      console.error("Error response:", error.response?.data);
      // Preserve the full error object so the component can access error.response
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "Failed to modify rejected evidence";
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  // Add new evidence to existing complaint
  async addEvidenceToComplaint(complaintId, file) {
    try {
      const formData = new FormData();
      formData.append("evidence", file); // This should match your uploadSingle field name

      const response = await apiService.post(
        `/disciplinary-request/${complaintId}/evidence/add`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add new evidence"
      );
    }
  }

  // Raise issue for disciplinary complaint
  async raiseIssueDisciplinaryComplaint(disciplinary_complaint_id, data) {
    try {
      return await apiService.post(`/disciplinary-request/raise_issue_disciplinary_complaint/${disciplinary_complaint_id}`, data)
        .then((response) => response.data)
        .catch((error) => { throw new Error(error.response?.data?.error || 'Failed to raise issue disciplinary complaint'); });
    } catch (error) { 
      throw new Error(error.response?.data?.message || 'Failed to raise issue disciplinary complaint'); 
    }
  }

  // Get all rejections for a disciplinary complaint
  async getDisciplinaryComplaintRejections(disciplinary_complaint_id) {
    try {
      const response = await apiService.get(`/disciplinary-request/get_disciplinary_complaint_rejection/${disciplinary_complaint_id}`);
      return response.data.data; // Assuming backend returns { data: [...] }
    } catch (error) {
      console.error("Error fetching disciplinary complaint rejections:", error);
      throw error;
    }
  }

deleteEvidenceFile(evidenceId) {
  return api.delete(`/disciplinary/evidence/${evidenceId}`);
}
}

export default new DisciplinaryRequestService();