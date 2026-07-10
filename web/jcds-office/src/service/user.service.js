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

class UserService {
  async createUser(userData) {
    const formData = new FormData();

    formData.append('first_name', userData.first_name);
    formData.append('middle_name', userData.middle_name);
    formData.append('last_name', userData.last_name);
    formData.append('email', userData.email);
    formData.append('gender', userData.gender);

    userData.role_id.forEach((roleId) => {
      formData.append('role_ids[]', roleId);
    });

    if (userData.signature) {
      formData.append('signature', userData.signature);
    }

    if (userData.titer) {
      formData.append('titer', userData.titer);
    }

    return apiService
      .post('/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error('Upload error:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to create user');
      });
  }

  async getAllUsers({ page, limit, search }) {
    const params = { page, limit };
    if (search) {
      params.search = search;
    }
    return apiService
      .get(`/users`, {
        params: params
      })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch users');
      });
  }

  async getUserById(userId) {
    return apiService
      .get(`/users/${userId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch user');
      });
  }

  async getUserProfile() {
    return apiService
      .get('/users/me')
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
      });
  }

  async updateUserProfile(userData) {
    return apiService
      .put('/users/me', userData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.message || 'Failed to update user profile');
      });
  }

  async updateUser(userId, userData) {
    const formData = new FormData();

    formData.append('first_name', userData.first_name);
    formData.append('middle_name', userData.middle_name);
    formData.append('last_name', userData.last_name);
    formData.append('email', userData.email);
    formData.append('gender', userData.gender);

    if (Array.isArray(userData.role_ids)) {
      userData.role_ids.forEach((roleId) => {
        formData.append('role_ids[]', roleId);
      });
    }

    if (userData.signature instanceof File) {
      formData.append('signature', userData.signature);
    }

    if (userData.titer instanceof File) {
      formData.append('titer', userData.titer);
    }

    for (let pair of formData.entries()) {
    }

    return apiService
      .put(`/users/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => response.data)
      .catch((error) => {
        console.error('[UpdateUser Error Response]', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Failed to update user');
      });
  }


  async updateUserStatus(userId, status) {
    return apiService
      .put(`/users/${userId}/status`, { status })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.error || 'Failed to update user status');
      });
  }

  async deleteUser(userId) {
    return apiService
      .delete(`/users/${userId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to delete user');
      });
  }

  // Department and role management methods

  async assignUserToDepartment(userId, departmentId, teamId) {
    return apiService
      .post(`/users/assign-department`, { userId, departmentId, teamId })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to assign user to department');
      });
  }

  async removeUserFromDepartment(userId, departmentId) {
    return apiService
      .delete(`/users/${userId}/${departmentId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to remove user from department');
      });
  }

  async assignRoleToUser(userId, roleId) {
    return apiService
      .post(`/users/assign-role`, { userId, roleId })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to assign role to user');
      });
  }

  async removeRoleFromUser(userId, roleId) {
    return apiService
      .delete(`/users/${userId}/${roleId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to remove role from user');
      });
  }

  async getUsersByTeamId(teamId) {
    return apiService
      .get(`/users/team/${teamId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch users by team');
      });
  }
  async changePassword(newUserPassword) {
    return apiService
      .put(`/users`, newUserPassword)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to change password');
      });
  }

  async getUsersByDepartmentId(departmentId) {
    return apiService
      .get(`/users/department/${departmentId}/users`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || 'Failed to fetch users by team');
      });
  }

   async unassignDepartmentAndTeamFromUser(userId, options = { unassignDepartment: true, unassignTeam: true }) {
    return apiService
      .put(`/users/${userId}/unassign`, options)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.error || 'Failed to unassign department/team from user');
      });
  }
}

export default new UserService();
