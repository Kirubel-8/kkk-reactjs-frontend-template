import axios from "axios";
import { BASE_URL } from "../../config";
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("customerAccountToken")}`,
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
class RegionService {
  async createregion(regionData) {
    return apiService
      .post(`/region`, regionData)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to create region"
        );
      });
  }
  async getAllRegion() {
    return apiService
      .get(`/get-addresses`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.error || "Failed to fetch region");
      });
  }

  async getAllAddress(){
    return apiService
      .get(`/region`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.error || "Failed to fetch region");
      });
  }

  async getAllLocations(queryParams = ""){
    const url = queryParams ? `/get-addresses${queryParams}` : `/get-addresses`;
    return apiService
      .get(url)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.error || "Failed to fetch locations");
      });
  }
  async getAllIdTypes() {
    return apiService
      .get(`/id-types`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to fetch region");
      });
  }
  async deleteRegion(regionId) {
    return apiService
      .delete(`/region/${regionId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to delete region");
      });
  }
  async updateRegion(regionId, regionData) {
    return apiService
      .put(`/region/${regionId}`, regionData)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to update region");
      });
  }
  async getRegionById(regionId) {
    return apiService
      .get(`region/${regionId}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response.data.error || "Failed to fetch regions");
      });
  }
}
export default new RegionService();
