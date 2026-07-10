import { createContext, useContext, useEffect, useState } from "react";
import CustomerAuthService from "./service/customer-auth.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("customerAccountToken");
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (phoneNumber, password) => {
    try {
      const response = await CustomerAuthService.login(phoneNumber, password);
      if (response.data.token) {
        localStorage.setItem("customerAccountToken", response.data.token);
        setIsAuthenticated(true);
      }
      return response;
    } catch (error) {
      console.log(error);
      throw new Error(
        error.response?.data.errors ||
          error.response?.data.message ||
          "Failed to login, please try again."
      );
    }
  };

  const logout = async () => {
    try {
      await CustomerAuthService.logout();
      setIsAuthenticated(false);
      localStorage.removeItem("lastRequestType");
      localStorage.removeItem("customerAccountToken");
    } catch (error) {
      throw new Error(error);
    }
  };

  const contextValue = {
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
