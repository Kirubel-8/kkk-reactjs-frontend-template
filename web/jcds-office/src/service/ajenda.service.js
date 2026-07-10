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

class AgendaService {
  async createAgenda(agendaData) {
    return apiService
      .post(`/agenda/`, agendaData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to create agenda");
      });
  }

  async getAllAgendas() {
    return apiService
      .get(`/agenda`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch agendas");
      });
  }

  async getAgendaById(agendaId) {
    return apiService
      .get(`/agenda/${agendaId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch agenda");
      });
  }

  async updateAgenda(agendaId, agendaData) {
    return apiService
      .put(`/agenda/${agendaId}`, agendaData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to update agenda");
      });
  }

  async deleteAgenda(agendaId) {
    return apiService
      .delete(`/agenda/${agendaId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to delete agenda");
      });
  }
}

export default new AgendaService();
