import axios from "axios";

/**
 * Gets the base path for the application
 * @returns {string} The base path (e.g., "/jcdms-applicant/")
 */
const getBasePath = () => {
  // Use import.meta.env.BASE_URL if available (Vite), otherwise detect from current path
  if (import.meta.env?.BASE_URL) {
    return import.meta.env.BASE_URL;
  }
  
  // Fallback: detect base path from current location
  const pathname = window.location.pathname;
  // If pathname starts with /jcdms-applicant, use that as base
  if (pathname.startsWith('/jcdms-applicant')) {
    return '/jcdms-applicant/';
  }
  
  // Default to root if no base path detected
  return '/';
};

/**
 * Handles 401 Unauthorized errors by logging out the user
 */
export const handleUnauthorized = () => {
  // Clear authentication data
  localStorage.removeItem("customerAccountToken");
  localStorage.removeItem("lastRequestType");
  
  // Get the base path
  const basePath = getBasePath();
  // Ensure base path ends with / for proper URL construction
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
  
  // Only redirect if we're not already on the login page
  const currentPath = window.location.pathname;
  const loginPath = `${normalizedBasePath}auth/sign-in-new`;
  
  if (!currentPath.includes("/auth/sign-in") && !currentPath.includes("/sign-in")) {
    // Redirect to login page with correct base path
    window.location.href = loginPath;
  }
};

/**
 * Checks if the request URL is an authentication endpoint that should not trigger logout
 * @param {string} url - The request URL
 * @returns {boolean} True if it's an auth endpoint that shouldn't trigger logout
 */
const isAuthEndpoint = (url) => {
  if (!url) return false;
  
  const authEndpoints = [
    '/customer-accounts/login',
    '/customer-accounts/verify-otp',
    '/customer-accounts/resend-otp',
    '/auth/reset-password-request',
    '/auth/reset-password',
    '/customer-accounts/reset-password-request',
    '/customer-accounts/reset-password',
  ];
  
  // Check if URL matches any auth endpoint (handles both with and without base URL)
  return authEndpoints.some(endpoint => 
    url.includes(endpoint) || url.endsWith(endpoint)
  );
};

/**
 * Sets up a response interceptor on an axios instance to handle 401 Unauthorized errors
 * @param {AxiosInstance} axiosInstance - The axios instance to add the interceptor to
 */
export const setupAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Check if error is 401 Unauthorized
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url || error.request?.responseURL || '';
        
        // Don't trigger logout for authentication endpoints (login, OTP, password reset)
        // These endpoints can legitimately return 401 for invalid credentials
        if (!isAuthEndpoint(requestUrl)) {
          console.warn("401 Unauthorized detected, logging out user...");
          handleUnauthorized();
        } else {
          console.log("401 on auth endpoint, not logging out:", requestUrl);
        }
      }
      
      // Return the error so it can still be handled by the calling code
      return Promise.reject(error);
    }
  );
};

/**
 * Sets up a global axios response interceptor to handle 401 Unauthorized errors
 * This will automatically logout users when they receive a 401 response
 * Works with both default axios instance and custom instances
 */
export const setupGlobalAuthInterceptor = () => {
  // Add response interceptor to axios default instance
  setupAuthInterceptor(axios);

  // Also set up a global error handler for unhandled promise rejections
  // This catches 401 errors that might not go through axios interceptors
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.response?.status === 401) {
      const requestUrl = event.reason?.config?.url || event.reason?.request?.responseURL || '';
      
      // Don't trigger logout for authentication endpoints
      if (!isAuthEndpoint(requestUrl)) {
        console.warn("401 Unauthorized detected in unhandled rejection, logging out user...");
        handleUnauthorized();
      }
    }
  });
};

