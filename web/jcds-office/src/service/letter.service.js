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

const API_URL = '/letters';

const letterService = {
	/**
	 * Get available templates for a decision
	 */
	getTemplates: async (decisionId) => {
		const response = await apiService.get(`${API_URL}/templates/${decisionId}`);
		return response.data;
	},

	/**
	 * Get all saved letters for a decision
	 */
	getLetters: async (decisionId) => {
		const response = await apiService.get(`${API_URL}/${decisionId}`);
		return response.data;
	},

	/**
	 * Get a specific letter by ID
	 */
	getLetter: async (letterId) => {
		const response = await apiService.get(`${API_URL}/letter/${letterId}`);
		return response.data;
	},

	/**
	 * Create a new letter draft
	 */
	createLetter: async (decisionId, letterType, letterContent) => {
		const response = await apiService.post(`${API_URL}/${decisionId}`, {
			letter_type: letterType,
			letter_content: letterContent
		});
		return response.data;
	},

	/**
	 * Update an existing letter draft
	 */
	updateLetter: async (letterId, letterContent) => {
		const response = await apiService.put(`${API_URL}/letter/${letterId}`, {
			letter_content: letterContent
		});
		return response.data;
	},

	/**
	 * Finalize a letter (with optional PDF upload)
	 */
	finalizeLetter: async (letterId, pdfFile = null) => {
		const formData = new FormData();
		if (pdfFile) {
			formData.append('file', pdfFile);
		}
		const response = await apiService.post(`${API_URL}/letter/${letterId}/finalize`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' }
		});
		return response.data;
	},

	/**
	 * Delete a letter draft
	 */
	deleteLetter: async (letterId) => {
		const response = await apiService.delete(`${API_URL}/letter/${letterId}`);
		return response.data;
	}
};

export default letterService;
