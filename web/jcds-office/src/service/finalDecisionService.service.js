import axios from 'axios';
import BASE_URL from '../../config';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token
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

const finalDecisionService = {
  /**
   * Submit a council member's decision (JSON)
   */
  submitCouncilDecision: async (data) => {
    try {
      console.log('Submitting decision with data:', data);
      const response = await apiService.post('/final-decision/submit-decision', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting council decision:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Get all cases currently under council review
   */
  getCasesUnderCouncilReview: async () => {
    try {
      const response = await apiService.get('/final-decision/council-review');
      return response.data;
    } catch (error) {
      console.error('Error fetching council review cases:', error);
      throw error;
    }
  },
  getAvailableCouncilMembers: async () => {
    try {
      const response = await apiService.get('/final-decision/available-council-members');
      return response.data.members; // return only the array of members
    } catch (error) {
      console.error('Error fetching available council members:', error);
      throw error;
    }
  },
  /**
   * Assign members to one or multiple cases
   * @param {Array} case_ids - Array of case IDs
   * @param {Array} member_ids - Array of member IDs
   */
  assignMembersToCases: async (case_ids, member_ids) => {
    try {
      const response = await apiService.post(`/final-decision/${case_ids[0]}/assign-voters`, {
        case_ids,
        member_ids
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning members to cases:', error);
      throw error;
    }
  },
  getAssignedMembersForCase: async (caseId) => {
    try {
      const response = await apiService.get(`/final-decision/assigned-members/${caseId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching assigned members:', error);
      throw error;
    }
  },
  removeMembersFromCase: async (caseId, memberIds) => {
    try {
      const response = await apiService.post('/final-decision/remove-members', {
        case_id: caseId,
        council_member_ids: memberIds
      });
      return response.data;
    } catch (error) {
      console.error('Error removing members:', error);
      throw error;
    }
  },

  /**
   * Get final decision for a case
   */

  /**
   * Get decision statistics (submitted vs pending + breakdown)
   */
  getDecisionStatistics: async (caseId) => {
    try {
      const response = await apiService.get(`/final-decision/statistics/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching decision statistics:', error);
      throw error;
    }
  },

  /**
   * Get full case details including optional relations
   */
  getCaseDetails: async (caseId) => {
    try {
      const response = await apiService.get(`/final-decision/case-details/${caseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching case details:', error);
      throw error;
    }
  },

  /**
   * Get decision options for main council
   */
  getDecisionOptions: async () => {
    try {
      const response = await apiService.get('/final-decision/decision-options');
      return response.data;
    } catch (error) {
      console.error('Error fetching decision options:', error);
      throw error;
    }
  },

  /**
   * Get user vote status
   */
  getUserVoteStatus: async (case_id) => {
    try {
      const response = await apiService.get(`/final-decision/user-vote-status/${case_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user vote status:', error);
      throw error;
    }
  },

  getTotalVotingMembers: async () => {
    try {
      const response = await apiService.get('/final-decision/total-voting-members');
      return response.data;
    } catch (error) {
      console.error('Error getting total voting members:', error);
      throw error;
    }
  },
  getFinalDecision: async (caseId) => {
    try {
      const response = await apiService.get(`/final-decision/council/final/decision/${caseId}`);
      return response.data;
    } catch (error) {
      // Return a consistent structure even if endpoint doesn't exist yet
      if (error.response?.status === 404) {
        return {
          success: false,
          finalDecision: null,
          message: 'Final decision not available yet'
        };
      }
      console.error('Error fetching final decision:', error);
      throw error;
    }
  }
};

export default finalDecisionService;
