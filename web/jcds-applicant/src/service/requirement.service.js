import axios from "axios";
import { BASE_URL } from "../../config";

const apiService = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",

  },
});

class RequirementService {
  async getAllRequirements() {
    return apiService
      .get("/requirement")
      .then((res) => res.data)
      .catch((error) => {
        throw new Error(
          error.response?.data?.message || "Failed to fetch requirements"
        );
      });
  }

}

export default new RequirementService();
