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
  (error) => {
    return Promise.reject(error);
  }
);

class StatusWithAgendaService {
  async createStatusWithAgenda(statusData) {
    return apiService
      .post(`/status-with-agenda/`, statusData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to create status with agenda");
      });
  }

  async getAllStatusesWithAgendas() {
    return apiService
      .get(`/status-with-agenda`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch statuses with agendas");
      });
  }

  async getStatusWithAgendaById(statusId) {
    return apiService
      .get(`/status-with-agenda/${statusId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch status with agenda");
      });
  }

  async updateStatusWithAgenda(statusId, statusData) {
    return apiService
      .put(`/status-with-agenda/${statusId}`, statusData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to update status with agenda");
      });
  }

  async deleteStatusWithAgenda(statusId) {
    return apiService
      .delete(`/status-with-agenda/${statusId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to delete status with agenda");
      });
  }

  // async getStatusesWithAgendaByUserType() {
  //   return apiService
  //     .get(`/status-with-agenda`)
  //     .then((response) => response.data)
  //     .catch((error) => {
  //       throw new Error(error.response?.data.error || "Failed to fetch statuses with agendas by type");
  //     });
  // }

  async getStatusesWithAgendaByUserType() {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User token not found");
  
    return apiService
      .get(`/status-with-agenda`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch statuses with agendas by type");
      });
  }
  

}

export default new StatusWithAgendaService();
