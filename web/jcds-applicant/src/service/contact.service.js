import axios from "axios";
import { BASE_URL } from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

class ContactService {
  async sendContactEmail(data) {
    try {
      const response = await apiService.post("/contact-us", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to send contact email"
      );
    }
  }
}

export default new ContactService();
