import axiosInstance from "./axios";

const authService = {
  //! register
  register: async (userData) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Registration failed" };
    }
  },

  login: async (credentials) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);

      const result = response.data;

      // Save token and user from result.data
      if (result.data?.token) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      throw error.response?.data || { error: "Login failed" };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      throw error.response?.data || { error: "Failed to get user" };
    }
  },

  logout: () => {
    console.log("i am here");
    localStorage.clear();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  getStoredUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },
};

export default authService;
