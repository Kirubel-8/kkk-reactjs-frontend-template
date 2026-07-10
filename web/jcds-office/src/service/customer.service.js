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
class CustomerService {
  async getAllCustomers() {
    return apiService
      .get(`/customer-accounts`)
      .then((response) => response.data)
      .catch((error) => {
        console.error('Error fetching all customers:', error);
        throw new Error(error.response?.data.error || 'Failed to fetch all Customers');
      });
  }

  async updateCustomerStatus(customerId, status) {
    return apiService
      .put(`/customer-accounts/${customerId}`, { status })
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error updating status for customer ID ${customerId}:`, error);
        throw new Error(error.response?.data.message || 'Failed to update customer status');
      });
  }

  async deleteCustomer(customerId) {
    return apiService
      .delete(`/customer-accounts/${customerId}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error deleting customer ID ${customerId}:`, error);
        throw new Error(error.response?.data.message || 'Failed to delete customer');
      });
  }
}
export default new CustomerService();
