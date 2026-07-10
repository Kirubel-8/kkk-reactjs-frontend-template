
import axios from "axios";
import BASE_URL from "../../config";
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
     "Authorization": `Bearer ${localStorage.getItem("authToken")}`
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
class ZoneService {
        async createzone(zoneData) {
            console.log(zoneData);
          return apiService
            .post(`/zone`, zoneData)
            .then((response) => {
              return response;
            })
            .catch((error) => {
              throw new Error(error.response?.data.error || "Failed to create zone");
            });
        }
  async getAllZone() {
    return apiService
      .get(`/zone`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to fetch zone");
      });
  }
  async deleteZone(zoneId) {
    
    return apiService
      .delete(`/zone/${zoneId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to delete zone");
      });
  }
  async updateZone(zoneId, zoneData) {

    return apiService
      .put(`/zone/${zoneId}`, zoneData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to update zone");
      });
  }
  async getZoneById(zoneId) {
    return apiService
      .get(`/zone/${zoneId}`)

      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data.error || "Failed to fetch zone");
      });
  }
  
  async getZonesByRegionId(regionId) {
    return apiService
      .get(`zone/region/${regionId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error ||
            "Failed to fetch zones for the given region"
        );
      });
  }

    }
export default new ZoneService();
