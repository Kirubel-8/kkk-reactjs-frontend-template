import axios from 'axios';
import BASE_URL from '../../config';

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add the token to requests
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

class TeamService {
  /**
   * Create a new team
   * @param {Object} teamData - Data for the new team (name, department_id, created_by)
   */
  async createTeam(teamData) {
    return apiService
      .post('/teams', teamData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to create team');
      });
  }

  /**
   * Fetch all teams
   */
  async getAllTeams() {
    return apiService
      .get('/teams')
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch teams');
      });
  }

  /**
   * Fetch a team by ID
   * @param {string} teamId - ID of the team
   */
  async getTeamById(teamId) {
    return apiService
      .get(`/teams/${teamId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch team');
      });
  }

  /**
   * Fetch teams by department ID
   * @param {string} departmentId - ID of the department
   */
  async getTeamsByDepartmentId(departmentId) {
    return apiService
      .get(`/teams/department/${departmentId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch teams by department');
      });
  }

  /**
   * Update a team by ID
   * @param {string} teamId - ID of the team to update
   * @param {Object} teamData - Updated data (name, department_id)
   */
  async updateTeam(teamId, teamData) {
    return apiService
      .put(`/teams/${teamId}`, teamData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to update team');
      });
  }

  /**
   * Delete a team by ID
   * @param {string} teamId - ID of the team to delete
   */
  async deleteTeam(teamId) {
    return apiService
      .delete(`/teams/${teamId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to delete team');
      });
  }

  async getTeamsByDepartmentttt(department_id) {
    return apiService
      .get(`/teams/by-department/${department_id}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch teams');
      });
  }

  async getTeamsByDepartment(department_id) {
    return (
      apiService
        .get(`/teams/by-department/${department_id}`)
        // .get(`/teams/by-department/${department_id}`)
        .then((response) => response.data)
        .catch((error) => {
          throw new Error(error.response.data.error || 'Failed to fetch teams');
        })
    );
  }
}

export default new TeamService();
