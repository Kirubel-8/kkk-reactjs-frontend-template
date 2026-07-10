import axios from "axios";
import { BASE_URL } from "../../config";
import { setupAuthInterceptor } from "../utils/axiosAuthInterceptor";


const apiService = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "multipart/form-data",
    },
});

// Intercept requests to attach token
apiService.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("customerAccountToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
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

    // Get all complaints with pagination
    async getAllComplaints(page = 1, limit = 10, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...filters
            });

            const response = await apiService.get(
                `/disciplinary-request?${params}`
            );
            
            // Handle empty response gracefully
            if (!response.data) {
                return {
                    discliplinary_complaints: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalCount: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                };
            }
            
            return response.data;
        } catch (error) {
            // Handle empty results or not found gracefully
            if (error.response?.status === 404 || error.response?.status === 400) {
                return {
                    discliplinary_complaints: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalCount: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                };
            }
            throw new Error(
                error.response?.data?.message || "Failed to fetch complaints"
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
}

export default new DisciplinaryRequestService();