import axios from "axios";
import { BASE_URL } from "../../config";
import { setupAuthInterceptor } from "../utils/axiosAuthInterceptor";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("customerAccountToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup response interceptor for automatic logout on 401
setupAuthInterceptor(apiService);

/**
 * Removes empty string entries from FormData so optional fields don't fail validation.
 */
const sanitizeFormData = (formData) => {
  const cleaned = new FormData();
  formData.forEach((value, key) => {
    if (value instanceof File) {
      cleaned.append(key, value);
      return;
    }
    if (typeof value === "string" && value.trim() === "") return;
    cleaned.append(key, value);
  });
  return cleaned;
};

class ComplaintService {
  // Submit a new complaint
  async createComplaint(formData) {
    // Create FormData for multipart/form-data upload
    const data = new FormData();
    // Map judge information
    if (formData.judgeInfo) {
      data.append("complainant_address", formData.judgeInfo.region || "");
      data.append("judge_name", formData.judgeInfo.judgeFullName || "");
      data.append("judge_court", formData.judgeInfo.servingPlace || "");
      data.append("court_office_id", formData.judgeInfo.courtOfficeId || "");
      data.append("case_file_number", formData.judgeInfo.caseFileNumber || "");
      data.append("case_type", formData.judgeInfo.caseType || "");
      data.append("act_date", formData.judgeInfo.incidentDate || "");
      data.append(
        "detailed_description",
        formData.description.description || ""
      );

      // Damage description can come from judgeInfo or documents step
      const damageDesc =
        formData.description.damageDescription ||
        formData.documents?.damageDescription ||
        "";
      data.append("damage_description", damageDesc);
    }

    // Map witness information
    if (
      formData.witnessInfo?.witnesses &&
      formData.witnessInfo.witnesses.length > 0
    ) {
      // Convert witnesses array to the format expected by API
      const witnessesData = formData.witnessInfo.witnesses.map((witness) => ({
        witness_name: witness.fullName,
        witness_phone_number: witness.phoneNumber,
      }));

      // Send witnesses as JSON string
      data.append("witnesses", JSON.stringify(witnessesData));

      // Append witness signatures (images)
      formData.witnessInfo.witnesses.forEach((witness) => {
        if (witness.signature) {
          data.append("witness_signatures", witness.signature);
        }
      });
    }

    // Map documents/evidence files
    if (
      formData.documents?.documents &&
      formData.documents.documents.length > 0
    ) {
      formData.documents.documents.forEach((doc) => {
        if (doc.file) {
          data.append("evidence_files", doc.file);
        }
      });
    }

    // Add applicant signature if available
    if (formData.documents?.signature) {
      data.append("applicant_signature", formData.documents.signature);
    }

    // Additional explanation field (optional)
    if (formData.documents?.damageDescription) {
      data.append(
        "additional_explanation",
        formData.documents.damageDescription
      );
    }

    return apiService
      .post(`/complaints`, data, {
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

  // Get all complaints for the authenticated user
  async getAllComplaints() {
    return apiService
      .get(`/complaints`)
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error fetching complaints:", error);
        throw error;
      });
  }

  // Get a specific complaint by ID
  async getComplaintById(id) {
    return apiService
      .get(`/complaints/get_compliant_by_id/${id}`)
      .then((response) => {
        // Backend returns { complaint: {...} }, extract the complaint object
        const data = response.data || response;
        return data.complaint || data;
      })
      .catch((error) => {
        console.error("Error fetching complaint:", error);
        throw error;
      });
  }

  // Update a complaint
  async updateComplaint(id, updateData) {
    const payload =
      updateData instanceof FormData ? sanitizeFormData(updateData) : updateData;
    return apiService
      .put(`/complaints/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error updating complaint:", error);
        throw error;
      });
  }

  // Delete a complaint
  async deleteComplaint(id) {
    return apiService
      .delete(`/complaints/${id}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error deleting complaint:", error);
        throw error;
      });
  }

  async modifyComplaintEvidence(evidenceId, action, file = null) {
    const formData = new FormData();
    formData.append("action", action);

    if (action === "replace" && file) {
      formData.append("evidence", file);
    }

    return apiService
      .patch(`/complaints/evidence/${evidenceId}/modify`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error modifying complaint evidence:", error);
        throw error;
      });
  }

  // Raise issue for a complaint
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

  // Get all complaint rejections
  async getComplaintRejections(complaint_id) {
    try {
      return await apiService
        .get(`/complaints/get_complaint_rejection/${complaint_id}`)
        .then((response) => {
          return response.data?.data || response.data || [];
        })
        .catch((error) => {
          console.error("Error fetching complaint rejections:", error);
          throw new Error(error.response?.data?.error || 'Failed to fetch complaint rejections');
        });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaint rejections');
    }
  }
}

export default new ComplaintService();
