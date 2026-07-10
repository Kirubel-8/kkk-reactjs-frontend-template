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

class NotificationService {
  async getUserNotifications(customerId) {
    return apiService
      .get(`/notifications/customer/${customerId}`)
      .then((response) => response.data?.notifications || [])
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to fetch user notifications"
        );
      });
  }

  async markNotificationsAsRead(customerId) {
    return apiService
      .patch(`/notifications/customer/${customerId}/mark-all-read`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to mark notifications as read"
        );
      });
  }

  async markNotificationAsRead(userId, notificationId) {
    return apiService
      .patch(`/notifications/customer/${notificationId}/mark-as-read`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(
          error.response?.data.error || "Failed to mark notification as read"
        );
      });
  }
}

export default new NotificationService();
