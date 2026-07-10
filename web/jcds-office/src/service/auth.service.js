// auth.service.js

import axios from "axios";
import BASE_URL from "../../config"
const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

class AuthService {
  async login(email, password, setToken, setUser) {
    return apiService
      .post(`/auth/login`, {
        email,
        password,
      })
      .then((response) => {
        if (response.data.token) {
          localStorage.setItem("userToken", response.data.token);
          setToken(response.data.token);
          setUser(response.data.user);

        }
        return response;
      });
  }

  async logout(setToken) {
    const token = localStorage.getItem("userToken");
    console.log(token);
    if (token) {
      try {
        await apiService.post(
          `/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        localStorage.removeItem("userToken");
        localStorage.removeItem("permissions");
        setToken(null);
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  }
  getCurrentUserToken() {
    return localStorage.getItem("userToken");
  }

  async resetpasswordrequest(email) {
    return apiService
      .post(`/auth/reset-password-request`, {
        email,
      })
      .then((response) => {
        return response;
      });
  }
  async resetpassword(newPassword, confirmPassword, token) {
    return apiService
      .post(`/auth/reset-password`, {
        newPassword,
        confirmPassword,
        token,
      })
      .then((response) => {
        return response;
      });
  }
  async getPermissionsByUserId(userId) {
    try {
      const response = await apiService.get(`/auth/permissions/${userId}`);
      return response;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw error;
    }
  }

}

export default new AuthService();
