import axios from "axios";
import { BASE_URL } from "../../config";
import { setupAuthInterceptor } from "../utils/axiosAuthInterceptor";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup request interceptor to automatically add token to all requests
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("customerAccountToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup response interceptor for automatic logout on 401
setupAuthInterceptor(apiService);

class CustomerAuthService {
  async createCustomerAccount(
    firstName,
    lastName,
    phoneNumber,
    email,
    password,
    confirmPassword,
    gender
  ) {
    return apiService
      .post(`/customer-accounts`, {
        first_name: firstName || "",
        last_name: lastName || "",
        phone_number: phoneNumber,
        email: email || null,
        password,
        confirm_password: confirmPassword,
        gender,
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error creating customer account:", error);
        throw error;
      });
  }

  async login(phoneNumber, password) {
    return apiService
      .post(`/customer-accounts/login`, {
        phone_number: phoneNumber,
        password,
      })
      .then((response) => {
        return response;
      })
      .catch((error) => {
        throw error;
      });
  }

  async logout(setToken) {
    const token = localStorage.getItem("customerAccountToken");
    if (token) {
      try {
        await apiService.post(
          `/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        localStorage.removeItem("customerAccountToken");
        setToken(null);
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  }

  async resetPasswordRequest(email) {
    return apiService
      .post(`/auth/reset-password-request`, {
        email,
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in password reset request:", error);
        throw error;
      });
  }

  async resetPassword(newPassword, confirmPassword, token) {
    return apiService
      .post(`/auth/reset-password`, {
        newPassword,
        confirmPassword,
        token,
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error resetting password:", error);
        throw error;
      });
  }

  async verifyOTP(email, phone_number, otp) {
    return apiService
      .post(`/customer-accounts/verify-otp`, {
        email,
        phone_number,
        otp,
      })
      .then((response) => {
        if (response.data.token) {
          localStorage.setItem("customerAccountToken", response.data.token);
        }
        return response;
      })
      .catch((error) => {
        console.error("Error verifying OTP:", error);
        throw error;
      });
  }

  async resendOTP(email, phone_number) {
    return apiService
      .post(`/customer-accounts/resend-otp`, { email, phone_number })
      .then((response) => response)
      .catch((error) => {
        console.error("Error resending OTP:", error);
        throw error;
      });
  }

  async updateCustomerAccount(
    customerId,
    currentPassword,
    newPassword,
    confirmPassword,
    profilePicture
  ) {
    const token = localStorage.getItem("customerAccountToken");

    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const formData = new FormData();
    if (currentPassword) formData.append("current_password", currentPassword);
    if (newPassword) formData.append("new_password", newPassword);
    if (confirmPassword) formData.append("confirm_password", confirmPassword);
    if (profilePicture) formData.append("profile_picture", profilePicture);

    return apiService
      .put(`/customer-accounts/update/${customerId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error updating customer account:", error);
        throw error;
      });
  }

  async getAllCustomers() {
    return apiService
      .get(`/customer-accounts`)
      .then((response) => response)
      .catch((error) => {
        console.error("Error fetching all customers:", error);
        throw error;
      });
  }

  async getCustomerById(id) {
    const token = localStorage.getItem("customerAccountToken");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    return apiService
      .get(`/customer-accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error fetching customer by ID:", error);
        throw error;
      });
  }

  async deleteCustomer(id) {
    return apiService
      .delete(`/customers/${id}`)
      .then((response) => response)
      .catch((error) => {
        console.error("Error deleting customer:", error);
        throw error;
      });
  }

  async resetPasswordRequest(email) {
    return apiService
      .post(`/customer-accounts/reset-password-request`, {
        email,
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error in password reset request:", error);
        throw error;
      });
  }

  async resetPassword(newPassword, confirmPassword, token) {
    return apiService
      .post(`/customer-accounts/reset-password`, {
        newPassword,
        confirmPassword,
        token,
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Error resetting password:", error);
        throw error;
      });
  }

  async updateCustomerName(customerId, fullName) {
    const token = localStorage.getItem("customerAccountToken");
    if (!token) throw new Error("Unauthorized: No token found");
  
    return apiService.put(
      `/customer-accounts/update-name/${customerId}`,
      { full_name: fullName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }  

  getCurrentUserToken() {
    return localStorage.getItem("customerAccountToken");
  }
}

export default new CustomerAuthService();
